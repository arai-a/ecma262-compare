#!/usr/bin/env python3

import argparse
import distutils
import distutils.dir_util
import glob
import json
import os
import re
import subprocess
import sys
import urllib.request

with open('./config.json', 'r') as in_file:
    config = json.loads(in_file.read())
    REPO_URL = config['repo_url']
    FIRST_REV = config['first_rev']
    UPDATE_FIRST_REV = config['update_first_rev']
    FIRST_PR = config['first_pr']

API_TOKEN = os.environ.get('GITHUB_TOKEN')
if os.path.exists('./token.json'):
    with open('./token.json', 'r') as in_file:
        token = json.loads(in_file.read())
        API_TOKEN = token['token']

def clone_repo_if_necessary():
    if not os.path.exists('./ecma262'):
        subprocess.call(['git', 'clone', REPO_URL])

def generate_html(hash, subdir):
    basedir = './history/{}'.format(subdir)
    revdir = '{}{}'.format(basedir, hash)

    result = '{}/index.html'.format(revdir, hash)
    if os.path.exists(result):
        print('@@@@ skip {} (cached)'.format(result))
        sys.stdout.flush()
        return False

    print('@@@@ {}'.format(revdir))
    sys.stdout.flush()

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
    result1 = generate_html(hash, '')
    result2 = generate_json(hash, '')
    return result1 or result2

def update_master(count=None):
    ret = subprocess.call(['git',
                           'fetch', 'origin', 'master'],
                          cwd='./ecma262')
    if ret:
        sys.exit(ret)

    p = subprocess.Popen(['git',
                          'log', '{}^..{}'.format(UPDATE_FIRST_REV, 'origin/master'),
                          '--pretty=%H'],
                         cwd='./ecma262',
                         stdout=subprocess.PIPE,
                         stderr=subprocess.STDOUT)
    hashes = []
    for line in p.stdout:
        hashes.append(line.strip().decode('utf-8'))

    i = 1
    for hash in reversed(hashes):
        print('@@@@ {}/{}'.format(i, len(hashes)))
        sys.stdout.flush()
        result = update_rev(hash)
        if count is not None:
            if result:
                count -= 1
                if count == 0:
                    break
        i += 1
    p.wait()

def get_rev_lines(revs):
    p = subprocess.Popen(['git',
                          'log'] + revs
                         + ['--pretty=["%ci", "%H"]'],
                         cwd='./ecma262',
                         stdout=subprocess.PIPE,
                         stderr=subprocess.STDOUT)
    lines = []
    for line in p.stdout:
        lines.append(line.decode('utf-8'))
    p.wait()

    return lines

def update_revs():
    lines = get_rev_lines(['{}^..{}'.format(FIRST_REV, 'origin/master')])

    bases = set()
    prs = get_prs()
    for pr in prs:
        bases.add(prs[pr]["base"])

    for base in bases:
        x = get_rev_lines(['-1', base])[0]
        if x not in lines:
            lines.append(x)

    revs = []

    for line in sorted(lines, reverse=True):
        rev = json.loads(line)[1]
        sections = './history/{}/sections.json'.format(rev)
        if os.path.exists(sections):
            o = json.loads(line.strip())
            rev = dict()
            rev['date'] = o[0]
            rev['hash'] = o[1]
            revs.append(rev)

    revs_txt = json.dumps(revs,
                          indent=1,
                          separators=(',', ': '),
                          sort_keys=True)

    with open('./revs.js', 'w') as out_file:
        out_file.write('"use strict";\n')
        out_file.write('var revs = {};\n'.format(revs_txt))

    with open('./revs.json', 'w') as out_file:
        out_file.write(revs_txt)

pr_pat = re.compile('PR/([0-9]+)/')
def get_prs():
    prs = dict()

    for info_path in glob.glob('./history/PR/*/info.json'):
        pr = pr_pat.search(info_path).group(1)

        if os.path.exists(info_path):
            with open(info_path, 'r') as in_file:
                info = json.loads(in_file.read())

            prs[pr] = info

    return prs

def update_prs():
    prs = get_prs()

    prs_json = json.dumps(prs,
                          indent=1,
                          separators=(',', ': '),
                          sort_keys=True)

    with open('./prs.js', 'w') as out_file:
        out_file.write('"use strict";\n')
        out_file.write('var prs = {};\n'.format(prs_json))

    with open('./prs.json', 'w') as out_file:
        out_file.write(prs_json)

def github_api(url, query=[]):
    query_string = '&'.join(map(lambda x: '{}={}'.format(x[0], x[1]), query))
    url = '{}?{}'.format(url, query_string)
    if API_TOKEN:
        headers = {
            'Authorization': 'token {}'.format(API_TOKEN),
        }
    else:
        headers = {}
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

def is_pr_cached(pr, info):
    with open('./prs.json', 'r') as in_file:
        prs = json.loads(in_file.read())

    if str(pr) in prs:
        prev_info = prs[str(pr)]
        if info['head'] == prev_info['head']:
            return True

    return False

