"use strict";

const REPO_URL = "https://github.com/tc39/ecma262";

function sleep(t) {
  return new Promise(r => setTimeout(r, t));
}

// Insert list marker into list element.
//
// While creating diff, extra list element can be added.
// In that case, the default CSS list marker is affected by the change.
//
// So, instead of using CSS list marker in the diff view, insert text list
// marker in the list element.
//
// This code is based on
// https://hg.mozilla.org/mozilla-central/raw-file/fffcb4bbc8b17a34f5fa5013418a8956d0fdcc7a/layout/generic/nsBulletFrame.cpp
class ListMarkUtils {
  static getListDepth(node) {
    let depth = 0;
    while (node && node !== document.body) {
      if (node.nodeName.toLowerCase() === "ol") {
        depth++;
      }
      node = node.parentNode;
    }
    return depth;
  }

  static decimalToText(ordinal) {
    return ordinal.toString(10);
  }

  static romanToText(ordinal, achars, bchars) {
    if (ordinal < 1 || ordinal > 3999) {
      this.decimalToText(ordinal);
      return false;
    }
    let addOn;
    const decStr = ordinal.toString(10);
    const len = decStr.length;
    let romanPos = len;
    let result = "";

    for (let i = 0; i < len; i++) {
      const dp = decStr.substr(i, 1);
      romanPos--;
      addOn = "";
      switch(dp) {
        case "3":
          addOn += achars[romanPos];
          // FALLTHROUGH
        case "2":
          addOn += achars[romanPos];
          // FALLTHROUGH
        case "1":
          addOn += achars[romanPos];
          break;
        case "4":
          addOn += achars[romanPos];
          // FALLTHROUGH
        case "5": case "6":
        case "7": case "8":
          addOn += bchars[romanPos];
          for (let n = 0; "5".charCodeAt(0) + n < dp.charCodeAt(0); n++) {
            addOn += achars[romanPos];
          }
          break;
        case "9":
          addOn += achars[romanPos];
          addOn += achars[romanPos+1];
          break;
        default:
          break;
      }
      result += addOn;
    }
    return result;
  }

  static charListToText(ordinal, chars) {
    const base = chars.length;
    let buf = "";
    if (ordinal < 1) {
      return this.decimalToText(ordinal);
    }
    do {
      ordinal--;
      const cur = ordinal % base;
      buf = chars.charAt(cur) + buf;
      ordinal = Math.floor(ordinal / base);
    } while (ordinal > 0);
    return buf;
  }

  static toListMark(i, depth) {
    if (depth === 1 || depth === 4) {
      return this.decimalToText(i + 1);
    }
    if (depth === 2 || depth === 5) {
      return this.charListToText(i + 1, "abcdefghijklmnopqrstuvwxyz");
    }
    if (depth === 3 || depth === 6) {
      return this.romanToText(i + 1, "ixcm", "vld");
    }

    return this.decimalToText(i + 1);
  }

  static textify(box) {
    for (const ol of box.getElementsByTagName("ol")) {
      const depth = this.getListDepth(ol);

      let i = 0;
      for (const li of ol.children) {
        if (li.nodeName.toLowerCase() !== "li") {
          continue;
        }

        const mark = document.createTextNode(`${this.toListMark(i, depth)}. `);
        li.insertBefore(mark, li.firstChild);

        i++;
      }
    }
  }
}

class PromiseWorker {
  constructor(path) {
    this.nextId = 0;
    this.resolveMap = {};
    this.worker = new Worker(path);
    this.worker.onmessage = msg => {
      const id = msg.data.id;
      const resolve = this.resolveMap[id];
      delete this.resolveMap[id];
      resolve(msg.data.data);
    };
  }

  async run(data) {
    const id = this.nextId;
    this.nextId++;
    if (this.nextId > 1000000) {
      this.nextId = 0;
    }

    return new Promise(resolve => {
      this.resolveMap[id] = resolve;

      this.worker.postMessage({
        data,
        id,
      });
    });
  }
}

const HTMLPathDiffWorker = new PromiseWorker("./js/path-diff-worker.js");
const HTMLTreeDiffWorker = new PromiseWorker("./js/tree-diff-worker.js?20200302-b");

class HTMLPathDiff {
  static diff(s1, s2) {
    return HTMLPathDiffWorker.run({
      s1,
      s2,
      type: "diff",
    });
  }

  static splitForDiff(s1, s2) {
    return HTMLPathDiffWorker.run({
      s1,
      s2,
      type: "splitForDiff",
    });
  }
}

// Calculate diff between 2 DOM tree.
class HTMLTreeDiff {
  constructor() {
  }

  // Calculate diff between 2 DOM tree.
  async diff(diffNode, node1, node2) {
    this.addNumbering("1-", node1);
    this.addNumbering("2-", node2);

    await this.splitForDiff(node1, node2);

    this.combineNodes(node1, "li");
    this.combineNodes(node2, "li");

    const nodeObj1 = this.DOMTreeToPlainObject(node1);
    const nodeObj2 = this.DOMTreeToPlainObject(node2);

    const diffNodeObj = await HTMLTreeDiffWorker.run({
      nodeObj1,
      nodeObj2,
    });

    const tmp = this.plainObjectToDOMTree(diffNodeObj);
    for (const child of [...tmp.childNodes]) {
      diffNode.appendChild(child);
    }

    this.combineNodes(diffNode, "*");

    this.swapInsDel(diffNode);

    this.removeNumbering(diffNode);
  }

