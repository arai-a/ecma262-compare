#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import argparse
import glob
import gzip
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request

JSON_VERSION = '1'


def test_if_non_bmp_supported_by_lxml():
    import lxml.html
    import lxml.etree

    source = "<p>𝔽</p>"
    dom = lxml.html.fromstring(source)
    out = lxml.etree.tostring(dom, method='html').decode()
    return source == out


# Lazily populate
is_non_bmp_supported_by_lxml = None


class BuildFailureException(Exception):
    pass


class Logger:
    def info(s):
        print('[INFO] {}'.format(s))

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

    def read_b(path):
        with open(path, 'rb') as in_file:
            return in_file.read()

    @classmethod
    def read_gz(cls, path):
        return gzip.decompress(cls.read_b(path)).decode()

    @classmethod
    def read_json(cls, path):
        return json.loads(cls.read(path))

    @classmethod
    def read_json_gz(cls, path):
        return json.loads(gzip.decompress(cls.read_b(path)).decode())

    def write(path, text):
        with open(path, 'w') as f:
            f.write(text)

    def write_b(path, text):
        with open(path, 'wb') as f:
            f.write(text)

    @classmethod
    def write_gz(cls, path, text):
        cls.write_b(path, gzip.compress(text.encode()))

    @classmethod
    def write_json_gz(cls, path, data):
        cls.write_b(path, gzip.compress(json.dumps(data).encode()))

    def write_formatted_json(path, data):
        text = json.dumps(data,
                          indent=1,
                          separators=(',', ': '),
                          sort_keys=True)
        FileUtils.write(path, text)

    def mkdir_p(path):
        if not os.path.exists(path):
            os.makedirs(path)


class Config:
    __config_path = os.path.join('.', 'config.json')
    __broken_revs_path = os.path.join('.', 'broken_revs.json')

    __config = FileUtils.read_json(__config_path)

    REPO_URL = __config['repo_url']
    API_URL = __config['api_url']
    FIRST_REV = __config['first_rev']
    UPDATE_FIRST_REV = __config['update_first_rev']
    FIRST_PR = __config['first_pr']
    RELEASES = __config['releases']
    BROKEN_REVS = FileUtils.read_json(__broken_revs_path)

    @classmethod
    def add_broken_rev(cls, rev):
        cls.BROKEN_REVS.append(rev)
        FileUtils.write_formatted_json(cls.__broken_revs_path, cls.BROKEN_REVS)


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
        return os.path.join(cls.rev_dir(sha, prnum), 'sections.json.gz')

    @classmethod
    def parent_diff_path(cls, sha, prnum=None):
        return os.path.join(cls.rev_dir(sha, prnum), 'parent_diff.json.gz')

    @classmethod
    def index_path(cls, sha, prnum=None):
        return os.path.join(cls.rev_dir(sha, prnum), 'index.html.gz')


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
        PER_PAGE = 100
        query = query + [['per_page', str(PER_PAGE)]]
        data = cls.call(path, query)
        if len(data) == PER_PAGE:
            while True:
                page += 1
                next_data = cls.call(path, query + [['page', str(page)]])
                data += next_data
                if len(next_data) != PER_PAGE:
                    break
        return data


class RemoteRepository:
    def prs():
        for data in GitHubAPI.call_pages('pulls'):
            if data['number'] >= Config.FIRST_PR:
                yield data

    def head():
        return GitHubAPI.call('commits', [['per_page', '1']])[0]

    def pr(prnum):
        return GitHubAPI.call('pulls/{}'.format(prnum))


class PRInfo:
    def create(data):
        return {
            'number': data['number'],
            'ref': data['head']['ref'],
            'login': data['head']['user']['login'],
            'head': data['head']['sha'],
            'base': data['base']['sha'],
            'title': data['title'],
            'created_at': data['created_at'],
            'updated_at': data['updated_at'],
        }

    def parents(pr):
        parents = pr['revs'][-1]['parents']
        return parents.split(' ')


