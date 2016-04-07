#!/usr/bin/python -B
# -*- coding: utf-8 -*-

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import glob
import json
import lxml.html
import lxml.etree
import os
import sys

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
        #secnum.drop_tree()

        utils = h1.xpath('./span[@class="utils"]')[0]
        utils.drop_tree()

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

def extract_sections(filename):
    in_filename = '{}.html'.format(filename)
    out_filename = '{}.json'.format(filename)

    #if os.path.exists(out_filename):
    #    print('skip {}'.format(out_filename))
    #    return

    print(out_filename)

    with open(in_filename, 'r') as in_file:
        dom = lxml.html.fromstring(in_file.read())

        sec_list, sec_num_map, sec_title_map = get_sec_list(dom)
        exclude_subsections(dom, sec_list, sec_num_map, sec_title_map)
        data = extract_sec_html(dom, sec_list, sec_num_map, sec_title_map)

        with open(out_filename, 'w') as out_file:
            out_file.write(json.dumps(data))

def for_each_revisions():
    for filename in glob.glob('./history/*.html'):
        extract_sections(filename.replace('.html', ''))

def for_each_prs():
    for dir in glob.glob('./history/PR/*'):
        if os.path.exists('{}/info.json'.format(dir)):
            with open('{}/info.json'.format(dir), 'r') as in_file:
                info = json.loads(in_file.read())
                for rev in info['revs']:
                    extract_sections('{}/{}'.format(dir, rev))

for_each_revisions()
for_each_prs()