  // Convert DOM tree to object tree.
  DOMTreeToPlainObject(node) {
    const result = this.DOMElementToPlainObject(node);

    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (this.isUnnecessaryText(child)) {
          continue;
        }

        result.textLength += this.compressSpaces(child.textContent).length;
        this.splitTextInto(result.childNodes, child.textContent);
        continue;
      }

      if (child.nodeType === Node.ELEMENT_NODE) {
        const childObj = this.DOMTreeToPlainObject(child);
        result.childNodes.push(childObj);
        result.textLength += childObj.textLength;
      }
    }

    return result;
  }

  compressSpaces(s) {
    return s.replace(/\s+/, " ");
  }

  // Remove unnecessary whitespace texts that can confuse diff algorithm.
  //
  // Diff algorithm used here isn't good at finding diff in repeating
  // structure, such as list element, separated by same whitespaces.
  //
  // Remove such whitespaces between each `li`, to reduce the confusion.
  isUnnecessaryText(node) {
    if (!/^[ \r\n\t]*$/.test(node.textContent)) {
      return false;
    }

    if (node.previousSibling) {
      if (this.isBlock(node.previousSibling)) {
        return true;
      }
    }
    if (node.nextSibling) {
      if (this.isBlock(node.nextSibling)) {
        return true;
      }
    }

    return false;
  }

  isBlock(node) {
    const name = node.nodeName.toLowerCase();
    return name === "ul" || name === "ol" || name === "li" ||
      name === "div" || name === "p" ||
      name === "emu-clause" || name === "emu-annex" ||
      name === "h1";
  }

  // Convert single DOM element to object, without child nodes.
  DOMElementToPlainObject(node) {
    const attributes = {};
    if (node.attributes) {
      for (const attr of node.attributes) {
        attributes[attr.name] = attr.value;
      }
    }

    return this.createPlainObject(
      node.nodeName.toLowerCase(), node.id, attributes);
  }

  // Create a plain object representation for an empty DOM element.
  createPlainObject(name, id = undefined, attributes = {}) {
    return {
      attributes,
      childNodes: [],
      id,
      name,
      textLength: 0,
    };
  }

  // Split text by whitespaces and punctuation, given that
  // diff is performed on the tree of nodes, and text is the
  // minimum unit.
  //
  // Whitespaces are appended to texts before it, instead of creating Text
  // node with whitespace alone.
  // This is necessary to avoid matching each whitespace in different sentence.
  splitTextInto(childNodes, text) {
    while (true) {
      const spaceIndex = text.search(/\s[^\s]/);
      const punctIndex = text.search(/[.,:;?!\-_()[\]]/);
      if (spaceIndex === -1 && punctIndex === -1) {
        break;
      }

      if (punctIndex !== -1 && (spaceIndex === -1 || punctIndex < spaceIndex)) {
        if (punctIndex > 0) {
          childNodes.push(text.slice(0, punctIndex));
        }
        childNodes.push(text.slice(punctIndex, punctIndex + 1));
        text = text.slice(punctIndex + 1);
      } else {
        childNodes.push(text.slice(0, spaceIndex + 1));
        text = text.slice(spaceIndex + 1);
      }
    }
    if (text) {
      childNodes.push(text);
    }
  }

  // Add unique ID ("tree-diff-num" attribute) to each element.
  //
  // See `splitForDiff` for more details.
  addNumbering(prefix, node) {
    let i = 0;
    for (const child of node.getElementsByTagName("*")) {
      child.setAttribute("tree-diff-num", prefix + i);
      i++;
    }
  }

  // Split both DOM tree, using text+path based LCS, to have similar tree
  // structure.
  //
  // This is a workaround for the issue that raw tree LCS cannot handle
  // split/merge.
  //
  // To solve the issue, split both tree by `splitForDiff` to make each text
  // match even if parent tree gets split/merged.
  //
  // This caused another issue when `splitForDiff` split more than necessary
  // (like, adding extra list element).
  //
  // Such nodes are combined in `combineNodes`, based on the unique ID
  // added by `addNumbering`, and those IDs are removed in `removeNumbering`.
  //
  // Also, `LCSToDiff` always places `ins` after `del`, but `combineNodes` can
  // merge 2 nodes where first one ends with `ins` and the second one starts
  // with `del`. `swapInsDel` fixes up the order.
  async splitForDiff(node1, node2) {
    const [html1, html2] = await HTMLPathDiff.splitForDiff(
      node1.innerHTML, node2.innerHTML);
    node1.innerHTML = html1;
    node2.innerHTML = html2;
  }

  // Convert object tree to DOM tree.
  plainObjectToDOMTree(nodeObj) {
    if (typeof nodeObj === "string") {
      return document.createTextNode(nodeObj);
    }

    const result = document.createElement(nodeObj.name);
    for (const [key, value] of Object.entries(nodeObj.attributes)) {
      result.setAttribute(key, value);
    }
    for (const child of nodeObj.childNodes) {
      result.appendChild(this.plainObjectToDOMTree(child));
    }

    return result;
  }

  // Combine adjacent nodes with same ID ("tree-diff-num" attribute) into one
  //
  // See `splitForDiff` for more details.
  combineNodes(node, name) {
    const removedNodes = new Set();

    for (const child of [...node.getElementsByTagName(name)]) {
      if (removedNodes.has(child)) {
        continue;
      }

      if (!child.hasAttribute("tree-diff-num")) {
        continue;
      }

      const num = child.getAttribute("tree-diff-num");
      while (true) {
        if (!child.nextSibling) {
          break;
        }

        if (!(child.nextSibling instanceof Element)) {
          break;
        }

        const next = child.nextSibling;
        if (next.getAttribute("tree-diff-num") !== num) {
          break;
        }

        while (next.firstChild) {
          child.appendChild(next.firstChild);
        }

        removedNodes.add(next);
        next.remove();
      }
    }
  }

  // Swap `ins`+`del` to `del`+`ins`.
  //
  // See `splitForDiff` for more details.
  swapInsDel(node) {
    for (const child of [...node.getElementsByClassName("htmldiff-ins")]) {
      if (!child.nextSibling) {
        continue;
      }

      if (!(child.nextSibling instanceof Element)) {
        continue;
      }

      if (child.nextSibling.classList.contains("htmldiff-del")) {
        child.before(child.nextSibling);
      }
    }
  }

  // Add "tree-diff-num" attribute from all elements.
  //
  // See `splitForDiff` for more details.
  removeNumbering(node) {
    for (const child of node.getElementsByTagName("*")) {
      child.removeAttribute("tree-diff-num");
    }
  }
}

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

