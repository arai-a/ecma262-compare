"use strict";

const REPO_URL = "https://github.com/tc39/ecma262";

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

// Calculate diff between 2 HTML fragments.
//
// The HTML fragment shouldn't omit closing tag, if it's not empty tag.
class HTMLDiff {
  // Calculate diff between 2 HTML fragments.
  static diff(s1, s2) {
    const seq1 = this.toSeq(s1);
    const seq2 = this.toSeq(s2);

    const C = this.LCS(seq1, seq2);
    const diff = this.LCSToDiff(seq1, seq2, C);
    const seq = this.diffToSeq(diff);

    return this.fromSeq(seq);
  }

  // Convert a HTML fragment into a sequence of text or empty tag, with
  // path information.
  static toSeq(s) {
    const seq = [];
    const name_stack = [];
    const name_id_stack = [];
    const tag_stack = [];
    for (const t of this.tokenize(s)) {
      switch (t.type) {
        case "o": {
          name_stack.push(t.name);
          if (t.id) {
            name_id_stack.push(t.name + "#" + t.id);
          } else {
            name_id_stack.push(t.name);
          }
          tag_stack.push(t.tag);
          break;
        }
        case "c": {
          name_stack.pop();
          name_id_stack.pop();
          tag_stack.pop();
          break;
        }
        case "t": {
          let text = t.text;
          const path = name_id_stack.join("/");

          seq.push({
            name_stack: name_stack.slice(),
            name_id_stack: name_id_stack.slice(),
            path,
            tag_stack: tag_stack.slice(),
            text,
          });
        }
      }
    }
    return seq;
  }

  // Tokenize HTML fragment into text, empty tag, opening tag, and closing tag.
  static *tokenize(s) {
    const emptyTags = new Set([
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ]);

    let i = 0;
    let start = 0;
    let prev = "";
    const len = s.length;

    while (i < len) {
      const c = s.charAt(i);
      if (c == "<") {
        if (start != i) {
          yield {
            type: "t",
            text: s.slice(start, i),
          };
        }

        const re = /[^> \t\r\n]+/g;
        re.lastIndex = i + 1;
        const result = re.exec(s);

        const to = s.indexOf(">", i + 1);

        const name = result[0];
        const tag = s.slice(i, to + 1);

        if (name.startsWith("/")) {
          // If the current element has no content,
          // Put empty text, so that `toSeq` creates empty text inside
          // this element..
          //
          // Otherwise `toSeq` won't create any info about this element.
          if (prev == "o") {
            yield {
              type: "t",
              text: "",
            };
          }

          yield {
            type: "c",
            name,
            tag,
          };
          prev = "c";
        } else {
          if (emptyTags.has(name)) {
            // Empty tag is treated as text.
            yield {
              type: "t",
              text: tag,
            };
            prev = "t";
          } else {
            // If there's opening tag immediately after closing tag,
            // put empty text, so that `toSeq` creates empty text at
            // parent node, between 2 elements
            // (one closed here, and one opened here).
            //
            // Otherwise `toSeq` will concatenate 2 elements if they're same.
            if (prev == "c") {
              yield {
                type: "t",
                text: "",
              };
            }

            let id = undefined;
            const m = tag.match(' id="([^"]+)"');
            if (m) {
              id = m[1];
            }

            yield {
              type: "o",
              name,
              id,
              tag,
            };
            prev = "o";
          }
        }
        i = to + 1;
        start = i;
      } else if (c.match(/[ \t\r\n]/)) {
        const re = /[ \t\r\n]+/g;
        re.lastIndex = start;
        const result = re.exec(s);
        yield {
          type: "t",
          text: s.slice(start, i) + result[0],
        };
        prev = "t";
        i += result[0].length;
        start = i;
      } else {
        i++;
      }
    }

    if (start < len) {
      yield {
        type: "t",
        text: s.slice(start),
      };
    }
  }

