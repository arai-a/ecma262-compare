#!/usr/bin/env python3

import argparse
import distutils
import distutils.dir_util
import json
import os
import subprocess
import sys
import urllib.request


class Logger:
    def log(s):
        print('@@@@ {}'.format(s))

        # Flush to make it apeear immediately in automation log.
        sys.stdout.flush()


def unique(get_key, iterable):
    keys = set()

    result = []
    for item in iterable:
        key = get_key(item)
        if key in keys:
            continue

        keys.add(key)
        result.append(item)

    return result


class FileUtils:
    def read(path):
        with open(path, 'r') as in_file:
            return in_file.read()

    @classmethod
    def read_json(cls, path):
        return json.loads(cls.read(path))

    def write(path, text):
        with open(path, 'w') as f:
            f.write(text)

    def mkdir_p(path):
        if not os.path.exists(path):
            os.makedirs(path)


class Config:
    __config_path = os.path.join('.', 'config.json')

    __config = FileUtils.read_json(__config_path)

    REPO_URL = __config['repo_url']
    API_URL = __config['api_url']
    FIRST_REV = __config['first_rev']
    UPDATE_FIRST_REV = __config['update_first_rev']
    FIRST_PR = __config['first_pr']


class Paths:
    TOKEN_PATH = os.path.join('.', 'token.json')
    HISTORY_DIR = os.path.join('.', 'history')
    REVS_PATH = os.path.join(HISTORY_DIR, 'revs.json')
    PRS_PATH = os.path.join(HISTORY_DIR, 'prs.json')

    @classmethod
    def rev_parent_dir(cls, prnum=None):
        if prnum is not None:
            return os.path.join(cls.HISTORY_DIR, 'PR', str(prnum))
        return cls.HISTORY_DIR

    @classmethod
    def rev_dir(cls, sha, prnum=None):
        return os.path.join(cls.rev_parent_dir(prnum), sha)

    @classmethod
    def pr_info_path(cls, prnum):
        return os.path.join(cls.rev_parent_dir(prnum), 'info.json')

    @classmethod
    def sections_path(cls, sha, prnum=None):
        return os.path.join(cls.rev_dir(sha, prnum), 'sections.json')

    @classmethod
    def index_path(cls, sha, prnum=None):
        return os.path.join(cls.rev_dir(sha, prnum), 'index.html')


class GitHubAPI:
    __API_TOKEN = os.environ.get('GITHUB_TOKEN')
    if not __API_TOKEN and os.path.exists(Paths.TOKEN_PATH):
        __API_TOKEN = FileUtils.read_json(Paths.TOKEN_PATH)['token']

    @classmethod
    def call(cls, path, query=[]):
        query_string = '&'.join(
            map(lambda x: '{}={}'.format(x[0], x[1]),
                query))

        url = '{}{}?{}'.format(Config.API_URL, path, query_string)
        if cls.__API_TOKEN:
            headers = {
                'Authorization': 'token {}'.format(cls.__API_TOKEN),
            }
        else:
            headers = {}

        req = urllib.request.Request(url, None, headers)
        response = urllib.request.urlopen(req)
        return json.loads(response.read())

    @classmethod
    def call_pages(cls, path, query=[]):
        page = 1
        data = cls.call(path, query)
        if len(data) == 30:
            while True:
                page += 1
                next_data = cls.call(path, query + [['page', str(page)]])
                data += next_data
                if len(next_data) != 30:
                    break
        return data


class RemoteRepository:
    def prs():
        prs = []
        for d in GitHubAPI.call_pages('pulls'):
            if d['number'] >= Config.FIRST_PR:
                prs.append(d)

        return prs

    def head():
        return GitHubAPI.call('commits', [['per_page', '1']])[0]['sha']

    def pr(prnum):
        return GitHubAPI.call('pulls/{}'.format(prnum))


class PRInfo:
    def create(data):
        return {
            'ref': data['head']['ref'],
            'login': data['head']['user']['login'],
            'head': data['head']['sha'],
            'base': data['base']['sha'],
            'title': data['title'],
            'created_at': data['created_at'],
            'updated_at': data['updated_at'],
        }

    def parents(info):
        parents = info['revs'][-1]['parents']
        return parents.split(' ')