// ECMAScript Language Specification Comparator
class Comparator {
  constructor() {
    // The `sections.json` data for the currently selected "from" revision.
    this.fromSecData = {};

    // The `sections.json` data for the currently selected "to" revision.
    this.toSecData = {};

    // `True` if diff calculation is ongoing.
    this.processing = false;

    // Set to `True` to tell the currently ongoing diff calculation to abort.
    this.abortProcessing = false;

    this.prFilter = document.getElementById("pr-filter");
    this.revFilter = document.getElementById("rev-filter");
    this.fromRev = document.getElementById("from-rev");
    this.toRev = document.getElementById("to-rev");
    this.secList = document.getElementById("sec-list");
    this.prLink = document.getElementById("pr-link");
    this.fromLink = document.getElementById("from-history-link");
    this.toLink = document.getElementById("to-history-link");
    this.result = document.getElementById("result");
    this.diffStat = document.getElementById("diff-stat");
    this.secHit = document.getElementById("sec-hit");
    this.viewDiff = document.getElementById("view-diff");
    this.viewFrom = document.getElementById("view-from");
    this.viewTo = document.getElementById("view-to");
    this.viewFromTab = document.getElementById("view-from-tab");
    this.viewToTab = document.getElementById("view-to-tab");
    this.viewDiffTab = document.getElementById("view-diff-tab");
    this.workBoxContainer = document.getElementById("work-box-container");
    this.pathDiff = document.getElementById("path-diff");
    this.scroller = document.getElementById("scroller");
    this.searchField = document.getElementById("search");
    this.revsAndPRsList = document.getElementById("revs-and-prs-list");
    this.revsAndPRs = [];
    this.revsAndPRsMap = {};

    this.currentQuery = "";
  }

  async run() {
    await this.loadResources();
    this.populateLists();

    await this.parseQuery();
  }

  async loadResources() {
    [this.revs, this.prs] = await Promise.all([
      this.getJSON("./history/revs.json"),
      this.getJSON("./history/prs.json"),
    ]);

    this.revMap = {};
    for (const rev of this.revs) {
      this.revMap[rev.hash] = rev;
    }

    this.prMap = {};
    for (const pr of this.prs) {
      pr.parent = this.getFirstParent(pr.revs[pr.revs.length-1]);
      this.prMap[pr.number] = pr;
    }
  }

  // Return the first parent of `rev`.
  // `rev.parents` can contain multiple hash if it's a merge.
  getFirstParent(rev) {
    return rev.parents.split(" ")[0];
  }

  async getJSON(path) {
    const response = await fetch(path);
    return response.json();
  }

  populateLists() {
    this.populatePRs(this.prFilter);
    this.populateRevs(this.revFilter);
    this.populateAllRevs(this.fromRev);
    this.populateAllRevs(this.toRev);
    this.populateRevsAndPRs(
      this.revsAndPRsList, this.revsAndPRs, this.revsAndPRsMap);
  }

