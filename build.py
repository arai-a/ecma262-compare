#!/usr/bin/env python3

import argparse
import distutils
import distutils.dir_util
import glob
import json
import lxml.etree
import lxml.html
import os
import re
import subprocess
import sys
import urllib.request

with open('./config.json', 'r') as in_file:
    config = json.loads(in_file.read())
    REPO_URL = config['repo_url']
    FIRST_REV = config['first_rev']
    FIRST_PR = config['first_pr']

API_TOKEN = None
if os.path.exists('./token.json'):
    with open('./token.json', 'r') as in_file:
        token = json.loads(in_file.read())
        API_TOKEN = token['token']

def init_repo():
    if not os.path.exists('./ecma262'):
        subprocess.call(['git', 'clone', REPO_URL])

def generate_html(hash, rebase, subdir, use_cache):
    basedir = './history/{}'.format(subdir)
    revdir = '{}{}'.format(basedir, hash)

    result = '{}/index.html'.format(revdir, hash)
    if use_cache and os.path.exists(result):
        print('@@@@ skip {} (cached)'.format(result), file=sys.stderr)
        return False

    print('@@@@ {}'.format(revdir), file=sys.stderr)

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

    fromdir = './ecma262/out'
    indexfile = '{}/index.html'.format(fromdir)

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
    if os.path.exists(revdir):
        distutils.dir_util.remove_tree(revdir)

    distutils.dir_util.copy_tree(fromdir, revdir)
    return True

def update_rev(hash):
    result1 = generate_html(hash, False, '', True)
    result2 = generate_json(hash, '', True)
    return result1 or result2

def update_master(count=None):
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
    hashes = []
    for line in p.stdout:
        hashes.append(line.strip().decode('utf-8'))

    i = 1
    for hash in reversed(hashes):
        print('@@@@ {}/{}'.format(i, len(hashes)), file=sys.stderr)
        result = update_rev(hash)
        if count is not None:
            if result:
                count -= 1
                if count == 0:
                    break
        i += 1
    p.wait()

def update_revs():
    with open('./revs.js', 'w') as out_file:
        out_file.write('"use strict";\n')
        out_file.write('var revs = [\n')
        p = subprocess.Popen(['git',
                              'log', '{}^..{}'.format(FIRST_REV, 'origin/master'),
                              '--pretty=["%ci", "%H"]'],
                             cwd='./ecma262',
                             stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT)
        for line in p.stdout:
            rev = json.loads(line)[1]
            sections = './history/{}/sections.json'.format(rev)
            if os.path.exists(sections):
                out_file.write(line.strip().decode('utf-8') + ',\n')
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
    query_string = '&'.join(map(lambda x: '{}={}'.format(x[0], x[1]), query))
    url = '{}?{}'.format(url, query_string)
    if API_TOKEN:
        headers = {
            'Authorization': 'token {}'.format(API_TOKEN),
        }
    else:
        headers = NOne
    req = urllib.request.Request(url, None, headers)
    response = urllib.request.urlopen(req)
    data = json.loads(response.read())
    return data