class CacheChecker:
    @classmethod
    def has_new_rev(cls):
        head = RemoteRepository.head()
        if not cls.is_rev_cached(head):
            print('head={} is not cached'.format(head))
            return True

        return False

    @classmethod
    def has_new_pr(cls):
        for data in RemoteRepository.prs():
            prnum = data['number']
            info = PRInfo.create(data)
            if not cls.is_pr_cached(prnum, info):
                print('PR={} is not cached'.format(prnum))
                return True

        return False

    def is_rev_cached(sha):
        revs = FileUtils.read_json(Paths.REVS_PATH)
        for rev in revs:
            if rev['hash'] == sha:
                return True

        return False

    def is_pr_cached(prnum, info):
        prs = FileUtils.read_json(Paths.PRS_PATH)
        if str(prnum) not in prs:
            return False

        prev_info = prs[str(prnum)]
        return info['head'] == prev_info['head']

    def has_sections_json(rev):
        return os.path.exists(Paths.sections_path(rev['hash']))


class LocalRepository:
    DIR = os.path.join('.', 'ecma262')
    URL = Config.REPO_URL

    @classmethod
    def clone(cls):
        if not os.path.exists(cls.DIR):
            subprocess.run(['git', 'clone', cls.URL],
                           check=True)

    @classmethod
    def checkout(cls, sha):
        subprocess.run(['git', 'checkout', sha],
                       cwd=cls.DIR,
                       check=True)

    @classmethod
    def fetch(cls, remote, branch):
        subprocess.run(['git', 'fetch', remote, branch],
                       cwd=cls.DIR,
                       check=True)

    @classmethod
    def log(cls, params):
        p = subprocess.Popen(['git', 'log'] + params,
                             cwd=cls.DIR,
                             stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT)
        for line in p.stdout:
            yield line.strip().decode('utf-8')
        p.wait()

    @classmethod
    def add_remote(cls, name, url):
        subprocess.run(['git', 'remote', 'add', name, url],
                       cwd=cls.DIR,
                       check=False)

    @classmethod
    def revs(cls, revset):
        pretty = '%n'.join([
            'hash:%H',
            'parents:%P',
            'author:%an',
            'date:%cI',
            'adate:%aI',
            'subject:%s',
        ])

        revs = []
        rev = dict()
        for line in cls.log(revset + ['--pretty={}%n=='.format(pretty)]):
            if line == '==':
                revs.append(rev)
                rev = dict()
            else:
                (name, value) = line.split(':', 1)
                rev[name] = value

        return revs


class SectionsExtractor:
    def __get_text(node):
        return ''.join([x for x in node.itertext()])

    def __is_section(node):
        if 'id' not in node.attrib:
            return False
        return node.attrib['id'].startswith('sec-')

    @classmethod
    def __get_sec_nodes(cls, dom):
        return filter(
            cls.__is_section,
            dom.xpath('//emu-clause') + dom.xpath('//emu-annex')
        )

    @classmethod
    def __get_sec_list(cls, dom):
        sec_list = []
        sec_num_map = dict()
        sec_title_map = dict()

        for node in cls.__get_sec_nodes(dom):
            id = node.attrib['id']

            h1 = node.xpath('./h1')[0]

            secnum = h1.xpath('./span[@class="secnum"]')[0]
            num = cls.__get_text(secnum)

            title = cls.__get_text(h1).replace(num, '')

            sec_list.append(id)
            sec_num_map[id] = num
            sec_title_map[id] = title

        return sec_list, sec_num_map, sec_title_map

    @classmethod
    def __exclude_subsections(cls, dom, sec_list, sec_num_map, sec_title_map):
        import lxml.html

        for node in cls.__get_sec_nodes(dom):
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

    @classmethod
    def __to_data(cls, dom, sec_list, sec_num_map, sec_title_map):
        import lxml.etree

        sec_data = dict()

        for node in cls.__get_sec_nodes(dom):
            id = node.attrib['id']
            num = sec_num_map[id]
            title = sec_title_map[id]
            html = lxml.etree.tostring(node, method='html').decode('utf-8')

            sec_data[id] = {
                'num': num,
                'title': title,
                'html': html,
            }

        return sec_data

    def remove_emu_ids(dom):
        for node in (dom.xpath('//emu-xref') + dom.xpath('//emu-nt')):
            if 'id' in node.attrib:
                node.attrib.pop('id')

    @classmethod
    def extract(cls, html):
        import lxml.html

        dom = lxml.html.fromstring(html)
        cls.remove_emu_ids(dom)
        sec_list, sec_num_map, sec_title_map = cls.__get_sec_list(dom)
        cls.__exclude_subsections(dom, sec_list, sec_num_map, sec_title_map)
        sec_data = cls.__to_data(dom, sec_list, sec_num_map, sec_title_map)

        return {
            'secList': sec_list,
            'secData': sec_data
        }