  // Populate PR filter.
  populatePRs(menu) {
    while (menu.firstChild) {
      menu.firstChild.remove();
    }

    const opt = document.createElement("option");
    opt.value = "-";
    opt.textContent = "-";
    menu.appendChild(opt);

    const MAX_TITLE_LENGTH = 80;

    for (const pr of this.prs) {
      const opt = document.createElement("option");
      opt.value = pr.number;
      let title = pr.title;
      if (title.length > MAX_TITLE_LENGTH) {
        title = title.slice(0, MAX_TITLE_LENGTH - 1) + "\u2026";
      }
      opt.textContent = `#${pr.number}: ${title} (${pr.login}/${pr.ref})`;
      menu.appendChild(opt);
    }

    menu.value = "-";
  }

  // Populate Revision filter.
  populateRevs(menu) {
    while (menu.firstChild) {
      menu.firstChild.remove();
    }

    const opt = document.createElement("option");
    opt.value = "-";
    opt.textContent = "-";
    menu.appendChild(opt);

    const MAX_SUBJECT_LENGTH = 80;

    for (const rev of this.revs) {
      const parent = this.getFirstParent(rev);
      if (!(parent in this.revMap)) {
        continue;
      }

      const opt = document.createElement("option");
      opt.value = rev.hash;
      let subject = rev.subject;
      if (subject.length > MAX_SUBJECT_LENGTH) {
        subject = subject.slice(0, MAX_SUBJECT_LENGTH - 1) + "\u2026";
      }
      opt.textContent = `${rev.hash} (${DateUtils.toReadable(rev.date)}) ${subject}`;
      menu.appendChild(opt);
    }
  }

  // Populate From and To filter.
  populateAllRevs(menu) {
    while (menu.firstChild) {
      menu.firstChild.remove();
    }

    for (const rev of this.revs) {
      const opt = document.createElement("option");
      opt.value = rev.hash;
      opt.textContent = `${rev.hash} (${DateUtils.toReadable(rev.date)})`;
      menu.appendChild(opt);
    }

    for (const pr of this.prs) {
      const opt = document.createElement("option");
      opt.value = this.prToOptValue(pr);
      opt.textContent = `${pr.head} (PR ${pr.number} by ${pr.login})`;
      menu.appendChild(opt);
    }
  }

  // Populate autocomplete for search.
  populateRevsAndPRs(list, revsAndPRs, map) {
    for (const pr of this.prs) {
      const value = `#${pr.number}`;
      const label = `#${pr.number}: ${pr.title} (${pr.login}/${pr.ref}, head=${pr.head})`;
      revsAndPRs.push({ label, value });
      map[label] = value;

      const opt = document.createElement("option");
      opt.textContent = label;
      list.appendChild(opt);
    }

    for (const rev of this.revs) {
      const value = rev.hash;
      const label = `${rev.hash} (${DateUtils.toReadable(rev.date)}) ${rev.subject}`;
      revsAndPRs.push({ label, value });
      map[label] = value;

      const opt = document.createElement("option");
      opt.textContent = label;
      list.appendChild(opt);
    }
  }

  prToOptValue(pr) {
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

    let section;
    if ("id" in queryParams) {
      section = queryParams.id;
    }

    if ("rev" in queryParams) {
      this.updateUI("rev", {
        rev: queryParams.rev,
        section,
      });
    } else if ("pr" in queryParams) {
      this.updateUI("pr", {
        pr: queryParams.pr,
        section,
      });
    } else if ("from" in queryParams && "to" in queryParams) {
      this.updateUI("from-to", {
        from: queryParams.from,
        section,
        to: queryParams.to,
      });
    } else {
      this.updateUI("from-to", {});
    }
  }

  async updateUI(type, params) {
    if (type === "rev") {
      const hash = params.rev;
      if (hash in this.revMap) {
        this.revFilter.value = hash;
        this.selectFromToForRev(hash);
      }

      this.prFilter.value = "-";
    } else if (type === "pr") {
      const prnum = params.pr;
      if (prnum in this.prMap) {
        this.prFilter.value = prnum;
        this.selectFromToForPR(prnum);
        this.updatePRLink(prnum);
      }

      this.revFilter.value = "-";
    } else if (type === "from-to") {
      if ("from" in params) {
        const from = params.from;
        if (from in this.revMap) {
          this.fromRev.value = from;
        }
      }
      if ("to" in params) {
        const to = params.to;
        if (to in this.revMap) {
          this.toRev.value = to;
        }
      }

      this.revFilter.value = "-";
      this.prFilter.value = "-";
    }

    this.updateHistoryLink();
    this.updateRevInfo();
    await this.updateSectionList();

    if ("section" in params && params.section) {
      this.secList.value = params.section;
    } else {
      this.secList.value = "combined";
    }

    this.updateURL();
    await this.compare();
  }

  selectFromToForPR(prnum) {
    if (prnum in this.prMap) {
      const pr = this.prMap[prnum];
      this.fromRev.value = pr.parent;
      this.toRev.value = this.prToOptValue(pr);
    }
  }

  selectFromToForRev(hash) {
    if (hash in this.revMap) {
      const rev = this.revMap[hash];
      const parent = this.getFirstParent(rev);
      if (parent in this.revMap) {
        this.fromRev.value = parent;
        this.toRev.value = hash;
      }
    }
  }

