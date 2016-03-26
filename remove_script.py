#!/usr/bin/python -B

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import glob
import re
import sys

style_pat = re.compile('<style.+?</style>')
script_pat = re.compile('<script.+?</script>')
img_pat = re.compile('<script.+?</script>')

for file in glob.glob('./history/*'):
    with open(file, 'r') as in_file:
        data = in_file.read()

        m = style_pat.search(data)
        if m:
            print(m.group(0))

        sys.quit()