  // Calculate the matrix for Longest Common Subsequence of 2 sequences.
  static LCS(seq1, seq2) {
    const len1 = seq1.length;
    const len2 = seq2.length;
    const C = new Array(len1 + 1);
    for (let i = 0; i < len1 + 1; i++) {
      C[i] = new Array(len2 + 1);
    }
    for (let i = 0; i < len1 + 1; i++) {
      C[i][0] = 0;
    }
    for (let j = 0; j < len2 + 1; j++) {
      C[0][j] = 0;
    }

    function isDiff(s1, s2) {
      // Do not count the difference in attributes,h.
      return s1.text != s2.text || s1.path != s2.path;
    }

    for (let i = 1; i < len1 + 1; i++) {
      for (let j = 1; j < len2 + 1; j++) {
        if (!isDiff(seq1[i - 1], seq2[j - 1])) {
          C[i][j] = C[i-1][j-1] + 1;
        } else {
          C[i][j] = Math.max(C[i][j-1], C[i-1][j]);
        }
      }
    }

    return C;
  }

  // Convert 2 sequences and the LCS matrix into a sequence of diff.
  static LCSToDiff(seq1, seq2, C) {
    const len1 = seq1.length;
    const len2 = seq2.length;
    const diff = [];

    for (let i = len1, j = len2; i > 0 || j > 0;) {
      if (i > 0 && j > 0 && C[i][j] == C[i - 1][j - 1]) {
        diff.push({
          op: "+",
          item: seq2[j - 1],
        });
        j--;
      } else if (j > 0 && C[i][j] == C[i][j - 1]) {
        diff.push({
          op: "+",
          item: seq2[j - 1],
        });
        j--;
      } else if (i > 0 && C[i][j] == C[i - 1][j]) {
        diff.push({
          op: "-",
          item: seq1[i - 1],
        });
        i--;
      } else {
        diff.push({
          op: " ",
          item: seq1[i - 1],
        });
        i--;
        j--;
      }
    }

    diff.reverse();

    return diff;
  }

  // Convert a sequence of diff into a sequence of text or empty tag, with
  // path information.
  static diffToSeq(diff) {
    const seq = [];

    const INS_NAME = `ins`;
    const INS_TAG = `<ins class="htmldiff-add">`;
    const DEL_NAME = `del`;
    const DEL_TAG = `<del class="htmldiff-del">`;

    for (const d of diff) {
      switch (d.op) {
        case ' ': {
          seq.push(d.item);
          break;
        }
        case '+':
        case '-': {
          const new_name_stack = d.item.name_stack.slice();
          const new_name_id_stack = d.item.name_id_stack.slice();
          const new_tag_stack = d.item.tag_stack.slice();

          // FIXME: Instead of the leaf, put ins/del somewhere in the stack.
          //        https://github.com/arai-a/ecma262-compare/issues/13
          switch (d.op) {
            case '+': {
              new_name_stack.push(INS_NAME);
              new_name_id_stack.push(INS_NAME);
              new_tag_stack.push(INS_TAG);
              break;
            }
            case '-': {
              new_name_stack.push(DEL_NAME);
              new_name_id_stack.push(DEL_NAME);
              new_tag_stack.push(DEL_TAG);
              break;
            }
          }

          seq.push({
            text: d.item.text,
            name_stack: new_name_stack,
            name_id_stack: new_name_id_stack,
            path: new_name_id_stack.join("/"),
            tag_stack: new_tag_stack,
          });
          break;
        }
      }
    }

    return seq;
  }