class CacheChecker:
    @classmethod
    def has_new_rev(cls):
        head = RemoteRepository.head()['sha']
        if not cls.is_rev_cached(head):
            Logger.info('head={} is not cached'.format(head))
            return True

        Logger.info('head={} is cached'.format(head))
        return False

    @classmethod
    def has_new_pr(cls):
        prs = PRs.get_cache()

        newest_pr_number = None

        result = False
        for data in RemoteRepository.prs():
            pr = PRInfo.create(data)
            if not newest_pr_number:
                newest_pr_number = pr['number']
            if not cls.__is_pr_cached_with(pr, prs):
                Logger.info('PR={} is not cached'.format(data['number']))
                result = True

        if not result:
            if newest_pr_number:
                Logger.info('All PRs are cached (newest=#{})'.format(
                    newest_pr_number))
            else:
                Logger.info('All PRs are cached')
        return result

    def is_rev_cached(sha):
        revs = Revisions.get_cache()
        for rev in revs:
            if rev['hash'] == sha:
                return True

        return False

    def __is_pr_cached_with(pr, prs):
        for prev_pr in prs:
            if prev_pr['number'] == pr['number']:
                return prev_pr['head'] == pr['head']
        return False

    @classmethod
    def is_pr_cached(cls, pr):
        return cls.__is_pr_cached_with(pr, PRs.get_cache())

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
    def reset(cls):
        subprocess.run(['git', 'reset', '--hard'],
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
    def revs(cls, revset):
        pretty = '%n'.join([
            'hash:%H',
            'parents:%P',
            'author:%an',
            'date:%cI',
            'adate:%aI',
            'subject:%s',
        ])

        rev = dict()
        for line in cls.log(revset + ['--pretty={}%n=='.format(pretty)]):
            if line == '==':
                yield rev
                rev = dict()
            else:
                (name, value) = line.split(':', 1)
                rev[name] = value


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
    def __get_parent_id(cls, node):
        p = node.getparent()
        while p.tag not in ['emu-clause', 'emu-annex']:
            p = p.getparent()
            if p is None:
                return None
        return p.attrib['id']

    @classmethod
    def __get_sec_list(cls, dom):
        sec_list = []
        sec_tree_map = dict()
        sec_num_map = dict()
        sec_title_map = dict()

        for node in cls.__get_sec_nodes(dom):
            id = node.attrib['id']

            if id not in sec_tree_map:
                sec_tree_map[id] = dict()
            sec_tree_item = sec_tree_map[id]
            sec_tree_item['parent'] = cls.__get_parent_id(node)
            sec_tree_item['tree_node'] = [id, []]

            h1 = node.xpath('./h1')[0]

            try:
                secnum = h1.xpath('./span[@class="secnum"]')[0]
            except:
                secnum = None

            if secnum is not None:
                num = cls.__get_text(secnum)

                for child in secnum.getchildren():
                    secnum.remove(child)
                secnum.attrib['class'] += ' excluded-secnum'
                secnum.attrib['excluded-id'] = id
                secnum.text = '#{}'.format(id)
            else:
                num = '?'

            title = cls.__get_text(h1).replace(num, '')

            sec_list.append(id)
            sec_num_map[id] = num
            sec_title_map[id] = title

        sec_tree = []
        for id in sec_list:
            sec_tree_item = sec_tree_map[id]
            tree_node = sec_tree_item['tree_node']

            parent_id = sec_tree_item['parent']
            if parent_id and parent_id in sec_tree_map:
                parent = sec_tree_map[parent_id]
                parent['tree_node'][1].append(tree_node)
            else:
                sec_tree.append(tree_node)

        return sec_list, sec_tree, sec_num_map, sec_title_map

    @classmethod
    def __get_figure_list(cls, dom):
        import lxml.html
        figure_num_map = dict()

        caption_pat = re.compile(r'^((Table|Figure) \d+)')

        n = 1

        for node in dom.xpath('//emu-figure') + dom.xpath('//emu-table'):
            if 'id' in node.attrib:
                id = node.attrib['id']
            else:
                id = 'table-noid-{}'.format(n)
                n += 1

            captions = node.xpath('.//figcaption')
            if len(captions) == 0:
                continue

            caption = captions[0]

            m = caption_pat.search(caption.text)
            if not m:
                continue

            tail = caption_pat.sub('', caption.text)
            caption.text = ''

            num = lxml.html.Element('span', {'class': 'excluded-caption-num',
                                             'excluded-id': id})
            num.text = '#{}'.format(id)
            num.tail = tail
            caption.insert(0, num)

            figure_num_map[id] = m.group(1)

        return figure_num_map

    @classmethod
    def __replace_xref(cls, dom, sec_num_map, figure_num_map):
        sec_nums = set()
        for (id, num) in sec_num_map.items():
            sec_nums.add(num)
        figure_nums = set()
        for (id, num) in figure_num_map.items():
            figure_nums.add(num)

        for node in dom.xpath('//emu-xref'):
            if 'href' in node.attrib:
                href = node.attrib['href']

                if not href.startswith('#'):
                    continue
                id = href[1:]

                links = node.xpath('./a')
                if len(links) == 0:
                    continue
                a = links[0]

                if a.text in sec_nums or a.text in figure_nums:
                    a.attrib['class'] = 'excluded-xref'
                    a.attrib['excluded-id'] = id
                    a.text = '#{}'.format(id)

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
        global is_non_bmp_supported_by_lxml

        import lxml.html

        if is_non_bmp_supported_by_lxml is None:
            is_non_bmp_supported_by_lxml = test_if_non_bmp_supported_by_lxml()

        if not is_non_bmp_supported_by_lxml:
            # non-BMP is not supported properly on macOS's built-in libxml,
            # and if lxml is built locally (e.g. on M1 mac), it results in
            # broken output.
            #
            # Convert them to entiry reference manually.
            html = re.sub('[\U00010000-\U0010ffff]',
                          lambda x: '&#' + str(ord(x.group(0))) + ';',
                          html)

        dom = lxml.html.fromstring(html)

        cls.remove_emu_ids(dom)
        sec_list, sec_tree, sec_num_map, sec_title_map = cls.__get_sec_list(dom)   # NOQA: E501
        figure_num_map = cls.__get_figure_list(dom)
        cls.__replace_xref(dom, sec_num_map, figure_num_map)
        cls.__exclude_subsections(dom, sec_list, sec_num_map, sec_title_map)
        sec_data = cls.__to_data(dom, sec_list, sec_num_map, sec_title_map)

        return {
            'VERSION': JSON_VERSION,
            'secList': sec_list,
            'secTree': sec_tree,
            'secData': sec_data,
            'figData': figure_num_map,
        }


class SectionsComparator:
    ATTR_PAT = re.compile(r' (aoid|href)="[^"]+"')

    @classmethod
    def compare(cls, from_sec_data, to_sec_data):
        sec_ids = set(from_sec_data['secList'] + to_sec_data['secList'])

        from_sec_set = set(from_sec_data['secList'])
        to_sec_set = set(to_sec_data['secList'])

        if 'secTree' in from_sec_data:
            from_sec_tree = from_sec_data['secTree']
        else:
            from_sec_tree = []

        if 'secTree' in to_sec_data:
            to_sec_tree = to_sec_data['secTree']
        else:
            to_sec_tree = []

        diff_from_sec_list = []
        diff_to_sec_list = []
        diff_from_sec_data = dict()
        diff_to_sec_data = dict()

        for sec_id in sec_ids:
            if sec_id in from_sec_set:
                if sec_id in to_sec_set:
                    if not cls.is_changed(sec_id, from_sec_data, to_sec_data):
                        continue

                    diff_from_sec_list.append(sec_id)
                    diff_to_sec_list.append(sec_id)
                    diff_from_sec_data[sec_id] = \
                        from_sec_data['secData'][sec_id]
                    diff_to_sec_data[sec_id] = to_sec_data['secData'][sec_id]
                else:
                    diff_from_sec_list.append(sec_id)
                    diff_from_sec_data[sec_id] = \
                        from_sec_data['secData'][sec_id]
            else:
                diff_to_sec_list.append(sec_id)
                diff_to_sec_data[sec_id] = to_sec_data['secData'][sec_id]

        diff_from_fig_data = \
            cls.filter_fig_data(diff_from_sec_data, from_sec_data['figData'])
        diff_to_fig_data = \
            cls.filter_fig_data(diff_to_sec_data, to_sec_data['figData'])

        return {
            'VERSION': JSON_VERSION,
            'from': {
                'secList': diff_from_sec_list,
                'secTree': from_sec_tree,
                'secData': diff_from_sec_data,
                'figData': diff_from_fig_data,
            },
            'to': {
                'secList': diff_to_sec_list,
                'secTree': to_sec_tree,
                'secData': diff_to_sec_data,
                'figData': diff_to_fig_data,
            },
        }

    @classmethod
    def is_changed(cls, sec_id, from_sec_data, to_sec_data):
        # This should be synced with Comparator#isChanged in js/compare.js
        from_html = from_sec_data['secData'][sec_id]['html']
        to_html = to_sec_data['secData'][sec_id]['html']

        filtered_from_html = cls.filter_attribute_for_comparison(from_html)
        filtered_to_html = cls.filter_attribute_for_comparison(to_html)

        return filtered_from_html != filtered_to_html

    @classmethod
    def filter_attribute_for_comparison(cls, s):
        # This should be synced with
        # Comparator#filterAttributeForComparison in js/compare.js

        return cls.ATTR_PAT.sub('', s)

    @classmethod
    def filter_fig_data(cls, sec_data, fig_data):
        html = ' '.join(map(lambda d: d['html'], sec_data.values()))

        result = dict()

        for (fig_id, name) in fig_data.items():
            if fig_id in html:
                result[fig_id] = name

        return result


class RevisionRenderer:
    __MONTHS = {
        '01': 'January',
        '02': 'February',
        '03': 'March',
        '04': 'April',
        '05': 'May',
        '06': 'June',
        '07': 'July',
        '08': 'August',
        '09': 'September',
        '10': 'October',
        '11': 'November',
        '12': 'December',
    }

    __SPEC_DATE_PREFIX = 'Draft ECMA-262 / '

    __SPEC_DATE_PAT = re.compile(
        '{}(?:{}) \\d+, \\d+'.format(__SPEC_DATE_PREFIX,
                                     '|'.join(__MONTHS.values())))

    __ISO_DATE_PAT = re.compile('^([0-9]+)-([0-9]+)-([0-9]+)T')

    @classmethod
    def __to_spec_date(cls, d):
        m = cls.__ISO_DATE_PAT.search(d)
        return '{}{} {}, {}'.format(cls.__SPEC_DATE_PREFIX,
                                    cls.__MONTHS[m.group(2)],
                                    m.group(3), m.group(1))

    @classmethod
    def __replace_date(cls, path, date):
        spec_date = cls.__to_spec_date(date)
        content = FileUtils.read(path)
        content = cls.__SPEC_DATE_PAT.sub(spec_date, content)
        FileUtils.write(path, content)

    @classmethod
    def __html(cls, sha, prnum, skip_cache):
        index_path = Paths.index_path(sha, prnum)
        if not skip_cache and os.path.exists(index_path):
            Logger.info('skip {} (cached)'.format(index_path))
            return False

        Logger.info(index_path)

        LocalRepository.reset()

        LocalRepository.checkout(sha)

        try:
            subprocess.run(['npm', 'install', '--verbose'],
                           cwd=LocalRepository.DIR,
                           check=True)
        except Exception:
            raise BuildFailureException()

        repo_out_dir = os.path.join(LocalRepository.DIR, 'out')
        repo_out_index_path = os.path.join(repo_out_dir, 'index.html')
        repo_out_index_gz_path = os.path.join(repo_out_dir, 'index.html.gz')

        try:
            subprocess.run(['npm', 'run', '--silent', 'build-only'],
                           cwd=LocalRepository.DIR,
                           check=True)
        except Exception:
            raise BuildFailureException()

        script_relative_path = os.path.join('scripts',
                                            'insert_snapshot_warning.js')
        script_path = os.path.join(LocalRepository.DIR, script_relative_path)
        if os.path.exists(script_path):
            subprocess.run(['node', script_relative_path],
                           cwd=LocalRepository.DIR,
                           check=False)

        if not os.path.exists(repo_out_index_path):
            # Some intermediate commit might fail building.
            # (and npm returns 0...)
            # Generate an empty file in that case.
            FileUtils.mkdir_p(repo_out_dir)
            FileUtils.write(repo_out_index_path, '<html></html>')
        else:
            date = list(LocalRepository.log(['-1', sha, '--pretty=%cI']))[0]

            cls.__replace_date(repo_out_index_path, date)

        FileUtils.mkdir_p(Paths.rev_parent_dir(prnum))

        rev_dir = Paths.rev_dir(sha, prnum)
        if os.path.exists(rev_dir):
            shutil.rmtree(rev_dir)

        # Use the same structure

        assets_js_path = os.path.join(repo_out_dir, 'assets', 'ecmarkup.js')
        if os.path.exists(assets_js_path):
            js_path = os.path.join(repo_out_dir, 'ecmarkup.js')
            os.rename(assets_js_path, js_path)

        # Remove unnecessary files

        multipage_dir = os.path.join(repo_out_dir, 'multipage')
        if os.path.exists(multipage_dir):
            shutil.rmtree(multipage_dir)

        assets_dir = os.path.join(repo_out_dir, 'assets')
        if os.path.exists(assets_dir):
            shutil.rmtree(assets_dir)

        # Compress files

        content = FileUtils.read(repo_out_index_path)
        FileUtils.write_gz(repo_out_index_gz_path, content)
        os.remove(repo_out_index_path)

        shutil.copytree(repo_out_dir, rev_dir)

        return True

    def __json(sha, prnum, skip_cache, check_version):
        sections_path = Paths.sections_path(sha, prnum)
        if not skip_cache and os.path.exists(sections_path):
            Logger.info('skip {} (cached)'.format(sections_path))
            return False

        if check_version and os.path.exists(sections_path):
            data = FileUtils.read_json_gz(sections_path)
            if 'VERSION' in data and data['VERSION'] == JSON_VERSION:
                Logger.info('skip {} (same version)'.format(sections_path))
                return False

        Logger.info(sections_path)

        data = SectionsExtractor.extract(
            FileUtils.read_gz(Paths.index_path(sha, prnum)))

        FileUtils.write_json_gz(sections_path, data)

        return True

    def __parent_json(sha, prnum, parent, skip_cache, check_version):
        parent_diff_path = Paths.parent_diff_path(sha, prnum)
        if not skip_cache and os.path.exists(parent_diff_path):
            Logger.info('skip {} (cached)'.format(parent_diff_path))
            return False

        sections_path = Paths.sections_path(sha, prnum)
        parent_sections_path = Paths.sections_path(parent, None)
        if not os.path.exists(sections_path):
            Logger.info('{} not found'.format(sections_path))
            return False
        if not os.path.exists(parent_sections_path):
            Logger.info('{} not found'.format(parent_sections_path))
            return False

        if check_version and os.path.exists(parent_diff_path):
            try:
                data = FileUtils.read_json_gz(parent_diff_path)
                if 'VERSION' in data and data['VERSION'] == JSON_VERSION:
                    Logger.info('skip {} (same version)'.format(
                        parent_diff_path))
                    return False
            except:  # NOQA: E722
                pass

        Logger.info(parent_diff_path)

        to_json = FileUtils.read_json_gz(sections_path)
        from_json = FileUtils.read_json_gz(parent_sections_path)

        diff_json = SectionsComparator.compare(from_json, to_json)

        result = gzip.compress(json.dumps(diff_json).encode())
        if len(result) > 1024 * 1024:
            Logger.info('SKIP: {} is too large ({})'.format(
                parent_diff_path, len(result)))
            return False

        FileUtils.write_b(parent_diff_path, result)

        return True

    @classmethod
    def run(cls, sha, prnum, skip_cache):
        if sha in Config.BROKEN_REVS:
            Logger.info('Skipping broken revision {}'.format(sha))
            return False

        try:
            updated1 = cls.__html(sha, prnum, skip_cache)
            updated2 = cls.__json(sha, prnum, skip_cache, False)
            return updated1 or updated2
        except BuildFailureException:
            LocalRepository.reset()

            Config.add_broken_rev(sha)
            Logger.info('Skipping build failure {}'.format(sha))
            return False

    @classmethod
    def run_parent(cls, sha, prnum, parent_sha, skip_cache):
        return cls.__parent_json(sha, prnum, parent_sha, skip_cache, False)

    @classmethod
    def update_json(cls, sha, prnum):
        if sha in Config.BROKEN_REVS:
            Logger.info('Skipping broken revision {}'.format(sha))
            return False

        cls.__json(sha, prnum, True, True)

    @classmethod
    def update_parent_json(cls, sha, prnum, parent_sha):
        return cls.__parent_json(sha, prnum, parent_sha, True, True)


class Revisions:
    def get_cache():
        return FileUtils.read_json(Paths.REVS_PATH)

    def update_cache():
        revs = list(LocalRepository.revs(
            ['{}^..{}'.format(Config.FIRST_REV, 'origin/main')]))

        parents = set()
        for pr in PRs.get_cache():
            for parent in PRInfo.parents(pr):
                parents.add(parent)

        for parent in parents:
            rev = list(LocalRepository.revs(['-1', parent]))[0]
            revs.append(rev)

        revs.sort(key=lambda rev: rev['date'], reverse=True)

        parent = None
        for release in Config.RELEASES:
            rev = list(LocalRepository.revs([release]))[0]
            rev['release'] = release
            if parent:
                rev['parents'] = parent
            parent = rev['hash']
            revs.append(rev)

        revs = unique(lambda rev: rev['hash'],
                      filter(CacheChecker.has_sections_json, revs))

        revs_json = json.dumps(revs,
                               indent=1,
                               separators=(',', ': '),
                               sort_keys=True)
        FileUtils.write(Paths.REVS_PATH, revs_json)

    def __update_revset(revset, count, skip_cache):
        LocalRepository.fetch('origin', 'main')

        revs = list(LocalRepository.revs(revset))

        updated_any = False

        i = 0
        # Update from older revisions
        for rev in reversed(revs):
            i += 1
            Logger.info('{}/{}'.format(i, len(revs)))

            sha = rev['hash']
            parent = rev['parents'].split(' ')[0]

            updated1 = RevisionRenderer.run(sha, None, skip_cache)
            updated2 = RevisionRenderer.run_parent(sha, None, parent,
                                                   skip_cache)
            updated = updated1 or updated2

            if updated:
                updated_any = True

            if count is not None:
                if updated:
                    count -= 1
                    if count == 0:
                        break

        return updated_any

    def __update_releases(releases, count, skip_cache):
        revs = []
        for release in Config.RELEASES:
            LocalRepository.fetch('origin', release)
            rev = list(LocalRepository.revs([release]))[0]
            revs.append(rev)

        updated_any = False

        i = 0
        # Update from older revisions
        for rev in reversed(revs):
            i += 1
            Logger.info('{}/{}'.format(i, len(revs)))

            sha = rev['hash']

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
            ['{}^..{}'.format(Config.UPDATE_FIRST_REV, 'origin/main')],
            count, skip_cache)

    @classmethod
    def update_releases(cls, count, skip_cache):
        return cls.__update_releases(Config.RELEASES, count, skip_cache)

    @classmethod
    def update(cls, target_rev, skip_cache):
        return cls.__update_revset(['-1', target_rev], 1, skip_cache)


