#!/usr/bin/env python3

import argparse
import json
import os
import sys


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
    COMMENTS_PATH = os.path.join('.', 'pr-comments.json')


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
            # FIXME post here

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