  // Convert a sequence of text or empty tag, with path information into
  // HTML fragment.
  static fromSeq(seq) {
    const name_stack = [];
    const name_id_stack = [];
    const tag_stack = [];

    const ts = [];

    for (const s of seq) {
      let i = 0;
      // Skip common ancestor.
      for (; i < s.name_id_stack.length; i++) {
        if (s.name_id_stack[i] != name_id_stack[i]) {
          break;
        }
      }

      // Close tags that are not part of current text.
      while (i < name_stack.length) {
        name_id_stack.pop();
        tag_stack.pop();
        const name = name_stack.pop();
        ts.push(`</${name}>`);
      }

      // Open remaining tags that are ancestor of current text.
      for (; i < s.name_stack.length; i++) {
        name_stack.push(s.name_stack[i]);
        name_id_stack.push(s.name_id_stack[i]);
        const tag = s.tag_stack[i];
        tag_stack.push(tag);
        ts.push(tag);
      }

      ts.push(s.text);
    }

    return ts.join("");
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
    // `option` elements for "from" revisions.
    this.fromOpts = [];

    // `option` elements for "to" revisions.
    this.toOpts = [];

    // `option` elements for sections.
    this.secOpts = [];

    // The `sections.json` data for the currently selected "from" revision.
    this.fromSecData = {};

    // The `sections.json` data for the currently selected "to" revision.
    this.toSecData = {};

    // `True` if diff calculation is ongoing.
    this.processing = false;

    // Set to `True` to tell the currently ongoing diff calculation to abort.
    this.abortProcessing = false;

    this.prFilter = document.getElementById("pr-filter");
    this.fromRev = document.getElementById("from-rev");
    this.toRev = document.getElementById("to-rev");
    this.secList = document.getElementById("sec-list");
    this.prLink = document.getElementById("pr-link");
    this.fromLink = document.getElementById("from-history-link");
    this.toLink = document.getElementById("to-history-link");
    this.result = document.getElementById("result");
    this.diffStat = document.getElementById("diff-stat");
    this.searchHit = document.getElementById("search-hit");
    this.viewDiff = document.getElementById("view-diff");
    this.viewFrom = document.getElementById("view-from");
    this.viewTo = document.getElementById("view-to");
    this.viewFromTab = document.getElementById("view-from-tab");
    this.viewToTab = document.getElementById("view-to-tab");
    this.viewDiffTab = document.getElementById("view-diff-tab");
    this.workBox = document.getElementById("work-box");

    this.currentHash = "";
  }

  async run() {
    await this.loadResources();

    this.populateLists();
    await this.parseQuery();
    this.updateHistoryLink();
    this.updateRevInfo();
    this.updateURL();
  }

  async loadResources() {
    [this.revs, this.prs] = await Promise.all([
      this.getJSON("./history/revs.json"),
      this.getJSON("./history/prs.json?20200216a"),
    ]);

    this.revMap = {};
    for (const rev of this.revs) {
      this.revMap[rev.hash] = rev;
    }

    this.prnums = Object.keys(this.prs)
      .map(prnum => parseInt(prnum, 10))
      .sort((a, b) => b - a);

    for (const prnum in this.prs) {
      const pr = this.prs[prnum];
      pr.parent = pr.revs[pr.revs.length-1].parents.split(' ')[0];
    }
  }

  async getJSON(path) {
    const response = await fetch(path);
    return response.json();
  }

  populateLists() {
    this.populatePRs(this.prFilter);
    this.populateRevs(this.fromRev, this.fromOpts);
    this.populateRevs(this.toRev, this.toOpts);
  }

  populatePRs(menu) {
    while (menu.firstChild) {
      menu.firstChild.remove();
    }

    const opt = document.createElement("option");
    opt.value = "-";
    opt.textContent = "-";
    menu.appendChild(opt);

    const maxTitleLength = 80;

    for (const prnum of this.prnums) {
      const pr = this.prs[prnum];
      const opt = document.createElement("option");
      opt.value = prnum;
      let title = pr.title;
      if (title.length > maxTitleLength) {
        title = title.slice(0, maxTitleLength - 1) + "\u2026";
      }
      opt.textContent = `#${prnum}: ${title} (by ${pr.login})`;
      menu.appendChild(opt);
    }

    menu.value = "-";
  }

