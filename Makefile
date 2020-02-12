ECMA262_COMPARE := $(dir $(firstword $(MAKEFILE_LIST)))
VENV_BIN_DIR := $(ECMA262_COMPARE)venv/bin
PIP := $(VENV_BIN_DIR)/pip
PYTHON := $(VENV_BIN_DIR)/python

py-venv:
	python3 -m venv venv &&\
	$(PIP) install --upgrade pip &&\
	$(PIP) install -r requirements.txt

init: py-venv
	$(PYTHON) build.py init

revs:
	$(PYTHON) build.py revs

update:
	$(PYTHON) build.py update

update1:
	$(PYTHON) build.py update -c 1

update5:
	$(PYTHON) build.py update -c 5

pr:
	$(PYTHON) build.py pr all

pr1:
	$(PYTHON) build.py pr -c 1 all

pr5:
	$(PYTHON) build.py pr -c 5 all

prs:
	$(PYTHON) build.py prs