  updatePRLink(prnum) {
    if (prnum in this.prMap) {
      const pr = this.prMap[prnum];
      this.prLink.href = `${REPO_URL}/pull/${pr.number}`;
      this.prLink.textContent = `Open PR ${pr.number}`;
    } else {
      this.prLink.textContent = "";
    }
  }

  updateHistoryLink() {
    this.fromLink.href = `./history/${this.fromRev.value}/index.html`;
    this.toLink.href = `./history/${this.toRev.value}/index.html`;
  }

  updateRevInfo() {
    this.updateRevInfoFor("from", this.fromRev.value);
    this.updateRevInfoFor("to", this.toRev.value);
  }

  updateRevInfoFor(id, name) {
    const subjectLink = document.getElementById(`${id}-rev-subject-link`);
    const note = document.getElementById(`${id}-rev-note`);
    const author = document.getElementById(`${id}-rev-author`);
    const date = document.getElementById(`${id}-rev-date`);

    const m = name.match(/PR\/(\d+)\/(.+)/);
    if (m) {
      const prnum = m[1];
      const pr = this.prMap[prnum];

      subjectLink.textContent = pr.revs[0].subject;
      subjectLink.href = `${REPO_URL}/pull/${pr.number}`;
      if (pr.revs.length > 1) {
        note.textContent = ` + ${pr.revs.length - 1} revisions`;
      } else {
        note.textContent = "";
      }
      author.textContent = `by ${pr.revs[0].author}`;
      date.textContent = `(${DateUtils.toReadable(pr.revs[0].date)})`;
    } else if (name in this.revMap) {
      const rev = this.revMap[name];

      subjectLink.textContent = rev.subject;
      subjectLink.href = `${REPO_URL}/commit/${rev.hash}`;
      note.textContent = "";
      author.textContent = `by ${rev.author}`;
      date.textContent = `(${DateUtils.toReadable(rev.date)})`;
    } else {
      subjectLink.textContent = "-";
      subjectLink.removeAttribute("href");
      note.textContent = "";
      author.textContent = "-";
      date.textContent = "";
    }
  }

  async updateSectionList() {
    this.result.textContent = "";
    this.diffStat.textContent = "";

    this.diffStat.textContent = "Loading...";
    [this.fromSecData, this.toSecData] = await Promise.all([
      this.getSecData("from"),
      this.getSecData("to")
    ]);
    this.diffStat.textContent = "";

    this.secHit.textContent = "";

    while (this.secList.firstChild) {
      this.secList.firstChild.remove();
    }

    const fromSecSet = new Set(this.fromSecData.secList);
    const toSecSet = new Set(this.toSecData.secList);
    const secSet = new Set(this.fromSecData.secList.concat(this.toSecData.secList));

    const opt = document.createElement("option");
    opt.value = "combined";
    opt.textContent = "Combined view";
    this.secList.appendChild(opt);
    this.secList.value = opt.value;

    let count = 0;
    for (const secId of Array.from(secSet).sort((a, b) => {
      const aTitle = this.getComparableTitle(a);
      const bTitle = this.getComparableTitle(b);
      if (aTitle === bTitle) {
        return 0;
      }
      return aTitle < bTitle ? -1 : 1;
    })) {
      let stat;
      let mark;

      if (fromSecSet.has(secId)) {
        if (toSecSet.has(secId)) {
          if (this.isChanged(secId)) {
            stat = "mod";
            mark = "-+";
          } else {
            continue;
          }
        } else {
          stat = "del";
          mark = "-\u00A0";
        }
      } else {
        stat = "ins";
        mark = "+\u00A0";
      }

      const opt = document.createElement("option");
      opt.value = secId;

      const title = this.getSectionTitle(secId);

      if (title) {
        opt.textContent = `${mark} ${title.slice(0, 100)}`;
      } else {
        opt.textContent = `${mark} ${secId}`;
      }
      opt.className = stat;

      this.secList.appendChild(opt);
      count++;
    }

    if (count === 0) {
      this.secHit.textContent = `No difference (changes in markup or something)`;
    } else if (count === 1) {
      this.secHit.textContent = `${count} section found`;
    } else {
      this.secHit.textContent = `${count} sections found`;
    }
  }

  async getSecData(id) {
    const hash = this.hashOf(id);
    return this.getJSON(`./history/${hash}/sections.json`);
  }

  // Returns hash for selected item in "from" or "to" list.
  hashOf(id) {
    return document.getElementById(`${id}-rev`).value;
  }

  // Returns a string representation of section number+title that is comparable
  // with comparison operator.
  //
  // `secId` is the id of the section's header element.
  //
  // Each section number component is replaced with single code unit with the
  // number.
  getComparableTitle(secId) {
    const t = this.getSectionTitle(secId);
    return t.replace(/([0-9]+)/g, matched => String.fromCharCode(matched));
  }

  // Returns section number + title for the section.
  //
  // `secId` is the id of the section's header element.
  getSectionTitle(secId) {
    if (secId in this.fromSecData.secData) {
      const sec = this.fromSecData.secData[secId];
      return `${sec.num} ${sec.title}`;
    }

    if (secId in this.toSecData.secData) {
      const sec = this.toSecData.secData[secId];
      return `${sec.num} ${sec.title}`;
    }

    return "";
  }