def github_api_pages(url, query=[]):
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
    basedir = './history/PR/{}'.format(pr)

    info_path = '{}/info.json'.format(basedir)

    prev_info = None
    if os.path.exists(info_path):
        with open(info_path, 'r') as in_file:
            prev_info = json.loads(in_file.read())

    data = github_api('https://api.github.com/repos/tc39/ecma262/pulls/{}'.format(pr))

    head = data['head']['sha']
    base = data['base']['sha']
    ref = data['head']['ref']
    login = data['head']['user']['login']
    url = data['head']['repo']['clone_url']
    commits = data['commits_url']
    mergeable = data['mergeable']
    title = data['title']

    revs = []
    data = github_api_pages(commits)
    for commit in data:
        hash = commit['sha']
        revs.append(hash)
    revs.reverse()

    info = dict()
    info['ref'] = ref
    info['login'] = login
    info['revs'] = revs
    info['base'] = base
    info['title'] = title

    if prev_info and info['revs'] == prev_info['revs']:
        print('@@@@ skip PR {} (cached)'.format(pr), file=sys.stderr)
        return False

    for hash in revs:
        print('@@@@ rev {}'.format(hash), file=sys.stderr)

    print('@@@@ base {}'.format(base), file=sys.stderr)

    if not os.path.exists(basedir):
        os.makedirs(basedir)

    if not mergeable:
        # TODO: add --skip-mergeable option or something
        #print('@@@@ not mergeable', file=sys.stderr)
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

    for hash in revs:
        # TODO: add --rebase option for 2nd param
        # TODO: add --ignore-cache option for the last param
        generate_html(hash, False, 'PR/{}/'.format(pr), True)
        generate_json(hash, 'PR/{}/'.format(pr), True)

    txt = json.dumps(info)

    with open(info_path, 'w') as out_file:
        out_file.write(txt)

    update_rev(base)

    return True

def get_all_pr(count=None):
    data = github_api_pages('https://api.github.com/repos/tc39/ecma262/pulls')

    prs = []
    for pr in reversed(data):
        if pr['number'] >= FIRST_PR:
            prs.append(pr)

    i = 1
    for pr in prs:
        print('@@@@ {}/{}'.format(i, len(prs)), file=sys.stderr)
        print('@@@@ PR {}'.format(pr['number']), file=sys.stderr)
        result = get_pr(pr['number'])
        if count is not None:
            if result:
                count -= 1
                if count == 0:
                    break
        i += 1

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
        html = lxml.etree.tostring(node, method='html').decode('utf-8')

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
    in_filename = '{}/index.html'.format(filename)
    out_filename = '{}/sections.json'.format(filename)

    if use_cache and os.path.exists(out_filename):
        print('@@@@ skip {} (cached)'.format(out_filename), file=sys.stderr)
        return False

    print('@@@@ {}'.format(out_filename), file=sys.stderr)

    with open(in_filename, 'r') as in_file:
        dom = lxml.html.fromstring(in_file.read())

        remove_emu_ids(dom)

        sec_list, sec_num_map, sec_title_map = get_sec_list(dom)
        exclude_subsections(dom, sec_list, sec_num_map, sec_title_map)
        data = extract_sec_html(dom, sec_list, sec_num_map, sec_title_map)
        txt = json.dumps(data)

        with open(out_filename, 'w') as out_file:
            out_file.write(txt)
    return True

def generate_json(hash, subdir, use_cache):
    basedir = './history/{}'.format(subdir)
    return extract_sections('{}{}'.format(basedir, hash), use_cache)

parser = argparse.ArgumentParser(description='Update ecma262 history data')

parser.add_argument("-t", "--token", help='GitHub personal access token')
subparsers = parser.add_subparsers(dest='command')
subparsers.add_parser("init", help='Clone ecma262 repository')
parser_update = subparsers.add_parser("update", help='Update all revisions')
parser_update.add_argument("-c", type=int, help='Maximum number of revisions to handle')
subparsers.add_parser("revs", help='Update revs.js')
parser_pr = subparsers.add_parser("pr", help='Update PR')
parser_pr.add_argument("PR_NUMBER", help='PR number, or "all"')
parser_pr.add_argument("-c", type=int, help='Maximum number of PRs to handle')
subparsers.add_parser("prs", help='Update prs.js')
args = parser.parse_args()

if args.token:
    API_TOKEN = args.token

if args.command == 'init':
    init_repo()
elif args.command == 'update':
    update_master(args.c)
    update_revs()
elif args.command == 'revs':
    update_revs()
elif args.command == 'pr':
    if args.PR_NUMBER == 'all':
        get_all_pr(args.c)
        update_revs()
        update_prs()
    else:
        get_pr(args.PR_NUMBER)
        update_revs()
        update_prs()
elif args.command == 'prs':
    update_prs()