class RevisionRenderer:
    def __html(sha, prnum, skip_cache):
        index_path = Paths.index_path(sha, prnum)
        if not skip_cache and os.path.exists(index_path):
            Logger.log('skip {} (cached)'.format(index_path))
            return False

        Logger.log(index_path)

        LocalRepository.checkout(sha)

        subprocess.run(['npm', 'install'],
                       cwd=LocalRepository.DIR,
                       check=True)

        repo_out_dir = os.path.join(LocalRepository.DIR, 'out')
        repo_out_index_path = os.path.join(repo_out_dir, 'index.html')

        subprocess.run(['npm', 'run', '--silent', 'build'],
                       cwd=LocalRepository.DIR,
                       check=True)

        if not os.path.exists(repo_out_index_path):
            # Some intermediate commit might fail building.
            # (and npm returns 0...)
            # Generate an empty file in that case.
            FileUtils.mkdir_p(repo_out_dir)
            FileUtils.write(repo_out_index_path, '<html></html>')

        FileUtils.mkdir_p(Paths.rev_parent_dir(prnum))

        rev_dir = Paths.rev_dir(sha, prnum)
        if os.path.exists(rev_dir):
            distutils.dir_util.remove_tree(rev_dir)

        distutils.dir_util.copy_tree(repo_out_dir, rev_dir)
        return True

    def __json(sha, prnum, skip_cache):
        sections_path = Paths.sections_path(sha, prnum)
        if not skip_cache and os.path.exists(sections_path):
            Logger.log('skip {} (cached)'.format(sections_path))
            return False

        Logger.log(sections_path)

        data = SectionsExtractor.extract(
            FileUtils.read(Paths.index_path(sha, prnum)))

        sections_json = json.dumps(data)
        FileUtils.write(sections_path, sections_json)

        return True

    @classmethod
    def run(cls, sha, prnum, skip_cache):
        updated1 = cls.__html(sha, prnum, skip_cache)
        updated2 = cls.__json(sha, prnum, skip_cache)
        return updated1 or updated2


class Revisions:
    def update_list():
        revs = LocalRepository.revs(
            ['{}^..{}'.format(Config.FIRST_REV, 'origin/master')])

        parents = set()
        prs = PRs.get()
        for prnum in prs:
            for parent in PRInfo.parents(prs[prnum]):
                parents.add(parent)

        for parent in parents:
            rev = LocalRepository.revs(['-1', parent])[0]
            revs.append(rev)

        revs.sort(key=lambda rev: rev['date'], reverse=True)

        revs = unique(lambda rev: rev['hash'],
                      filter(CacheChecker.has_sections_json, revs))

        revs_json = json.dumps(revs,
                               indent=1,
                               separators=(',', ': '),
                               sort_keys=True)
        FileUtils.write(Paths.REVS_PATH, revs_json)

    def __update_revset(revset, count, skip_cache):
        LocalRepository.fetch('origin', 'master')

        shas = []
        for sha in LocalRepository.log(revset + ['--pretty=%H']):
            shas.append(sha)

        updated_any = False

        i = 0
        # Update from older revisions
        for sha in reversed(shas):
            i += 1
            Logger.log('{}/{}'.format(i, len(shas)))

            updated = RevisionRenderer.run(sha, None, skip_cache)
            if updated:
                updated_any = True

            if count is not None:
                if updated:
                    count -= 1
                    if count == 0:
                        break

        return updated_any

    @classmethod
    def update_all(cls, count, skip_cache):
        return cls.__update_revset(
            ['{}^..{}'.format(Config.UPDATE_FIRST_REV, 'origin/master')],
            count, skip_cache)

    @classmethod
    def update(cls, target_rev, skip_cache):
        return cls.__update_revset(['-1', target_rev], 1, skip_cache)