  // Returns whether the section is changed, added, or removed between from/to
  // revisions.
  isChanged(secId) {
    if (!(secId in this.fromSecData.secData)) {
      return true;
    }
    if (!(secId in this.toSecData.secData)) {
      return true;
    }

    const fromHTML = this.fromSecData.secData[secId].html;
    const toHTML = this.toSecData.secData[secId].html;

    const fromHTMLFiltered = this.filterAttributeForComparison(fromHTML);
    const toHTMLFiltered = this.filterAttributeForComparison(toHTML);

    return fromHTMLFiltered !== toHTMLFiltered;
  }

  // Filter attributes that should be ignored when comparing 2 revisions.
  filterAttributeForComparison(s) {
    return s
      .replace(/ aoid="[^"]+"/g, "")
      .replace(/ href="[^"]+"/g, "");
  }

  updateURL() {
    const id = this.secList.value;

    const params = [];
    const prnum = this.prFilter.value;
    const hash = this.revFilter.value;
    if (prnum !== "-") {
      params.push(`pr=${prnum}`);
      if (id !== "combined") {
        params.push(`id=${encodeURIComponent(id)}`);
      }
    } else if (hash !== "-") {
      params.push(`rev=${hash}`);
      if (id !== "combined") {
        params.push(`id=${encodeURIComponent(id)}`);
      }
    } else {
      const from = this.hashOf("from");
      const to = this.hashOf("to");
      if (from !== to) {
        params.push(`from=${this.hashOf("from")}`);
        params.push(`to=${this.hashOf("to")}`);
        if (id !== "combined") {
          params.push(`id=${encodeURIComponent(id)}`);
        }
      }
    }

    const query = params.length > 0 ? `?${params.join("&")}` : "";
    if (query !== this.currentQuery) {
      this.currentQuery = query;
      window.history.pushState(
        {},
        document.title,
        window.location.origin + window.location.pathname + query);
    }
  }

  async compare() {
    const secList = [];
    if (this.secList.value === "combined") {
      this.result.classList.add("combined");

      for (const opt of this.secList.children) {
        const id = opt.value;
        if (id === "combined") {
          continue;
        }

        const fromHTML = this.getSectionHTML(this.fromSecData, id);
        const toHTML = this.getSectionHTML(this.toSecData, id);
        secList.push([id, fromHTML, toHTML]);
      }
    } else {
      this.result.classList.remove("combined");
      const id = this.secList.value;

      const fromHTML = this.getSectionHTML(this.fromSecData, id);
      const toHTML = this.getSectionHTML(this.toSecData, id);
      secList.push([id, fromHTML, toHTML]);
    }

    if (this.viewDiff.checked) {
      this.result.classList.add("diff-view");

      this.viewFromTab.classList.remove("selected");
      this.viewToTab.classList.remove("selected");
      this.viewDiffTab.classList.add("selected");

      const sections = new Map();
      let differ = false;
      for (const [id, fromHTML, toHTML] of secList) {
        if (fromHTML !== toHTML) {
          differ = true;
        }
        sections.set(id, [fromHTML, toHTML]);
      }

      await this.combineSections(sections, "diff");

      const ins = this.result.getElementsByClassName("htmldiff-ins").length;
      const del = this.result.getElementsByClassName("htmldiff-del").length;

      let note = "";
      if (ins === 0 && del === 0 && differ) {
        note = " (changes in markup or something)";
      }

      if (ins === 0 && del === 0) {
        this.scroller.style.display = "none";
      } else {
        this.scroller.style.display = "block";
      }

      this.diffStat.textContent = `+${ins} -${del}${note}`;
    } else {
      this.scroller.style.display = "none";
      this.result.classList.remove("diff-view");

      if (this.viewFrom.checked) {
        this.viewFromTab.classList.add("selected");
        this.viewToTab.classList.remove("selected");
        this.viewDiffTab.classList.remove("selected");

        const sections = new Map();
        for (const [id, fromHTML, _toHTML] of secList) {
          sections.set(id, fromHTML);
        }

        await this.combineSections(sections, "from");
      } else if (this.viewTo.checked) {
        this.viewFromTab.classList.remove("selected");
        this.viewToTab.classList.add("selected");
        this.viewDiffTab.classList.remove("selected");

        const sections = new Map();
        for (const [id, _fromHTML, toHTML] of secList) {
          sections.set(id, toHTML);
        }

        await this.combineSections(sections, "to");
      } else {
        this.result.textContent = "";
      }

      this.diffStat.textContent = "";
    }

    this.addSingleSectionButtons();
  }

  getSectionHTML(data, secId) {
    if (data.secData && secId in data.secData) {
      return data.secData[secId].html;
    }
    return null;
  }