def get_pr_with(pr, info, url):
    if is_pr_cached(pr, info):
        print('@@@@ skip PR {} (cached)'.format(pr))
        sys.stdout.flush()
        return False

    basedir = './history/PR/{}'.format(pr)

    if not os.path.exists(basedir):
        os.makedirs(basedir)

    subprocess.call(['git',
                     'remote', 'add', info['login'], url],
                    cwd='./ecma262')
    ret = subprocess.call(['git',
                           'fetch', info['login'], info['ref']],
                          cwd='./ecma262')
    if ret:
        sys.exit(ret)

    generate_html(info['head'], 'PR/{}/'.format(pr))
    generate_json(info['head'], 'PR/{}/'.format(pr))

    txt = json.dumps(info)

    info_path = '{}/info.json'.format(basedir)
    with open(info_path, 'w') as out_file:
        out_file.write(txt)

    update_rev(info['base'])

    return True

def pr_info(data):
    info = dict()
    info['ref'] = data['head']['ref']
    info['login'] = data['head']['user']['login']
    info['head'] = data['head']['sha']
    info['base'] = data['base']['sha']
    info['title'] = data['title']

    return info

def get_pr(pr):
    data = github_api('https://api.github.com/repos/tc39/ecma262/pulls/{}'.format(pr))

    url = data['head']['repo']['clone_url']
    info = pr_info(data)

    return get_pr_with(pr, info, url)

def get_all_pr(count=None):
    data = github_api_pages('https://api.github.com/repos/tc39/ecma262/pulls')

    prs = []
    for d in reversed(data):
        if d['number'] >= FIRST_PR:
            prs.append(d)

    result_any = False

    i = 1
    for data in prs:
        pr = data['number']
        url = data['head']['repo']['clone_url']
        info = pr_info(data)

        print('@@@@ {}/{} PR {}'.format(i, len(prs), pr))
        sys.stdout.flush()
        result = get_pr_with(pr, info, url)
        if result:
            result_any = True
        if count is not None:
            if result:
                count -= 1
                if count == 0:
                    break
        i += 1

    return result_any

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

def extract_sections(filename):
    in_filename = '{}/index.html'.format(filename)
    out_filename = '{}/sections.json'.format(filename)

    if os.path.exists(out_filename):
        print('@@@@ skip {} (cached)'.format(out_filename))
        sys.stdout.flush()
        return False

    print('@@@@ {}'.format(out_filename))
    sys.stdout.flush()

    import lxml.etree
    import lxml.html

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

def generate_json(hash, subdir):
    basedir = './history/{}'.format(subdir)
    return extract_sections('{}{}'.format(basedir, hash))

def is_rev_cached(hash):
    with open('./revs.json', 'r') as in_file:
        revs = json.loads(in_file.read())

    for rev in revs:
        if rev['hash'] == hash:
            return True

    return False

def has_new_rev():
    data = github_api('https://api.github.com/repos/tc39/ecma262/commits',
                      [['per_page', '1']])
    head = data[0]['sha']

    if not is_rev_cached(head):
        print('head={} is not cached'.format(hash))
        return True

    return False

def has_new_pr():
    data = github_api_pages('https://api.github.com/repos/tc39/ecma262/pulls')

    prs = []
    for d in reversed(data):
        if d['number'] >= FIRST_PR:
            prs.append(d)

    for data in prs:
        pr = data['number']
        info = pr_info(data)
        if not is_pr_cached(pr, info):
            print('PR={} is not cached'.format(pr))
            return True

    return False

def bootstrap():
    has_new = False

    if has_new_rev():
        print('##[set-output name=update_revs;]Yes')
        has_new = True

    if has_new_pr():
        print('##[set-output name=update_prs;]Yes')
        has_new = True

    if has_new:
        print('##[set-output name=update;]Yes')

parser = argparse.ArgumentParser(description='Update ecma262 history data')

parser.add_argument("-t", "--token", help='GitHub personal access token')
subparsers = parser.add_subparsers(dest='command')
subparsers.add_parser("clone", help='Clone ecma262 repository')
parser_update = subparsers.add_parser("update", help='Update all revisions')
parser_update.add_argument("-c", type=int, help='Maximum number of revisions to handle')
subparsers.add_parser("revs", help='Update revs.js')
parser_pr = subparsers.add_parser("pr", help='Update PR')
parser_pr.add_argument("PR_NUMBER", help='PR number, or "all"')
parser_pr.add_argument("-c", type=int, help='Maximum number of PRs to handle')
subparsers.add_parser("prs", help='Update prs.js')
subparsers.add_parser("bootstrap", help='Perform bootstrap for CI')
args = parser.parse_args()

if args.token:
    API_TOKEN = args.token

if args.command == 'clone':
    clone_repo_if_necessary()
elif args.command == 'update':
    update_master(args.c)
    update_revs()
elif args.command == 'revs':
    update_revs()
elif args.command == 'pr':
    if args.PR_NUMBER == 'all':
        result = get_all_pr(args.c)
        if result:
            update_prs()
            update_revs()
    else:
        result = get_pr(args.PR_NUMBER)
        if result:
            update_prs()
            update_revs()
elif args.command == 'prs':
    update_prs()
elif args.command == 'bootstrap':
    bootstrap()
