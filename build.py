from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import glob
import json
import lxml.html
import lxml.etree
import os
import re
import shutil
import subprocess
import sys
import urllib2

with open('./config.json', 'r') as in_file:
    config = json.loads(in_file.read())
    REPO_URL = config['repo_url']
    FIRST_REV = config['first_rev']

API_QUERY = []
if os.path.exists('./key.json'):
    with open('./key.json', 'r') as in_file:
        key = json.loads(in_file.read())
        API_QUERY = [['client_id', key['client_id']],
                     ['client_secret', key['client_secret']]]

def init_repo():
    if not os.path.exists('./ecma262'):
        subprocess.call(['git', 'clone', REPO_URL])

def generate_html(hash, rebase, subdir, use_cache):
    basedir = './history/{}'.format(subdir)
    result = '{}{}.html'.format(basedir, hash)
    if use_cache and os.path.exists(result):
        print('@@@@ skip {}'.format(result))
        return

    print('@@@@ {}'.format(result))

    if rebase:
        ret = subprocess.call(['git',
                               'cherry-pick', hash], cwd='./ecma262')
    else:
        ret = subprocess.call(['git',
                               'checkout', hash], cwd='./ecma262')
    if ret:
        sys.exit(ret)

    ret = subprocess.call(['npm', 'install'], cwd='./ecma262')
    if ret:
        sys.exit(ret)

    indexfile = './ecma262/out/index.html'

    ret = subprocess.call(['npm', 'run', 'build'], cwd='./ecma262')
    if ret:
        sys.exit(ret)

    if not os.path.exists(indexfile):
        # Some intermediate commit might fail building.
        # (and npm returns 0...)
        # Generate an empty file in that case.

        outdir = './ecma262/out/'
        if not os.path.exists(outdir):
            os.makedirs(outdir)

        with open(indexfile, 'w') as f:
            f.write('<html></html>')

    if not os.path.exists(basedir):
        os.makedirs(basedir)
    shutil.copyfile(indexfile, result)

def update_master():
    ret = subprocess.call(['git',
                           'fetch', 'origin', 'master'],
                          cwd='./ecma262')
    if ret:
        sys.exit(ret)

    p = subprocess.Popen(['git',
                          'log', '{}^..{}'.format(FIRST_REV, 'origin/master'),
                          '--pretty=%H'],
                         cwd='./ecma262',
                         stdout=subprocess.PIPE,
                         stderr=subprocess.STDOUT)
    for line in p.stdout:
        hash = line.strip()
        generate_html(hash, False, '', True)
        generate_json(hash, '', True)
    p.wait()

def update_revs():
    with open('./revs.js', 'w') as out_file:
        out_file.write('"use strict";\n')
        out_file.write('var revs = [\n')
        p = subprocess.Popen(['git',
                              'log', '{}^..{}'.format(FIRST_REV, 'origin/master'),
                              '--pretty=["%ci", "%H"],'],
                             cwd='./ecma262',
                             stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT)
        for line in p.stdout:
            out_file.write(line.strip() + '\n')
        p.wait()
        out_file.write('];\n')

pr_pat = re.compile('PR/([0-9]+)/')
def update_prs():
    prs = dict()

    for info_path in glob.glob('./history/PR/*/info.json'):
        pr = pr_pat.search(info_path).group(1)

        if os.path.exists(info_path):
            with open(info_path, 'r') as in_file:
                info = json.loads(in_file.read())

            prs[pr] = info

    with open('./prs.js', 'w') as out_file:
        out_file.write('"use strict";\n')
        out_file.write('var prs = {};\n'.format(json.dumps(prs, indent=1,
                                                           separators=(',', ': '))))

def github_api(url, query=[]):
    print('{}?{}'.format(url, '&'.join(map(lambda x: '{}={}'.format(x[0], x[1]), query))))
    query_string = '&'.join(map(lambda x: '{}={}'.format(x[0], x[1]), API_QUERY + query))
    response = urllib2.urlopen('{}?{}'.format(url, query_string))
    data = json.loads(response.read())
    return data

def github_api_pages(url, query):
    page = 1
    data = github_api(url, query)
    if len(data) == 30:
        while True:
            page += 1
            next_data = github_api(url, query + [['page', str(page)]])
            data += next_data
            if len(next_data) != 30:
                break
    return data

