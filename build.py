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
    COMMENTS_PATH = os.path.join('.', 'pr-comments.json')


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


class StorePRComments:
    @classmethod
    def run(cls):
        updated = os.environ.get('UPDATED_PR_LIST')
        if not updated:
            Logger.info('UPDATED_PR_LIST is empty')
            return

        updated = map(lambda x: int(x), updated.split(','))

        comments = FileUtils.read_json(Paths.COMMENTS_PATH)

        for prnum in updated:
            if prnum in comments['posted']:
                Logger.info('PR {} is already commented'.format(prnum))
                continue

            comments['new'].append(prnum)
            Logger.info('Adding PR {}'.format(prnum))

        FileUtils.write(Paths.COMMENTS_PATH, json.dumps(comments))


class PostPRComments:
    @classmethod
    def run(cls):
        comments = FileUtils.read_json(Paths.COMMENTS_PATH)

        for prnum in comments['new']:
            comments['posted'].append(prnum)
            Logger.info('Posting to PR {}'.format(prnum))

            # Testing now
            GitHubAPI.post('issues/2/comments', [], {
                'body': '{}?pr={}'.format(Config.PAGE_URL, prnum)
            })

            # GitHubAPI.post('issues/{}/comments'.format(prnum), [], {
            #     'body': '{}?pr={}'.format(Config.PAGE_URL, prnum)
            # })

        comments['new'] = []

        FileUtils.write(Paths.COMMENTS_PATH, json.dumps(comments))


class Bootstrap:
    @classmethod
    def run(cls):
        comments = FileUtils.read_json(Paths.COMMENTS_PATH)
        if len(comments['new']) == 0:
            Logger.info('No new PRs')
            print('##[set-output name=update;]No')
        else:
            Logger.info('PRs {} are updated'.format(comments['new']))
            print('##[set-output name=update;]Yes')


parser = argparse.ArgumentParser(description='Handle PR comments')

subparsers = parser.add_subparsers(dest='command')
subparsers.add_parser('store',
                      help='Store PR comments to JSON file')
subparsers.add_parser('post',
                      help='Post PR comments')
subparsers.add_parser('bootstrap',
                      help='Perform bootstrap for CI')
args = parser.parse_args()

if args.command == 'store':
    StorePRComments.run()
elif args.command == 'post':
    PostPRComments.run()
elif args.command == 'bootstrap':
    Bootstrap.run()