  populateRevs(menu, opts) {
    while (menu.firstChild) {
      menu.firstChild.remove();
    }

    for (const { date, hash } of this.revs) {
      const opt = document.createElement("option");
      opt.value = hash;
      opt.textContent = `${hash} (${DateUtils.toReadable(date)})`;
      opts.push(opt);
    }

    for (let prnum of this.prnums) {
      let pr = this.prs[prnum];

      let opt = document.createElement("option");
      opt.value = this.prToOptValue(prnum, pr);
      opt.textContent = `${pr.head} (PR ${prnum} by ${pr.login})`;
      opts.push(opt);
    }

    this.populateMenu(menu, opts, () => true);
  }

  prToOptValue(prnum, pr) {
    return `PR/${prnum}/${pr.head}`;
  }

  populateMenu(menu, opts, filter) {
    while (menu.firstChild) {
      menu.firstChild.remove();
    }

    let value = "";
    let count = 0;
    for (const opt of opts) {
      if (!filter(opt)) {
        continue;
      }

      if (!value) {
        value = opt.value;
      }
      menu.appendChild(opt);
      opt.disabled = false;
      count++;
    }

    menu.value = value;
    return count;
  }

  async parseQuery() {
    const query = window.location.hash.slice(1);
    const items = query.split("&");
    const queryParams = {};
    for (const item of items) {
      const [name, value] = item.split("=");
      try {
        queryParams[name] = decodeURIComponent(value);
      } catch (e) {
      }
    }

    if ("from" in queryParams && "to" in queryParams) {
      const from = queryParams.from;
      const to = queryParams.to;

      if (from in this.revMap) {
        this.fromRev.value = from;
      }
      if (to in this.revMap) {
        this.toRev.value = to;
      }
    } else if ("pr" in queryParams) {
      const prnum = queryParams.pr;
      if (prnum in this.prs) {
        const pr = this.prs[prnum];

        this.fromRev.value = pr.parent;
        this.toRev.value = pr.head;

        this.prFilter.value = prnum;
        this.selectPRRevs(prnum);
        this.updatePRLink(prnum);
      }
    }

    this.updateHistoryLink();
    this.updateRevInfo();

    await this.updateSectionList();

    if ("id" in queryParams) {
      const id = queryParams.id;
      this.secList.value = id;
    }

    await this.compare();
  }

  selectPRRevs(prnum) {
    if (prnum in this.prs) {
      const pr = this.prs[prnum];
      this.fromRev.value = pr.parent;
      this.toRev.value = this.prToOptValue(prnum, pr);
    }
  }

  updatePRLink(prnum) {
    if (prnum in this.prs) {
      const pr = this.prs[prnum];
      this.prLink.href = `${REPO_URL}/pull/${prnum}`;
      this.prLink.textContent = `Open PR ${prnum}`;
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
      const hash = m[2];
      const pr = this.prs[prnum];

      subjectLink.textContent = pr.revs[0].subject;
      subjectLink.href = `${REPO_URL}/pull/${prnum}`;
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

    this.searchHit.textContent = "";

    while (this.secList.firstChild) {
      this.secList.firstChild.remove();
    }

    const fromSecSet = new Set(this.fromSecData.secList);
    const toSecSet = new Set(this.toSecData.secList);
    const secSet = new Set(this.fromSecData.secList.concat(this.toSecData.secList));

    this.secOpts = [];

    const opt = document.createElement("option");
    opt.value = "combined";
    opt.textContent = "Combined view";
    this.secOpts.push(opt);

    for (const secId of Array.from(secSet).sort((a, b) => {
      const aTitle = this.getComparableTitle(a);
      const bTitle = this.getComparableTitle(b);
      if (aTitle === bTitle) {
        return 0;
      }
      return aTitle < bTitle ? -1 : 1;
    })) {
      const opt = document.createElement("option");
      opt.value = secId;

      let stat = "same";
      let mark = "\u00A0\u00A0";

      if (fromSecSet.has(secId)) {
        if (toSecSet.has(secId)) {
          if (this.isChanged(secId)) {
            stat = "mod";
            mark = "-+";
          }
        } else {
          stat = "del";
          mark = "-\u00A0";
        }
      } else {
        stat = "add";
        mark = "+\u00A0";
      }

      const title = this.getSectionTitle(secId);

      if (title) {
        opt.textContent = `${mark} ${title.slice(0, 100)}`;
      } else {
        opt.textContent = `${mark} ${secId}`;
      }
      opt.className = stat;

      this.secOpts.push(opt);
    }

    await this.filterSectionList();
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
      return `${this.fromSecData.secData[secId].num} ${this.fromSecData.secData[secId].title}`;
    }

    if (secId in this.toSecData.secData) {
      return `${this.toSecData.secData[secId].num} ${this.toSecData.secData[secId].title}`;
    }

    return "";
  }