def get_pr(pr):
    data = github_api('https://api.github.com/repos/tc39/ecma262/pulls/{}'.format(pr))

    head = data['head']['sha']
    base = data['base']['sha']
    ref = data['head']['ref']
    login = data['head']['user']['login']
    url = data['head']['repo']['clone_url']
    commits = data['commits_url']
    mergeable = data['mergeable']
    title = data['title']

    basedir = './history/PR/{}'.format(pr)
    if not os.path.exists(basedir):
        os.makedirs(basedir)

    if not mergeable:
        # TODO: add --skip-mergeable option or something
        #print('@@@@ not mergeable')
        #return
        pass

    subprocess.call(['git',
                     'remote', 'add', login, url],
                    cwd='./ecma262')
    ret = subprocess.call(['git',
                           'fetch', login, ref],
                          cwd='./ecma262')
    if ret:
        sys.exit(ret)

    ret = subprocess.call(['git',
                           'checkout', base], cwd='./ecma262')
    if ret:
        sys.exit(ret)

    data = github_api_pages(commits)

    revs = []
    for commit in data:
        hash = commit['sha']
        # TODO: add --rebase option for 2nd param
        # TODO: add --ignore-cache option for the last param
        generate_html(hash, False, 'PR/{}/'.format(pr), True)
        generate_json(hash, 'PR/{}/'.format(pr), True)
        revs.append(hash)
    revs.reverse()

    info = dict()
    info['ref'] = ref
    info['login'] = login
    info['revs'] = revs
    info['base'] = base
    info['title'] = title

    with open('{}/info.json'.format(basedir), 'w') as out_file:
        out_file.write(json.dumps(info))

def get_all_pr():
    data = github_api_pages('https://api.github.com/repos/tc39/ecma262/pulls')
    for pr in data:
        print('@@@@ PR {}'.format(pr['number']))
        get_pr(pr['number'])

def get_text(node):
    return ''.join([x for x in node.itertext()])

def check_id(node):
    if 'id' not in node.attrib:
        return False
    if not node.attrib['id'].startswith('sec-'):
        return False
    return True

def get_sec_nodes(dom):
    return filter(check_id, dom.xpath('//emu-clause') + dom.xpath('//emu-annex'))

def get_sec_list(dom):
    sec_list = []
    sec_num_map = dict()
    sec_title_map = dict()

    for node in get_sec_nodes(dom):
        id = node.attrib['id']

        h1 = node.xpath('./h1')[0]

        secnum = h1.xpath('./span[@class="secnum"]')[0]
        num = get_text(secnum)

        title = get_text(h1).replace(num, '')

        sec_list.append(id)
        sec_num_map[id] = num
        sec_title_map[id] = title

    return sec_list, sec_num_map, sec_title_map

def exclude_subsections(dom, sec_list, sec_num_map, sec_title_map):
    for node in get_sec_nodes(dom):
        id = node.attrib['id']

        num = sec_num_map[id]
        title = sec_title_map[id]

        h1 = lxml.html.Element('h1')
        secnum = lxml.html.Element('span', {'class': 'secnum'})
        secnum.text = num
        h1.append(secnum)
        secnum.tail = title
        h1.tail = '...'

        box = lxml.html.Element('div')
        box.attrib['id'] = 'excluded-' + id
        box.append(h1)

        node.getparent().replace(node, box)

        dom.body.append(node)

def extract_sec_html(dom, sec_list, sec_num_map, sec_title_map):
    sec_data = dict()

    for node in get_sec_nodes(dom):
        id = node.attrib['id']
        num = sec_num_map[id]
        title = sec_title_map[id]
        html = lxml.etree.tostring(node, method='html')

        entry = dict()
        entry['num'] = num
        entry['title'] = title
        entry['html'] = html
        sec_data[id] = entry

    data = dict()
    data['secList'] = sec_list
    data['secData'] = sec_data

    return data

def remove_emu_ids(dom):
    for node in (dom.xpath('//emu-xref') + dom.xpath('//emu-xref') + dom.xpath('//emu-nt')):
        if 'id' in node.attrib:
            node.attrib.pop('id')

def extract_sections(filename, use_cache):
    in_filename = '{}.html'.format(filename)
    out_filename = '{}.json'.format(filename)

    if use_cache and os.path.exists(out_filename):
        print('@@@@ skip {}'.format(out_filename))
        return

    print('@@@@ {}'.format(out_filename))

    with open(in_filename, 'r') as in_file:
        dom = lxml.html.fromstring(in_file.read())

        remove_emu_ids(dom)

        sec_list, sec_num_map, sec_title_map = get_sec_list(dom)
        exclude_subsections(dom, sec_list, sec_num_map, sec_title_map)
        data = extract_sec_html(dom, sec_list, sec_num_map, sec_title_map)

        with open(out_filename, 'w') as out_file:
            out_file.write(json.dumps(data))

def generate_json(hash, subdir, use_cache):
    basedir = './history/{}'.format(subdir)
    extract_sections('{}{}'.format(basedir, hash), use_cache)

def usage():
    print('Usage:')
    print('  build.py init')
    print('  build.py update')
    print('  build.py pr PR_NUMBER')

if len(sys.argv) == 1:
    usage()
    sys.exit()

if sys.argv[1] == 'init':
    init_repo()
elif sys.argv[1] == 'update':
    update_master()
    update_revs()
elif sys.argv[1] == 'pr':
    if len(sys.argv) != 3:
        usage()
        sys.exit()
    if sys.argv[2] == 'all':
        get_all_pr()
        update_prs()
    else:
        get_pr(sys.argv[2])
        update_prs()
elif sys.argv[1] == 'prs':
    update_prs()
else:
    usage()
    sys.exit()