class PRs:
    UPDATED_PRS = []

    def __get():
        for data in RemoteRepository.prs():
            info_path = Paths.pr_info_path(data['number'])
            if os.path.exists(info_path):
                yield FileUtils.read_json(info_path)

    def get_cache():
        return FileUtils.read_json(Paths.PRS_PATH)

    @classmethod
    def update_cache(cls):
        prs = list(cls.__get())

        prs_json = json.dumps(prs,
                              indent=1,
                              separators=(',', ': '),
                              sort_keys=True)
        FileUtils.write(Paths.PRS_PATH, prs_json)

    @classmethod
    def __update_with(cls, data, skip_cache, full_check):
        pr = PRInfo.create(data)
        prnum = pr['number']

        if not full_check and not skip_cache and CacheChecker.is_pr_cached(pr):
            Logger.info('skip PR {} (cached)'.format(prnum))
            return False

        FileUtils.mkdir_p(Paths.rev_parent_dir(prnum))

        LocalRepository.fetch('origin', '+refs/pull/{}/head'.format(prnum))

        RevisionRenderer.run(pr['head'], prnum, skip_cache)

        pr['revs'] = list(LocalRepository.revs(
            ['origin/main..{}'.format(pr['head'])]))

        info_json = json.dumps(pr)
        FileUtils.write(Paths.pr_info_path(prnum), info_json)

        first_parent = None
        for parent in PRInfo.parents(pr):
            if not first_parent:
                first_parent = parent
            RevisionRenderer.run(parent, None, skip_cache)

        RevisionRenderer.run_parent(pr['head'], prnum, first_parent,
                                    skip_cache)

        cls.UPDATED_PRS.append('{}={}'.format(prnum, pr['head']))

        return True

    @classmethod
    def update(cls, prnum, skip_cache, full_check):
        data = RemoteRepository.pr(prnum)
        result = cls.__update_with(data, skip_cache, full_check)
        cls.__set_output()
        return result

    @classmethod
    def update_all(cls, count, skip_cache, full_check):
        raw_prs = list(RemoteRepository.prs())

        i = 0
        # Update from older PRs
        for data in reversed(raw_prs):
            i += 1
            Logger.info('{}/{} PR {}'.format(i, len(raw_prs), data['number']))

            updated = cls.__update_with(data, skip_cache, full_check)
            if count is not None:
                if updated:
                    count -= 1
                    if count == 0:
                        break

        cls.__set_output()
        return len(cls.UPDATED_PRS) > 0

    @classmethod
    def __set_output(cls):
        print('##[set-output name=updated_pr_list;]{}'.format(
            ','.join(map(str, cls.UPDATED_PRS))))