  // Returns whether the section is changed, added, or removed between from/to
  // revisions.
  isChanged(secId) {
    if (!(secId in this.fromSecData.secData) || !(secId in this.toSecData.secData)) {
      return true;
    }

    const fromHTML = this.fromSecData.secData[secId].html;
    const toHTML = this.toSecData.secData[secId].html;

    return this.filterAttributeForComparison(fromHTML) !== this.filterAttributeForComparison(toHTML);
  }

  // Filter attributes that should be ignored when comparing 2 revisions.
  filterAttributeForComparison(s) {
    return s
      .replace(/ aoid="[^\"]+"/g, "")
      .replace(/ href="[^\"]+"/g, "");
  }

  async filterSectionList() {
    const count = this.populateMenu(this.secList, this.secOpts, opt => {
      if (opt.className === "same") {
        return false;
      }

      return true;
    });

    this.searchHit.textContent = `${count - 1} section(s) found`;
  }

  updateURL() {
    const id = this.secList.value;

    const params = [];
    const prnum = this.prFilter.value;
    if (prnum !== "-") {
      params.push(`pr=${prnum}`);
      if (id != "combined") {
        params.push(`id=${encodeURIComponent(id)}`);
      }
    } else {
      params.push(`from=${this.hashOf("from")}`);
      params.push(`to=${this.hashOf("to")}`);
      params.push(`id=${encodeURIComponent(id)}`);
    }

    this.currentHash = `#${params.join("&")}`;
    window.location.hash = this.currentHash;
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

      const add = this.result.getElementsByClassName("htmldiff-add").length;
      const del = this.result.getElementsByClassName("htmldiff-del").length;

      let note = "";
      if (add === 0 && del === 0 && differ) {
        note = " (changes in markup or something)";
      }

      this.diffStat.textContent = `+${add} -${del}${note}`;
    } else {
      this.result.classList.remove("diff-view");

      if (this.viewFrom.checked) {
        this.viewFromTab.classList.add("selected");
        this.viewToTab.classList.remove("selected");
        this.viewDiffTab.classList.remove("selected");

        const sections = new Map();
        for (const [id, fromHTML, toHTML] of secList) {
          sections.set(id, fromHTML);
        }

        await this.combineSections(sections, "from");
      } else if (this.viewTo.checked) {
        this.viewFromTab.classList.remove("selected");
        this.viewToTab.classList.add("selected");
        this.viewDiffTab.classList.remove("selected");

        const sections = new Map();
        for (const [id, fromHTML, toHTML] of secList) {
          sections.set(id, toHTML);
        }

        await this.combineSections(sections, "to");
      } else {
        this.result.textContent = "";
      }

      this.diffStat.textContent = "";
    }
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
        await new Promise(r => setTimeout(r, 100));
      } while (this.processing);
      this.abortProcessing = false;
    }

    this.processing = true;

    let i = 0;
    const len = sections.size;

    this.result.textContent = "";
    for (let [id, HTML] of sections) {
      if (len > 1) {
        i++;
        if (i % 7 == 0) {
          this.diffStat.textContent = `generating sections... ${i}/${len}`;
          await new Promise(r => setTimeout(r, 1));

          if (this.abortProcessing) {
            break;
          }
        }
      }

      if (type == "diff") {
        HTML = this.createDiff(HTML[0], HTML[1]);
      }

      const box = document.getElementById(`excluded-${id}`);
      if (box) {
        box.id = "";
        box.innerHTML = HTML;
      } else {
        const box = document.createElement("div");
        box.innerHTML = HTML;
        this.result.appendChild(box);
      }
    }

    if (!this.abortProcessing) {
      await this.fixupLink(type);
    }

    this.diffStat.textContent = "";

    this.processing = false;
  }

  createDiff(fromHTML, toHTML) {
    const diffMode = fromHTML !== null && toHTML !== null;

    if (fromHTML !== null) {
      this.workBox.innerHTML = fromHTML;
      ListMarkUtils.textify(this.workBox);
      this.removeExcludedContent();
      fromHTML = this.workBox.innerHTML;
    }

    if (toHTML !== null) {
      this.workBox.innerHTML = toHTML;
      ListMarkUtils.textify(this.workBox);
      this.removeExcludedContent();
      toHTML = this.workBox.innerHTML;
    }

    if (diffMode) {
      return HTMLDiff.diff(fromHTML, toHTML);
    }
    if (fromHTML !== null) {
      return HTMLDiff.diff(fromHTML, "");
    }
    if (toHTML !== null) {
      return HTMLDiff.diff("", toHTML);
    }
    return "";
  }

  removeExcludedContent() {
    for (const div of [...this.workBox.getElementsByTagName("div")]) {
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

    let i = 0;
    const len = links.length;

    for (const link of links) {
      if (len > 1) {
        i++;
        if (i % 97 == 0) {
          this.diffStat.textContent = `fixing links up... ${i}/${len}`;
          await new Promise(r => setTimeout(r, 1));

          if (this.abortProcessing) {
            break;
          }
        }
      }

      if (!link.hasAttribute("href")) {
        continue;
      }
      const href = link.getAttribute("href");
      if (!href.startsWith("#")) {
        continue;
      }
      if (type == "from") {
        link.href = `${fromRenderedPage}${href}`;
      } else if (type == "to") {
        link.href = `${toRenderedPage}${href}`;
      } else {
        link.href = `${toRenderedPage}${href}`;
      }
    }
  }

  async onPRFilterChange() {
    const prnum = this.prFilter.value;
    this.selectPRRevs(prnum);
    this.updatePRLink(prnum);
    this.updateHistoryLink();
    this.updateRevInfo();
    await this.updateSectionList();
    await this.compare();
    this.updateURL();
  }

  async onFromRevChange() {
    this.updateHistoryLink();
    this.updateRevInfo();
    await this.updateSectionList();
    await this.compare();
    this.updateURL();
  }

  async onToRevChange() {
    this.updateHistoryLink();
    this.updateRevInfo();
    await this.updateSectionList();
    await this.compare();
    this.updateURL();
  }

  async onSecListChange() {
    await this.compare();
    this.updateURL();
  }

  async onTabChange() {
    await this.compare();
  }

  async onHashChange() {
    if (window.location.hash == this.currentHash) {
      return;
    }

    await this.parseQuery();
    this.updateHistoryLink();
    this.updateRevInfo();
    this.updateURL();
  }
}

let comparator;

function bodyOnLoad() {
  comparator = new Comparator();
  comparator.run().catch(e => console.error(e));
}

function onPRFilterChange() {
  comparator.onPRFilterChange().catch(e => console.error(e));
}

function onFromRevChange() {
  comparator.onFromRevChange().catch(e => console.error(e));
}

function onToRevChange() {
  comparator.onToRevChange().catch(e => console.error(e));
}

function onSecListChange() {
  comparator.onSecListChange().catch(e => console.error(e));
}

function onTabChange() {
  comparator.onTabChange().catch(e => console.error(e));
}

window.addEventListener("hashchange", () => {
  comparator.onHashChange().catch(e => console.error(e));
});