class PRs:
    def get():
        prs = dict()
        for data in RemoteRepository.prs():
            prnum = data['number']
            info_path = Paths.pr_info_path(prnum)

            if os.path.exists(info_path):
                prs[prnum] = FileUtils.read_json(info_path)

        return prs

    @classmethod
    def update_list(cls):
        prs = cls.get()

        prs_json = json.dumps(prs,
                              indent=1,
                              separators=(',', ': '),
                              sort_keys=True)
        FileUtils.write(Paths.PRS_PATH, prs_json)

    def __update_with(prnum, data, skip_cache):
        info = PRInfo.create(data)
        url = data['head']['repo']['clone_url']

        if not skip_cache and CacheChecker.is_pr_cached(prnum, info):
            Logger.log('skip PR {} (cached)'.format(prnum))
            return False

        FileUtils.mkdir_p(Paths.rev_parent_dir(prnum))

        LocalRepository.add_remote(info['login'], url)
        LocalRepository.fetch(info['login'], info['ref'])

        RevisionRenderer.run(info['head'], prnum, skip_cache)

        info['revs'] = LocalRepository.revs(
            ['origin/master..{}'.format(info['head'])])

        info_json = json.dumps(info)
        FileUtils.write(Paths.pr_info_path(prnum), info_json)

        for parent in PRInfo.parents(info):
            RevisionRenderer.run(parent, None, skip_cache)

        return True

    @classmethod
    def update(cls, prnum, skip_cache):
        data = RemoteRepository.pr(prnum)
        return cls.__update_with(prnum, data, skip_cache)

    @classmethod
    def update_all(cls, count, skip_cache):
        raw_prs = RemoteRepository.prs()

        updated_any = False

        i = 0
        # Update from older PRs
        for data in reversed(raw_prs):
            prnum = data['number']
            i += 1
            Logger.log('{}/{} PR {}'.format(i, len(raw_prs), prnum))

            updated = cls.__update_with(prnum, data, skip_cache)
            if updated:
                updated_any = True

            if count is not None:
                if updated:
                    count -= 1
                    if count == 0:
                        break

        return updated_any


class Bootstrap:
    def run():
        has_new = False

        if CacheChecker.has_new_rev():
            print('##[set-output name=update_revs;]Yes')
            has_new = True

        if CacheChecker.has_new_pr():
            print('##[set-output name=update_prs;]Yes')
            has_new = True

        if has_new:
            print('##[set-output name=update;]Yes')


parser = argparse.ArgumentParser(description='Update ecma262 history data')

parser.add_argument('--skip-cache', action='store_true',
                    help='Skip cache')
parser.add_argument('--skip-list', action='store_true',
                    help='Skip updating list')
subparsers = parser.add_subparsers(dest='command')
subparsers.add_parser('clone',
                      help='Clone ecma262 repository')
subparser_update = subparsers.add_parser('update',
                                         help='Update all revisions')
subparser_update.add_argument('-c', type=int,
                              help='Maximum number of revisions to handle')
subparser_rev = subparsers.add_parser('rev',
                                      help='Update single revision')
subparser_rev.add_argument('-c', type=int,
                           help='Maximum number of revisions to handle')
subparser_rev.add_argument('REV',
                           help='revision hash, or "all"')
subparsers.add_parser('revs',
                      help='Update revs.json')
parser_pr = subparsers.add_parser('pr',
                                  help='Update PR')
parser_pr.add_argument('PR_NUMBER',
                       help='PR number, or "all"')
parser_pr.add_argument('-c', type=int,
                       help='Maximum number of PRs to handle')
subparsers.add_parser('prs',
                      help='Update prs.json')
subparsers.add_parser('bootstrap',
                      help='Perform bootstrap for CI')
args = parser.parse_args()

if args.command == 'clone':
    LocalRepository.clone()
elif args.command == 'rev':
    if args.REV == 'all':
        updated = Revisions.update_all(args.c, args.skip_cache)
        if not args.skip_list and updated:
            Revisions.update_list()
    else:
        updated = Revisions.update(args.REV, args.skip_cache)
        if not args.skip_list and updated:
            Revisions.update_list()
elif args.command == 'revs':
    Revisions.update_list()
elif args.command == 'pr':
    if args.PR_NUMBER == 'all':
        updated = PRs.update_all(args.c, args.skip_cache)
        if not args.skip_list and updated:
            PRs.update_list()
            Revisions.update_list()
    else:
        updated = PRs.update(args.PR_NUMBER, args.skip_cache)
        if not args.skip_list and updated:
            PRs.update_list()
            Revisions.update_list()
elif args.command == 'prs':
    PRs.update_list()
elif args.command == 'bootstrap':
    Bootstrap.run()