class JSONUpdater:
    def run(target, chunk, total_chunks):
        revs = Revisions.get_cache()
        prs = PRs.get_cache()

        rev_dict = dict()
        for rev in revs:
            rev_dict[rev['hash']] = True

        if target in ['both', 'sections']:
            i = 0
            for rev in revs:
                if (i % total_chunks) + 1 != chunk:
                    i += 1
                    continue
                i += 1
                RevisionRenderer.update_json(rev['hash'], None)

            i = 0
            for pr in prs:
                if (i % total_chunks) + 1 != chunk:
                    i += 1
                    continue
                i += 1
                RevisionRenderer.update_json(pr['head'], pr['number'])

        if target in ['both', 'parent_diff']:
            i = 0
            for rev in revs:
                if (i % total_chunks) + 1 != chunk:
                    i += 1
                    continue
                i += 1
                parent = rev['parents'].split(' ')[0]
                if parent not in rev_dict:
                    continue
                RevisionRenderer.update_parent_json(rev['hash'], None, parent)

            i = 0
            for pr in prs:
                if (i % total_chunks) + 1 != chunk:
                    i += 1
                    continue
                i += 1
                parent = PRInfo.parents(pr)[0]
                if parent not in rev_dict:
                    continue
                RevisionRenderer.update_parent_json(pr['head'], pr['number'],
                                                    parent)


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


