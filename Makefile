ECMA262_COMPARE := $(dir $(firstword $(MAKEFILE_LIST)))
VENV_BIN_DIR := $(ECMA262_COMPARE)venv/bin
PIP := $(VENV_BIN_DIR)/pip
PYTHON := $(VENV_BIN_DIR)/python

py-venv:
	python3 -m venv venv

py-venv-bootstrap:
	python3 -m venv venv

store-pr-comments:
	$(PYTHON) build.py store-pr-comments
