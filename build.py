#!/usr/bin/python -B

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import glob
import json
import os
import shutil
import subprocess
import sys
import urllib2

REPO_URL = 'https://github.com/tc39/ecma262/'
FIRST_REV = '090e736439a14166bfa2eab2e9f9d94071ec7e94'

API_QUERY = ''
if os.path.exists('./key.json'):
    with open('./key.json', 'r') as in_file:
        key = json.loads(in_file.read())
        API_QUERY = '?client_id={}&client_secret={}'.format(key['client_id'], key['client_secret'])

def init_repo():
    if not os.path.exists('./ecma262'):
        subprocess.call(['git', 'clone', REPO_URL])

def generate_html(hash, rebase, subdir):
    basedir = './history/{}'.format(subdir)
    result = '{}{}.html'.format(basedir, hash)
    if not os.path.exists(result):
        print(hash)

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

        ret = subprocess.call(['npm', 'run', 'build'], cwd='./ecma262')
        if ret:
            sys.exit(ret)

        if not os.path.exists(basedir):
            os.makedirs(basedir)
        shutil.copyfile('./ecma262/out/index.html', result)
    else:
        print('echo skip {}'.format(hash))

def update_master():
    ret = subprocess.call(['git',
                           'fetch', 'origin', 'master'],
                          cwd='./ecma262')
    if ret:
        sys.exit(ret)

    p = subprocess.Popen(['git',
                          'log', '{}..{}'.format(FIRST_REV, 'origin/master'),
                          '--pretty=%H'],
                         cwd='./ecma262',
                         stdout=subprocess.PIPE,
                         stderr=subprocess.STDOUT)
    for line in p.stdout:
        hash = line.strip()
        generate_html(hash, False, '')
    p.wait()

def update_revs():
    with open('./revs.js', 'w') as out_file:
        out_file.write('"use strict";\n')
        out_file.write('var revs = [\n')
        p = subprocess.Popen(['git',
                              'log', '{}..{}'.format(FIRST_REV, 'origin/master'),
                              '--pretty=["%ci", "%H"],'],
                             cwd='./ecma262',
                             stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT)
        for line in p.stdout:
            out_file.write(line.strip() + '\n')
        p.wait()
        out_file.write('];\n')

def update_prs():
    prs = dict()

    for dir in glob.glob('./history/PR/*'):
        if os.path.exists('{}/info.json'.format(dir)):
            pr = os.path.basename(dir)

            with open('{}/info.json'.format(dir), 'r') as in_file:
                info = json.loads(in_file.read())
            prs[pr] = info

    with open('./prs.js', 'w') as out_file:
        out_file.write('"use strict";\n')
        out_file.write('var prs = {};\n'.format(json.dumps(prs)))

def github_api(url):
    response = urllib2.urlopen(url + API_QUERY)
    data = json.loads(response.read())
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

    if not mergeable:
        print("not mergeable")
        sys.exit()

    subprocess.call(['git',
                     'remote', 'add', login, url],
                    cwd='./ecma262')
    ret = subprocess.call(['git',
                           'fetch', login, ref],
                          cwd='./ecma262')
    if ret:
        sys.exit(ret)

    basedir = './history/PR/{}'.format(pr)
    if not os.path.exists(basedir):
        os.makedirs(basedir)

    ret = subprocess.call(['git',
                           'checkout', base], cwd='./ecma262')
    if ret:
        sys.exit(ret)

    data = github_api(commits)

    revs = []
    for commit in data:
        hash = commit['sha']
        generate_html(hash, True, 'PR/{}/'.format(pr))
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

    update_prs()

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
    get_pr(sys.argv[2])
else:
    usage()
    sys.exit()
