"use strict";

const REPO_URL = "https://github.com/tc39/ecma262";

class DateUtils {
  static toReadable(d) {
    try {
      const date = new Date(d);
      return date.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    } catch (e) {
      return d;
    }
  }
}

class RenderedPageList {
  async run(type) {
    await this.loadResources();

    if (type == "revs") {
      this.populateRevList();
    } else {
      this.populatePRList();
    }
  }

  async loadResources() {
    [this.revs, this.prs] = await Promise.all([
      this.getJSON("./history/revs.json"),
      this.getJSON("./history/prs.json"),
    ]);

    this.prnums = Object.keys(this.prs)
      .map(prnum => parseInt(prnum, 10))
      .sort((a, b) => b - a);
  }

  async getJSON(path) {
    const response = await fetch(path);
    return response.json();
  }

  populateRevList() {
    const list = document.getElementById("rev-list");
    for (const rev of this.revs) {
      const parent = rev.parents.split(/ /)[0];

      const row = document.createElement("tr");

      const summaryCell = document.createElement("td");
      row.appendChild(summaryCell);

      const subject = document.createElement("div");
      subject.classList.add("subject");
      summaryCell.appendChild(subject);

      const link = document.createElement("a");
      link.href = `${REPO_URL}/commit/${rev.hash}`;
      link.textContent = rev.subject;
      subject.appendChild(link);

      const authorAndDate = document.createElement("div");
      authorAndDate.classList.add("author-and-date");
      summaryCell.appendChild(authorAndDate);

      const author = document.createElement("span");
      author.textContent = `by ${rev.author}`;
      authorAndDate.appendChild(author);

      const date = document.createElement("span");
      date.textContent = ` (${DateUtils.toReadable(rev.date)})`;
      authorAndDate.appendChild(date);

      const diffCell = document.createElement("td");
      diffCell.classList.add("diff-cell");
      row.appendChild(diffCell);

      const diffLink = document.createElement("a");
      diffLink.href = `./#from=${parent}&to=${rev.hash}&id=combined`;
      diffLink.textContent = "Compare";
      subject.appendChild(link);

      diffCell.appendChild(diffLink);

      const renderedCell = document.createElement("td");
      renderedCell.classList.add("rendered-cell");
      row.appendChild(renderedCell);

      const renderedLink = document.createElement("a");
      renderedLink.href = `./history/${rev.hash}/index.html`;
      renderedLink.textContent = "Rendered page";
      subject.appendChild(link);

      renderedCell.appendChild(renderedLink);

      list.appendChild(row);
    }
  }

  populatePRList() {
    const list = document.getElementById("pr-list");
    for (const num of this.prnums) {
      const pr = this.prs[num];

      const row = document.createElement("tr");

      const summaryCell = document.createElement("td");
      row.appendChild(summaryCell);

      const subject = document.createElement("div");
      subject.classList.add("subject");
      summaryCell.appendChild(subject);

      const link = document.createElement("a");
      link.href = `${REPO_URL}/pull/${num}`;
      link.textContent = pr.title;
      subject.appendChild(link);

      const authorAndDate = document.createElement("div");
      authorAndDate.classList.add("author-and-date");
      summaryCell.appendChild(authorAndDate);

      const prnum = document.createElement("span");
      prnum.textContent = `#${num} `;
      authorAndDate.appendChild(prnum);

      const author = document.createElement("span");
      author.textContent = `by ${pr.login}`;
      authorAndDate.appendChild(author);

      const date = document.createElement("span");
      date.textContent = ` (${DateUtils.toReadable(pr.updated_at)})`;
      authorAndDate.appendChild(date);

      const diffCell = document.createElement("td");
      diffCell.classList.add("diff-cell");
      row.appendChild(diffCell);

      const diffLink = document.createElement("a");
      diffLink.href = `./#pr=${num}`;
      diffLink.textContent = "Compare";
      subject.appendChild(link);

      diffCell.appendChild(diffLink);

      const renderedCell = document.createElement("td");
      renderedCell.classList.add("rendered-cell");
      row.appendChild(renderedCell);

      const renderedLink = document.createElement("a");
      renderedLink.href = `./history/PR/${num}/${pr.head}/index.html`;
      renderedLink.textContent = "Rendered page";
      subject.appendChild(link);

      renderedCell.appendChild(renderedLink);

      list.appendChild(row);
    }
  }
}

function bodyOnLoad(type) {
  new RenderedPageList().run(type).catch(e => console.error(e));
}