  async combineSections(sections, type) {
    if (this.processing) {
      this.abortProcessing = true;
      do {
        await sleep(100);
      } while (this.processing);
      this.abortProcessing = false;
    }

    this.processing = true;

    let i = 0;

    const len = sections.size;

    this.result.textContent = "";
    for (const [id, HTML] of sections) {
      i++;
      this.diffStat.textContent = `generating sections... ${i}/${len}`;
      if (this.abortProcessing) {
        break;
      }

      let box;
      if (type === "diff") {
        const workBox = document.createElement("div");
        this.workBoxContainer.appendChild(workBox);

        await this.createDiff(workBox, HTML[0], HTML[1]);

        workBox.remove();

        box = document.getElementById(`excluded-${id}`);
        if (box) {
          box.id = "";
          box.replaceWith(workBox);
        } else {
          box = workBox;
          this.result.appendChild(box);
        }
      } else {
        box = document.getElementById(`excluded-${id}`);
        if (box) {
          box.id = "";
          box.innerHTML = HTML;
        } else {
          box = document.createElement("div");
          box.innerHTML = HTML;
          this.result.appendChild(box);
        }
      }
    }

    if (!this.abortProcessing) {
      await this.fixupLink(type);
    }

    this.diffStat.textContent = "";

    this.processing = false;
  }

  async createDiff(box, fromHTML, toHTML) {
    const workBoxFrom = document.createElement("div");
    this.workBoxContainer.appendChild(workBoxFrom);
    const workBoxTo = document.createElement("div");
    this.workBoxContainer.appendChild(workBoxTo);

    if (fromHTML !== null) {
      workBoxFrom.innerHTML = fromHTML;
      ListMarkUtils.textify(workBoxFrom);
      this.removeExcludedContent(workBoxFrom);
    }

    if (toHTML !== null) {
      workBoxTo.innerHTML = toHTML;
      ListMarkUtils.textify(workBoxTo);
      this.removeExcludedContent(workBoxTo);
    }

    if (!this.pathDiff.checked) {
      await new HTMLTreeDiff().diff(box, workBoxFrom, workBoxTo);
    } else {
      fromHTML = workBoxFrom.innerHTML;
      toHTML = workBoxTo.innerHTML;

      box.innerHTML = await HTMLPathDiff.diff(fromHTML, toHTML);
    }

    workBoxFrom.remove();
    workBoxTo.remove();
  }

  removeExcludedContent(box) {
    for (const div of [...box.getElementsByTagName("div")]) {
      if (div.id && div.id.startsWith("excluded-")) {
        div.textContent = "";
      }
    }
  }

  // Replace links into the same document to links into rendered page.
  async fixupLink(type) {
    const fromRenderedPage = `./history/${this.fromRev.value}/index.html`;
    const toRenderedPage = `./history/${this.toRev.value}/index.html`;

    const links = this.result.getElementsByTagName("a");

    const BLOCK_LIMIT = 50;
    let lastSleep = Date.now();
    let i = 0;

    const len = links.length;

    for (const link of links) {
      i++;
      if (Date.now() > lastSleep + BLOCK_LIMIT) {
        this.diffStat.textContent = `fixing links up... ${i}/${len}`;
        await sleep(1);
        lastSleep = Date.now();

        if (this.abortProcessing) {
          break;
        }
      }

      if (!link.hasAttribute("href")) {
        continue;
      }
      const href = link.getAttribute("href");
      if (!href.startsWith("#")) {
        continue;
      }
      if (type === "from") {
        link.href = `${fromRenderedPage}${href}`;
      } else if (type === "to") {
        link.href = `${toRenderedPage}${href}`;
      } else {
        link.href = `${toRenderedPage}${href}`;
      }
    }
  }

  // Add button to show single section.
  addSingleSectionButtons() {
    const clauses = this.result.getElementsByTagName("emu-clause");
    const annex = this.result.getElementsByTagName("emu-annex");
    const sections = [...clauses, ...annex];

    if (sections.length < 2) {
      return;
    }

    for (const section of sections) {
      const id = section.id;
      if (!id) {
        return;
      }

      const h1s = section.getElementsByTagName("h1");
      if (h1s.length === 0) {
        return;
      }

      const h1 = h1s[0];

      const button = document.createElement("button");
      button.classList.add("single-section-button");
      button.textContent = "show single section";
      button.addEventListener("click", () => {
        window.scrollTo({
          left: 0,
          top: 0,
        });
        this.secList.value = id;
        this.onSecListChange().catch(e => console.error(e));
      });

      h1.appendChild(button);
    }
  }

  async onPRFilterChange() {
    this.updateUI("pr", {
      pr: this.prFilter.value,
    });
  }

  async onRevFilterChange() {
    this.updateUI("rev", {
      rev: this.revFilter.value,
    });
  }

  async onFromRevChange() {
    this.updateUI("from-to", {
      rev: this.revFilter.value,
    });
  }

  async onToRevChange() {
    this.updateUI("from-to", {
      rev: this.revFilter.value,
    });
  }

  async onSecListChange() {
    this.updateURL();
    await this.compare();
  }

  async onTabChange() {
    await this.compare();
  }

  async onPathDiffChange() {
    await this.compare();
  }

  onScrollUpClick() {
    const rect = this.getFirstChangeRectAboveScreen();
    if (!rect) {
      return;
    }

    const bottom = rect.bottom + 100;

    this.highlightChanges(this.getChangesInsidePreviousScreen(bottom));

    const doc = document.documentElement;
    window.scrollBy({
      behavior: "smooth",
      left: 0,
      top: bottom - doc.clientHeight,
    });
  }

