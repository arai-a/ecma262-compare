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

class SnapshotList {
  async run(type) {
    await this.loadResources();

    if (type === "revs") {
      this.populateRevList();
    } else {
      this.populatePRList("num", -1);
    }
  }

  async loadResources() {
    [this.revs, this.prs] = await Promise.all([
      this.getJSON("./history/revs.json"),
      this.getJSON("./history/prs.json?20200217a"),
    ]);

    this.revMap = {};
    for (const rev of this.revs) {
      this.revMap[rev.hash] = rev;
    }

    this.prMap = {};
    for (const pr of this.prs) {
      this.prMap[pr.number] = pr;
    }
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

      if (parent in this.revMap) {
        const diffLink = document.createElement("a");
        diffLink.href = `./?rev=${rev.hash}`;
        diffLink.textContent = "Compare";
        subject.appendChild(link);

        diffCell.appendChild(diffLink);
      } else {
        diffCell.textContent = "-";
      }

      const snapshotCell = document.createElement("td");
      snapshotCell.classList.add("snapshot-cell");
      row.appendChild(snapshotCell);

      const snapshotLink = document.createElement("a");
      snapshotLink.href = `./history/${rev.hash}/index.html`;
      snapshotLink.textContent = "Snapshot";
      subject.appendChild(link);

      snapshotCell.appendChild(snapshotLink);

      list.appendChild(row);
    }
  }

  populatePRList(sortBy, order) {
    const list = document.getElementById("pr-list");
    list.textContent = "";

    {
      const row = document.createElement("tr");

      const headerCell = document.createElement("td");
      row.appendChild(headerCell);

      const sortByNum = document.createElement("button");
      sortByNum.classList.add("round-button");
      sortByNum.textContent = "Sort by PR number";
      sortByNum.addEventListener("click", () => {
        if (sortBy === "num") {
          order = -order;
        }
        this.populatePRList("num", order);
      });

      const sortByDate = document.createElement("button");
      sortByDate.classList.add("round-button");
      sortByDate.textContent = "Sort by commit date";
      sortByDate.addEventListener("click", () => {
        if (sortBy === "date") {
          order = -order;
        }
        this.populatePRList("date", order);
      });

      headerCell.appendChild(sortByNum);
      headerCell.appendChild(sortByDate);

      const diffCell = document.createElement("td");
      diffCell.classList.add("diff-cell");
      row.appendChild(diffCell);

      const snapshotCell = document.createElement("td");
      snapshotCell.classList.add("snapshot-cell");
      row.appendChild(snapshotCell);

      list.appendChild(row);
    }

    const sorter = sortBy === "num" ? (a, b) => {
      return (a.number - b.number) * order;
    } : (a, b) => {
      const da = new Date(a.revs[0].date);
      const db = new Date(b.revs[0].date);
      return (da.getTime() - db.getTime()) * order;
    };

    for (const pr of this.prs.sort(sorter)) {
      const row = document.createElement("tr");

      const summaryCell = document.createElement("td");
      row.appendChild(summaryCell);

      const subject = document.createElement("div");
      subject.classList.add("subject");
      summaryCell.appendChild(subject);

      const link = document.createElement("a");
      link.href = `${REPO_URL}/pull/${pr.number}`;
      link.textContent = pr.title;
      subject.appendChild(link);

      const authorAndDate = document.createElement("div");
      authorAndDate.classList.add("author-and-date");
      summaryCell.appendChild(authorAndDate);

      const prnum = document.createElement("span");
      prnum.textContent = `#${pr.number} `;
      authorAndDate.appendChild(prnum);

      const author = document.createElement("span");
      author.textContent = `by ${pr.login}`;
      authorAndDate.appendChild(author);

      const date = document.createElement("span");
      date.textContent = ` (${DateUtils.toReadable(pr.revs[0].date)})`;
      authorAndDate.appendChild(date);

      const diffCell = document.createElement("td");
      diffCell.classList.add("diff-cell");
      row.appendChild(diffCell);

      const diffLink = document.createElement("a");
      diffLink.href = `./?pr=${pr.number}`;
      diffLink.textContent = "Compare";
      subject.appendChild(link);

      diffCell.appendChild(diffLink);

      const snapshotCell = document.createElement("td");
      snapshotCell.classList.add("snapshot-cell");
      row.appendChild(snapshotCell);

      const snapshotLink = document.createElement("a");
      snapshotLink.href = `./history/PR/${pr.number}/${pr.head}/index.html`;
      snapshotLink.textContent = "Snapshot";
      subject.appendChild(link);

      snapshotCell.appendChild(snapshotLink);

      list.appendChild(row);
    }
  }
}

/* exported onBodyLoad */
function onBodyLoad(type) {
  new SnapshotList().run(type).catch(e => console.error(e));
}
