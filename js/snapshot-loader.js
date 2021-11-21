"use strict";

/* global Base */

class SnapshotLoader extends Base {
  constructor() {
    super();

    this.notfoundPR = undefined;
    this.notfoundRev = undefined;
  }

  async run() {
    await this.loadResources();
    await this.parseQuery();
  }

  async getIndex(hash) {
    return this.getTextGZ(`./history/${hash}/index.html.gz`);
  }

  async loadIndex(hash) {
    const source = await this.getIndex(hash);
    const base = `<base href="./history/${hash}/">`;
    document.documentElement.innerHTML = base + source;

    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      const elem = document.getElementById(id);
      if (elem) {
        elem.scrollIntoView();
      }
    }
  }

  prToPath(pr) {
    return `PR/${pr.number}/${pr.head}`;
  }

  async parseQuery() {
    let query = window.location.search.slice(1);

    if (!query) {
      // Backward compat
      query = window.location.hash.slice(1);
    }

    const items = query.split("&");
    const queryParams = {};
    for (const item of items) {
      const [name, value] = item.split("=");
      try {
        queryParams[name] = decodeURIComponent(value);
      } catch (e) {}
    }

    if ("rev" in queryParams) {
      const rev = queryParams.rev;
      if (!(rev in this.revMap)) {
        this.notfoundRev = rev;
        this.showNotFound();
        return;
      }
      this.loadIndex(queryParams.rev);
    } else if ("pr" in queryParams) {
      const prnum = queryParams.pr;
      if (!(prnum in this.prMap)) {
        this.notfoundPR = prnum;
        this.showNotFound();
        return;
      }

      const pr = this.prMap[prnum];
      this.loadIndex(this.prToPath(pr));
    } else {
      document.body.textContent = `Requires rev or pr parameter.`;
    }
  }

  showNotFound() {
    if (this.notfoundPR) {
      document.body.textContent = `PR ${this.notfoundPR} is not found. This can happen if recent history data hasn't been deployed yet. Try again 10 minutes later.`;
    } else if (this.notfoundRev) {
      document.body.textContent = `Revision ${this.notfoundRev} is not found. This can happen if the revision is too old.`;
    }
  }
}

const loader = new SnapshotLoader();

/* exported onBodyLoad */
function onBodyLoad() {
  loader.run().catch(e => console.error(e));
}