class GC:
    def __get_sha(path):
        return os.path.basename(path)

    def __in_revs(sha, revs):
        for rev in revs:
            if rev['hash'] == sha:
                return True
        return False

    def __get_prnum(path):
        return int(os.path.basename(path))

    def __get_pr(prnum, prs):
        for pr in prs:
            if pr['number'] == prnum:
                return pr
        return None

    @classmethod
    def run(cls):
        revs = Revisions.get_cache()
        prs = PRs.get_cache()

        for rev_dir in glob.glob('./history/*'):
            if rev_dir.endswith('/PR'):
                continue
            if rev_dir.endswith('/prs.json'):
                continue
            if rev_dir.endswith('/revs.json'):
                continue

            sha = cls.__get_sha(rev_dir)
            if not cls.__in_revs(sha, revs):
                print('R', rev_dir)
                shutil.rmtree(rev_dir)

        for pr_dir in glob.glob('./history/PR/*'):
            prnum = cls.__get_prnum(pr_dir)
            pr = cls.__get_pr(prnum, prs)
            if pr is None:
                print('R', pr_dir)
                shutil.rmtree(pr_dir)
                continue

            for rev_dir in glob.glob('{}/*'.format(pr_dir)):
                if rev_dir.endswith('/info.json'):
                    continue

                sha = cls.__get_sha(rev_dir)
                if sha != pr['head']:
                    print('R', rev_dir)
                    shutil.rmtree(rev_dir)