  onScrollDownClick() {
    const rect = this.getFirstChangeRectBelowScreen();
    if (!rect) {
      return;
    }

    const top = rect.top - 100;

    this.highlightChanges(this.getChangesInsideNextScreen(top));

    window.scrollBy({
      behavior: "smooth",
      left: 0,
      top,
    });
  }

  getFirstChangeRectAboveScreen() {
    let prevRect = null;

    const changes = this.result.getElementsByClassName("htmldiff-change");
    for (const change of changes) {
      const rect = change.getBoundingClientRect();
      if (rect.top >= 0) {
        return prevRect;
      }
      prevRect = rect;
    }

    return prevRect;
  }

  getFirstChangeRectBelowScreen() {
    const doc = document.documentElement;
    const height = doc.clientHeight;

    const changes = this.result.getElementsByClassName("htmldiff-change");
    for (const change of changes) {
      const rect = change.getBoundingClientRect();
      if (rect.bottom > height) {
        return rect;
      }
    }

    return null;
  }

  getChangesInsidePreviousScreen(bottom) {
    const doc = document.documentElement;
    const height = doc.clientHeight;
    const result = [];

    const changes = this.result.getElementsByClassName("htmldiff-change");
    for (const change of changes) {
      const rect = change.getBoundingClientRect();
      if (rect.top >= bottom - height && rect.bottom <= bottom) {
        result.push(change);
      }
    }

    return result;
  }

  getChangesInsideNextScreen(top) {
    const doc = document.documentElement;
    const height = doc.clientHeight;
    const result = [];

    const changes = this.result.getElementsByClassName("htmldiff-change");
    for (const change of changes) {
      const rect = change.getBoundingClientRect();
      if (rect.top >= top && rect.bottom <= top + height) {
        result.push(change);
      }
    }
    return result;
  }

  highlightChanges(changes) {
    for (const change of changes) {
      change.classList.add("htmldiff-highllight");
    }
    setTimeout(() => {
      for (const change of changes) {
        change.classList.remove("htmldiff-highllight");
      }
    }, 500);
  }

  async onSearchKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    const query = this.searchField.value.trim();

    // First, check PR number
    {
      const m = query.match(/^#?(\d+)/);
      if (m) {
        const prnum = parseInt(m[1]);
        for (const pr of this.prs) {
          if (pr.number === prnum) {
            this.prFilter.value = prnum;
            await this.onPRFilterChange();
            return;
          }
        }
      }
    }

    if (query in this.revsAndPRsMap) {
      const value = this.revsAndPRsMap[query];
      await this.onSelectSearchList(value);
      return;
    }

    // Check all substring match
    for (const { label, value } of this.revsAndPRs) {
      if (label.includes(query)) {
        await this.onSelectSearchList(value);
        return;
      }
    }
  }

  async onSelectSearchList(value) {
    if (value.startsWith("#")) {
      this.prFilter.value = value.slice(1);
      await this.onPRFilterChange();
    } else {
      this.revFilter.value = value;
      await onRevFilterChange();
    }
  }

  async onSearchInput() {
    const query = this.searchField.value.trim();
    if (query in this.revsAndPRsMap) {
      const value = this.revsAndPRsMap[query];
      await this.onSelectSearchList(value);
    }
  }

  async onPopState() {
    if (window.location.search === this.currentQuery) {
      return;
    }
    this.currentQuery = window.location.search;

    await this.parseQuery();
  }
}

let comparator;

/* exported onBodyLoad */
function onBodyLoad() {
  comparator = new Comparator();
  comparator.run().catch(e => console.error(e));
}

/* exported onPRFilterChange */
function onPRFilterChange() {
  comparator.onPRFilterChange().catch(e => console.error(e));
}

/* exported onRevFilterChange */
function onRevFilterChange() {
  comparator.onRevFilterChange().catch(e => console.error(e));
}

/* exported onFromRevChange */
function onFromRevChange() {
  comparator.onFromRevChange().catch(e => console.error(e));
}

/* exported onToRevChange */
function onToRevChange() {
  comparator.onToRevChange().catch(e => console.error(e));
}

/* exported onSecListChange */
function onSecListChange() {
  comparator.onSecListChange().catch(e => console.error(e));
}

/* exported onTabChange */
function onTabChange() {
  comparator.onTabChange().catch(e => console.error(e));
}

/* exported onPathDiffChange */
function onPathDiffChange() {
  comparator.onPathDiffChange().catch(e => console.error(e));
}

/* exported onScrollUpClick */
function onScrollUpClick() {
  comparator.onScrollUpClick();
}

/* exported onScrollDownClick */
function onScrollDownClick() {
  comparator.onScrollDownClick();
}

/* exported onSearchKeyDown */
function onSearchKeyDown(e) {
  comparator.onSearchKeyDown(e).catch(e => console.error(e));
  return false;
}

/* exported onSearchInput */
function onSearchInput() {
  comparator.onSearchInput().catch(e => console.error(e));
}

window.addEventListener("popstate", () => {
  comparator.onPopState().catch(e => console.error(e));
});
