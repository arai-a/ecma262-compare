"use strict";

let revs;
let prs;

function bodyOnLoad(type) {
  run(type).catch(e => console.log(e));
}

async function run(type) {
  await loadResources();

  if (type == "revs") {
    populateRevList();
  } else {
    populatePRList();
  }
}

function populateRevList() {
  const list = document.getElementById("rev-list");
  for (const rev of revs) {
    const parent = rev.parents.split(/ /)[0];

    const row = document.createElement("tr");

    const summaryCell = document.createElement("td");
    row.appendChild(summaryCell);

    const subject = document.createElement("div");
    subject.classList.add("subject");
    summaryCell.appendChild(subject);

    const link = document.createElement("a");
    link.href = `https://github.com/tc39/ecma262/commit/${rev.hash}`;
    link.textContent = rev.subject;
    subject.appendChild(link);

    const authorAndDate = document.createElement("div");
    authorAndDate.classList.add("author-and-date");
    summaryCell.appendChild(authorAndDate);

    const author = document.createElement("span");
    author.textContent = `by ${rev.author}`;
    authorAndDate.appendChild(author);

    const date = document.createElement("span");
    date.textContent = ` (${rev.date})`;
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

function populatePRList() {
  const list = document.getElementById("pr-list");
  for (const num of Object.keys(prs).sort((a, b) => parseInt(b) - parseInt(a))) {
    const pr = prs[num];

    const row = document.createElement("tr");

    const summaryCell = document.createElement("td");
    row.appendChild(summaryCell);

    const subject = document.createElement("div");
    subject.classList.add("subject");
    summaryCell.appendChild(subject);

    const link = document.createElement("a");
    link.href = `https://github.com/tc39/ecma262/pull/${num}`;
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

async function loadResources() {
  revs = await (await fetch("./revs.json")).json();
  prs = await (await fetch("./prs.json")).json();
}
