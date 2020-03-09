#!/usr/bin/env python3

import argparse
import json
import os
import sys
import urllib.request


class Logger:
    def info(s):
        print('[INFO] {}'.format(s))

        # Flush to make it apeear immediately in automation log.
        sys.stdout.flush()


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


class Paths:
    TOKEN_PATH = os.path.join('.', 'token.json')
    STATUS_PATH = os.path.join('.', 'pr-status.json')


class Config:
    __config_path = os.path.join('.', 'config.json')

    __config = FileUtils.read_json(__config_path)

    API_URL = __config['api_url']
    PAGE_URL = __config['page_url']

    # Testing now
    API_URL = 'https://api.github.com/repos/arai-a/workflow-test/'


class GitHubAPI:
    __API_TOKEN = os.environ.get('POST_TOKEN')
    if not __API_TOKEN and os.path.exists(Paths.TOKEN_PATH):
        __API_TOKEN = FileUtils.read_json(Paths.TOKEN_PATH)['post_token']

    @classmethod
    def post(cls, path, query, data):
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

        headers['Content-Type'] = 'application/json'

        req = urllib.request.Request(url, json.dumps(data).encode(), headers)
        response = urllib.request.urlopen(req)
        return json.loads(response.read())


class StorePRStatus:
    @classmethod
    def run(cls):
        updated = os.environ.get('UPDATED_PR_LIST')
        if not updated:
            Logger.info('UPDATED_PR_LIST is empty')
            return

        updated = updated.split(',')

        status = FileUtils.read_json(Paths.STATUS_PATH)

        for prnum_sha in updated:
            if prnum_sha in status['posted']:
                Logger.info('PR {} status is already posted'.format(prnum_sha))
                continue

            status['new'].append(prnum_sha)
            Logger.info('Adding PR {}'.format(prnum_sha))

        FileUtils.write(Paths.STATUS_PATH, json.dumps(status))


class PostPRStatus:
    @classmethod
    def run(cls):
        status = FileUtils.read_json(Paths.STATUS_PATH)

        for prnum_sha in status['new']:
            status['posted'].append(prnum_sha)
            Logger.info('Posting to PR {}'.format(prnum_sha))

            prnum, sha = prnum_sha.split('=')

            url = '{}?pr={}&collapsed=1'.format(Config.PAGE_URL, prnum)

            # Testing now
            sha = '05c883b196552833b965c4f4feab8005ca45c3bf'

            GitHubAPI.post('statuses/{}'.format(sha), [], {
                'context': 'ecma262-compare',
                'state': 'success',
                'target_url': url,
                'description': 'Compare the output HTML',
            })

        status['new'] = []

        FileUtils.write(Paths.STATUS_PATH, json.dumps(status))


class Bootstrap:
    @classmethod
    def run(cls):
        status = FileUtils.read_json(Paths.STATUS_PATH)
        if len(status['new']) == 0:
            Logger.info('No new PRs')
            print('##[set-output name=update;]No')
        else:
            Logger.info('PRs {} are updated'.format(status['new']))
            print('##[set-output name=update;]Yes')


parser = argparse.ArgumentParser(description='Handle PR status')

subparsers = parser.add_subparsers(dest='command')
subparsers.add_parser('store',
                      help='Store PR status to JSON file')
subparsers.add_parser('post',
                      help='Post PR status')
subparsers.add_parser('bootstrap',
                      help='Perform bootstrap for CI')
args = parser.parse_args()

if args.command == 'store':
    StorePRStatus.run()
elif args.command == 'post':
    PostPRStatus.run()
elif args.command == 'bootstrap':
    Bootstrap.run()
