ECMA262_COMPARE := $(dir $(firstword $(MAKEFILE_LIST)))
VENV_BIN_DIR := $(ECMA262_COMPARE)venv/bin
PIP := $(VENV_BIN_DIR)/pip
PYTHON := $(VENV_BIN_DIR)/python

init:
	python3 -m venv venv &&\
	$(PIP) install --upgrade pip &&\
	$(PIP) install -r requirements.txt
	$(PYTHON) build.py init

update:
	$(PYTHON) build.py update

update1:
	$(PYTHON) build.py update1

pr:
	$(PYTHON) build.py pr all

prs:
	$(PYTHON) build.py prs
