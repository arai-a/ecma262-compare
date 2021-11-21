ECMA262_COMPARE := $(dir $(firstword $(MAKEFILE_LIST)))
VENV_BIN_DIR := $(ECMA262_COMPARE)venv/bin
PIP := $(VENV_BIN_DIR)/pip
PYTHON := $(VENV_BIN_DIR)/python

py-venv:
	python3 -m venv venv &&\
	$(PIP) install --upgrade pip &&\
	$(PIP) install -r requirements.txt

py-venv-bootstrap:
	python3 -m venv venv

clone:
	$(PYTHON) build.py clone

init: py-venv clone

revs:
	$(PYTHON) build.py revs

update:
	$(PYTHON) build.py rev all

update1:
	$(PYTHON) build.py rev -c 1 all

update5:
	$(PYTHON) build.py rev -c 5 all

releases:
	$(PYTHON) build.py rev releases

pr:
	$(PYTHON) build.py pr all

pr1:
	$(PYTHON) build.py pr -c 1 all

pr5:
	$(PYTHON) build.py pr -c 5 all

prs:
	$(PYTHON) build.py prs

bootstrap:
	$(PYTHON) build.py bootstrap

gc:
	$(PYTHON) build.py gc

lint-setup:
	npm install

lint:
	npx eslint js/snapshot.js
	npx eslint js/snapshot-loader.js
	npx eslint js/compare.js
	npx eslint js/base.js
	npx eslint js/path-diff-worker.js
	npx eslint js/tree-diff-worker.js
	flake8 build.py