parser = argparse.ArgumentParser(description='Update ecma262 history data')

parser.add_argument('--skip-cache', action='store_true',
                    help='Skip cache')
parser.add_argument('--full-check', action='store_true',
                    help='Check all PR data, instead of light-weight cache \
                    check')
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
parser_json = subparsers.add_parser('update-json',
                                    help='Update sections.json.gz and parent_diff.json.gz for all revisions and PRs')  # NOQA: E501
parser_json.add_argument('-c', type=int, default=1,
                         help='Number of chunks')
parser_json.add_argument('-i', type=int, default=1,
                         help='Chunk index')
parser_json.add_argument('-t', choices=['both', 'sections', 'parent_diff'],
                         default='both',
                         help='Target')
subparsers.add_parser('bootstrap',
                      help='Perform bootstrap for CI')
subparsers.add_parser('gc',
                      help='Remove obsolete revisions and closed PRs')
args = parser.parse_args()

if args.command == 'clone':
    LocalRepository.clone()
elif args.command == 'rev':
    if args.REV == 'all':
        updated = Revisions.update_all(args.c, args.skip_cache)
        if not args.skip_list and updated:
            Revisions.update_cache()
    elif args.REV == 'releases':
        updated = Revisions.update_releases(args.c, args.skip_cache)
        if not args.skip_list and updated:
            Revisions.update_cache()
    else:
        updated = Revisions.update(args.REV, args.skip_cache)
        if not args.skip_list and updated:
            Revisions.update_cache()
elif args.command == 'revs':
    Revisions.update_cache()
elif args.command == 'pr':
    if args.PR_NUMBER == 'all':
        updated = PRs.update_all(args.c, args.skip_cache, args.full_check)
        if not args.skip_list and updated:
            PRs.update_cache()
            Revisions.update_cache()
    else:
        updated = PRs.update(int(args.PR_NUMBER), args.skip_cache,
                             args.full_check)
        if not args.skip_list and updated:
            PRs.update_cache()
            Revisions.update_cache()
elif args.command == 'prs':
    PRs.update_cache()
elif args.command == 'update-json':
    JSONUpdater.run(args.t, args.i, args.c)
elif args.command == 'bootstrap':
    Bootstrap.run()
elif args.command == 'gc':
    GC.run()
