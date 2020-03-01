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

// Calculate diff between 2 HTML fragments, based on text+path based LCS.
//
// The HTML fragment shouldn't omit closing tag, if it's not empty tag.
class HTMLPathDiff {
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
    const sel_stack = [];
    const tag_stack = [];
    for (const t of this.tokenize(s)) {
      switch (t.type) {
        case "o": {
          name_stack.push(t.name);
          if (t.id) {
            sel_stack.push(t.name + "#" + t.id);
          } else {
            sel_stack.push(t.name);
          }
          tag_stack.push(t.tag);
          break;
        }
        case "c": {
          name_stack.pop();
          sel_stack.pop();
          tag_stack.pop();
          break;
        }
        case "t": {
          const text = t.text;
          const path = sel_stack.join("/");

          seq.push({
            name_stack: name_stack.slice(),
            path,
            sel_stack: sel_stack.slice(),
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
      if (c === "<") {
        if (start !== i) {
          yield {
            text: s.slice(start, i),
            type: "t",
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
          if (prev === "o") {
            yield {
              text: "",
              type: "t",
            };
          }

          yield {
            name,
            tag,
            type: "c",
          };
          prev = "c";
        } else if (emptyTags.has(name)) {
          // Empty tag is treated as text.
          yield {
            text: tag,
            type: "t",
          };
          prev = "t";
        } else {
          // If there's opening tag immediately after closing tag,
          // put empty text, so that `toSeq` creates empty text at
          // parent node, between 2 elements
          // (one closed here, and one opened here).
          //
          // Otherwise `toSeq` will concatenate 2 elements if they're same.
          if (prev === "c") {
            yield {
              text: "",
              type: "t",
            };
          }

          let id = undefined;
          const m = tag.match(` id="([^"]+)"`);
          if (m) {
            id = m[1];
          }

          yield {
            id,
            name,
            tag,
            type: "o",
          };
          prev = "o";
        }
        i = to + 1;
        start = i;
      } else if (c.match(/[ \t\r\n]/)) {
        const re = /[ \t\r\n]+/g;
        re.lastIndex = start;
        const result = re.exec(s);
        yield {
          text: s.slice(start, i) + result[0],
          type: "t",
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
        text: s.slice(start),
        type: "t",
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
      return s1.text !== s2.text || s1.path !== s2.path;
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
      if ((i > 0 && j > 0 && C[i][j] === C[i - 1][j - 1]) ||
          (j > 0 && C[i][j] === C[i][j - 1])) {
        diff.push({
          item: seq2[j - 1],
          op: "+",
        });
        j--;
      } else if (i > 0 && C[i][j] === C[i - 1][j]) {
        diff.push({
          item: seq1[i - 1],
          op: "-",
        });
        i--;
      } else {
        diff.push({
          item: seq1[i - 1],
          item2: seq2[j - 1],
          op: " ",
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
    const INS_TAG = `<ins class="htmldiff-add htmldiff-change">`;
    const DEL_NAME = `del`;
    const DEL_TAG = `<del class="htmldiff-del htmldiff-change">`;

    for (const d of diff) {
      switch (d.op) {
        case " ": {
          seq.push(d.item);
          break;
        }
        case "+":
        case "-": {
          const new_name_stack = d.item.name_stack.slice();
          const new_sel_stack = d.item.sel_stack.slice();
          const new_tag_stack = d.item.tag_stack.slice();

          // FIXME: Instead of the leaf, put ins/del somewhere in the stack.
          //        https://github.com/arai-a/ecma262-compare/issues/13
          switch (d.op) {
            case "+": {
              new_name_stack.push(INS_NAME);
              new_sel_stack.push(INS_NAME);
              new_tag_stack.push(INS_TAG);
              break;
            }
            case "-": {
              new_name_stack.push(DEL_NAME);
              new_sel_stack.push(DEL_NAME);
              new_tag_stack.push(DEL_TAG);
              break;
            }
          }

          seq.push({
            name_stack: new_name_stack,
            path: new_sel_stack.join("/"),
            sel_stack: new_sel_stack,
            tag_stack: new_tag_stack,
            text: d.item.text,
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
    const sel_stack = [];
    const tag_stack = [];

    const ts = [];

    for (const s of seq) {
      let i = 0;
      // Skip common ancestor.
      for (; i < s.sel_stack.length; i++) {
        if (s.sel_stack[i] !== sel_stack[i]) {
          break;
        }
      }

      // Close tags that are not part of current text.
      while (i < name_stack.length) {
        sel_stack.pop();
        tag_stack.pop();
        const name = name_stack.pop();
        ts.push(`</${name}>`);
      }

      // Open remaining tags that are ancestor of current text.
      for (; i < s.name_stack.length; i++) {
        name_stack.push(s.name_stack[i]);
        sel_stack.push(s.sel_stack[i]);
        const tag = s.tag_stack[i];
        tag_stack.push(tag);
        ts.push(tag);
      }

      ts.push(s.text);
    }

    return ts.join("");
  }

  static splitForDiff(s1, s2) {
    const seq1 = this.toSeq(s1);
    const seq2 = this.toSeq(s2);

    const C = this.LCS(seq1, seq2);
    const diff = this.LCSToDiff(seq1, seq2, C);

    const [splitSeq1, splitSeq2] = this.split(diff);
    return [this.fromSeq(splitSeq1), this.fromSeq(splitSeq2)];
  }

  static split(diff) {
    let prevStackDepth1 = 0;
    let prevStackDepth2 = 0;

    const splitSeq1 = [];
    const splitSeq2 = [];
    for (const d of diff) {
      switch (d.op) {
        case " ": {
          splitSeq1.push(d.item);
          prevStackDepth1 = d.item.path.length;

          splitSeq2.push(d.item2);
          prevStackDepth2 = d.item.path.length;
          break;
        }
        case "-": {
          splitSeq1.push(d.item);
          prevStackDepth1 = d.item.path.length;

          if (prevStackDepth2 > d.item.path.length) {
            splitSeq2.push({
              name_stack: d.item.name_stack,
              path: d.item.path,
              sel_stack: d.item.sel_stack,
              tag_stack: d.item.tag_stack,
              text: "",
            });
            prevStackDepth2 = d.item.path.length;
          }
          break;
        }
        case "+": {
          if (prevStackDepth1 > d.item.path.length) {
            splitSeq1.push({
              name_stack: d.item.name_stack,
              path: d.item.path,
              sel_stack: d.item.sel_stack,
              tag_stack: d.item.tag_stack,
              text: "",
            });
            prevStackDepth1 = d.item.path.length;
          }
          splitSeq2.push(d.item);
          prevStackDepth2 = d.item.path.length;
          break;
        }
      }
    }

    return [splitSeq1, splitSeq2];
  }
}

// Calculate diff between 2 DOM tree.
class HTMLTreeDiff {
  constructor() {
  }

  // Calculate diff between 2 DOM tree.
  diff(diffNode, node1, node2) {
    this.addNumbering("1-", node1);
    this.addNumbering("2-", node2);

    this.splitForDiff(node1, node2);

    this.LCSMapMap = new Map();

    this.removeUnnecessaryText(node1);
    this.removeUnnecessaryText(node2);

    this.splitTexts(node1);
    this.splitTexts(node2);

    this.LCS(node1, node2);

    this.LCSToDiff(diffNode, node1, node2);

    this.combineNodes(diffNode);

    this.swapInsDel(diffNode);

    this.removeNumbering(diffNode);
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
  splitForDiff(node1, node2) {
    const [html1, html2] = HTMLPathDiff.splitForDiff(
      node1.innerHTML, node2.innerHTML);
    node1.innerHTML = html1;
    node2.innerHTML = html2;
  }

  // Remove unnecessary whitespace texts that can confuse diff algorithm.
  //
  // Diff algorithm used here isn't good at finding diff in repeating
  // structure, such as list element, separated by same whitespaces.
  //
  // Remove such whitespaces between each `li`, to reduce the confusion.
  removeUnnecessaryText(node) {
    const textNodes = [];
    this.getTexts(node, textNodes);

    for (const textNode of textNodes) {
      if (/^[ \r\n\t]*$/.test(textNode.textContent)) {
        if (textNode.previousSibling) {
          if (textNode.previousSibling.nodeName.toLowerCase() === "li") {
            textNode.remove();
          }
        }
        if (textNode.nextSibling) {
          if (textNode.nextSibling.nodeName.toLowerCase() === "li") {
            textNode.remove();
          }
        }
      }
    }
  }

  // Split text nodes by whitespaces and punctuation, given that
  // diff is performed on the tree of nodes, and Text node is the
  // minimum unit.
  //
  // Whitespaces are appended to texts before it, instead of creating Text
  // node with whitespace alone.
  // This is necessary to avoid matching each whitespace in different sentence.
  splitTexts(node) {
    const textNodes = [];
    this.getTexts(node, textNodes);
    for (const textNode of textNodes) {
      let currentNode = textNode;
      while (true) {
        const spaceIndex = currentNode.textContent.search(/\s[^\s]/);
        const punctIndex = currentNode.textContent.search(/[.,:;?!\-_()[\]]/);
        if (spaceIndex === -1 && punctIndex === -1) {
          break;
        }

        if (punctIndex !== -1 && (spaceIndex === -1 || punctIndex < spaceIndex)) {
          if (punctIndex > 0) {
            currentNode = currentNode.splitText(punctIndex);
          }
          currentNode = currentNode.splitText(1);
        } else {
          currentNode = currentNode.splitText(spaceIndex + 1);
        }
      }
    }
  }

  // Get all Text nodes in `node`, into `textNodes` array.
  getTexts(node, textNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node);
      return;
    }

    for (const child of node.childNodes) {
      this.getTexts(child, textNodes);
    }
  }

  // Calculates LCS for 2 nodes, stores it into `this.LCSMapMap`, and returns
  // the score for those 2 nodes, in [0,1] range.
  //
  // 0 when node1 and node2 are completely different.
  // 1 when node1 and node2 are completely same.
  LCS(node1, node2) {
    if (node1.nodeName !== node2.nodeName) {
      return 0;
    }

    if (node1.id || node2.id) {
      if (node1.id !== node2.id) {
        return 0;
      }
    }

    if (node1.nodeType === Node.TEXT_NODE) {
      if (node1.textContent !== node2.textContent) {
        return 0;
      }
      return 1;
    }

    const len1 = node1.childNodes.length;
    const len2 = node2.childNodes.length;

    if (len1 === 0) {
      if (len2 === 0) {
        return 1;
      }
      return 0;
    }
    if (len2 === 0) {
      return 0;
    }

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

    if (this.LCSMapMap.has(node1)) {
      this.LCSMapMap.get(node1).set(node2, C);
    } else {
      const m = new Map();
      m.set(node2, C);
      this.LCSMapMap.set(node1, m);
    }

    for (let i = 1; i < len1 + 1; i++) {
      for (let j = 1; j < len2 + 1; j++) {
        const score = this.LCS(node1.childNodes[i - 1], node2.childNodes[j - 1]);
        C[i][j] = Math.max(C[i-1][j-1] + score, C[i][j-1], C[i-1][j]);
      }
    }

    const maxScore = Math.max(len1, len2);

    // NOTE: the best score is 1 and the worst score is 0.
    const score = C[len1][len2] / maxScore;
    const THRESHOLD = 0.2;
    // FIXME: The threshold should be dependent to the number of texts
    //        (issue #37)
    if (score < THRESHOLD) {
      return 0;
    }
    return score;
  }

  // Convert LCS maps into diff tree.
  LCSToDiff(parent, node1, node2) {
    if (node1.nodeName !== node2.nodeName) {
      this.prependChildIns(parent, node2.cloneNode(true));
      this.prependChildDel(parent, node1.cloneNode(true));
      return;
    }

    if (node1.id || node2.id) {
      if (node1.id !== node2.id) {
        this.prependChildIns(parent, node2.cloneNode(true));
        this.prependChildDel(parent, node1.cloneNode(true));
        return;
      }
    }

    if (node1.nodeType === Node.TEXT_NODE) {
      if (node1.textContent !== node2.textContent) {
        this.prependChildIns(parent, node2.cloneNode(true));
        this.prependChildDel(parent, node1.cloneNode(true));
        return;
      }

      this.prependChild(parent, node2.cloneNode(true));
      return;
    }

    const len1 = node1.childNodes.length;
    const len2 = node2.childNodes.length;

    if (len1 === 0) {
      if (len2 === 0) {
        this.prependChild(parent, node2.cloneNode(true));
        return;
      }
      this.prependChildIns(parent, node2.cloneNode(true));
      this.prependChildDel(parent, node1.cloneNode(true));
      return;
    }
    if (len2 === 0) {
      this.prependChildIns(parent, node2.cloneNode(true));
      this.prependChildDel(parent, node1.cloneNode(true));
      return;
    }

    const C = this.LCSMapMap.get(node1).get(node2);

    for (let i = len1, j = len2; i > 0 || j > 0;) {
      if ((i > 0 && j > 0 && C[i][j] === C[i - 1][j - 1]) ||
          (j > 0 && C[i][j] === C[i][j - 1])) {
        this.prependChildIns(parent, node2.childNodes[j - 1].cloneNode(true));
        j--;
      } else if (i > 0 && C[i][j] === C[i - 1][j]) {
        this.prependChildDel(parent, node1.childNodes[i - 1].cloneNode(true));
        i--;
      } else if (i > 0 && j > 0 && C[i][j] - C[i - 1][j - 1] < 1) {
        if (node2.childNodes[j - 1].nodeType === Node.TEXT_NODE) {
          this.prependChildIns(parent, node2.childNodes[j - 1].cloneNode(true));
          j--;
        } else {
          const box = node2.childNodes[j - 1].cloneNode(false);

          this.LCSToDiff(box, node1.childNodes[i - 1], node2.childNodes[j - 1]);

          this.prependChild(parent, box);
          i--;
          j--;
        }
      } else {
        this.prependChild(parent, node2.childNodes[j - 1].cloneNode(true));
        i--;
        j--;
      }
    }
  }

  // Prepend `node` to `parent`'s first child.
  prependChild(parent, node) {
    parent.insertBefore(node, parent.firstChild);
  }

  // Prepend `node` to `parent`'s first child, wrapping `node` with `ins`.
  prependChildIns(parent, node) {
    const name = node.nodeName.toLowerCase();
    if (name === "li") {
      const newNode = node.cloneNode(false);
      while (node.lastChild) {
        const child = node.lastChild;
        child.remove();
        this.prependChildIns(newNode, child);
      }
      this.prependChild(parent, newNode);
      return;
    }

    if (parent.firstChild &&
        parent.firstChild.nodeName.toLowerCase() === "ins") {
      this.prependChild(parent.firstChild, node);
    } else {
      this.prependChild(parent, this.toIns(node));
    }
  }

  // Prepend `node` to `parent`'s first child, wrapping `node` with `del`.
  prependChildDel(parent, node) {
    const name = node.nodeName.toLowerCase();
    if (name === "li") {
      const newNode = node.cloneNode(false);
      while (node.lastChild) {
        const child = node.lastChild;
        child.remove();
        this.prependChildDel(newNode, child);
      }
      this.prependChild(parent, newNode);
      return;
    }

    if (parent.firstChild &&
        parent.firstChild.nodeName.toLowerCase() === "del") {
      this.prependChild(parent.firstChild, node);
    } else {
      this.prependChild(parent, this.toDel(node));
    }
  }

  toIns(node) {
    const ins = this.createIns();
    ins.appendChild(node);
    return ins;
  }

  createIns() {
    const ins = document.createElement("ins");
    ins.classList.add("htmldiff-add");
    ins.classList.add("htmldiff-change");
    return ins;
  }

  toDel(node) {
    const del = this.createDel();
    del.appendChild(node);
    return del;
  }

  createDel() {
    const del = document.createElement("del");
    del.classList.add("htmldiff-del");
    del.classList.add("htmldiff-change");
    return del;
  }

  // Combine adjacent nodes with same ID ("tree-diff-num" attribute) into one
  //
  // See `splitForDiff` for more details.
  combineNodes(node) {
    const removedNodes = new Set();

    for (const child of [...node.getElementsByTagName("*")]) {
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
    for (const child of [...node.getElementsByClassName("htmldiff-add")]) {
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
    this.treeDiff = document.getElementById("tree-diff");
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

    const maxTitleLength = 80;

    for (const pr of this.prs) {
      const opt = document.createElement("option");
      opt.value = pr.number;
      let title = pr.title;
      if (title.length > maxTitleLength) {
        title = title.slice(0, maxTitleLength - 1) + "\u2026";
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

    for (const rev of this.revs) {
      const parent = this.getFirstParent(rev);
      if (!(parent in this.revMap)) {
        continue;
      }

      const opt = document.createElement("option");
      opt.value = rev.hash;
      opt.textContent = `${rev.hash} (${DateUtils.toReadable(rev.date)})`;
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
      this.updateUI({
        type: "rev",
        rev: queryParams.rev,
        section,
      });
    } else if ("pr" in queryParams) {
      this.updateUI({
        type: "pr",
        pr: queryParams.pr,
        section,
      });
    } else if ("from" in queryParams && "to" in queryParams) {
      this.updateUI({
        type: "from-to",
        from: queryParams.from,
        to: queryParams.to,
        section,
      });
    } else {
      this.updateUI({
        type: "from-to",
      });
    }
  }

  async updateUI(params) {
    if (params.type === "rev") {
      const hash = params.rev;
      if (hash in this.revMap) {
        this.revFilter.value = hash;
        this.selectFromToForRev(hash);
      }

      this.prFilter.value = "-";
    } else if (params.type === "pr") {
      const prnum = params.pr;
      if (prnum in this.prMap) {
        this.prFilter.value = prnum;
        this.selectFromToForPR(prnum);
        this.updatePRLink(prnum);
      }

      this.revFilter.value = "-";
    } else if (params.type === "from-to") {
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

  async filterSectionList() {
    const count = this.populateMenu(this.secList, this.secOpts, opt => {
      if (opt.className === "same") {
        return false;
      }

      return true;
    }) - 1;

    if (count === 0) {
      this.secHit.textContent = `No difference (changes in markup or something)`;
    } else if (count === 1) {
      this.secHit.textContent = `${count} section found`;
    } else {
      this.secHit.textContent = `${count} sections found`;
    }
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
      params.push(`from=${this.hashOf("from")}`);
      params.push(`to=${this.hashOf("to")}`);
      if (id !== "combined") {
        params.push(`id=${encodeURIComponent(id)}`);
      }
    }

    const query = `?${params.join("&")}`;
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

      const add = this.result.getElementsByClassName("htmldiff-add").length;
      const del = this.result.getElementsByClassName("htmldiff-del").length;

      let note = "";
      if (add === 0 && del === 0 && differ) {
        note = " (changes in markup or something)";
      }

      if (add === 0 && del === 0) {
        this.scroller.style.display = "none";
      } else {
        this.scroller.style.display = "block";
      }

      this.diffStat.textContent = `+${add} -${del}${note}`;
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
    for (const [id, HTML] of sections) {
      if (len > 1) {
        i++;
        if (i % 7 === 0) {
          this.diffStat.textContent = `generating sections... ${i}/${len}`;
          await new Promise(r => setTimeout(r, 1));

          if (this.abortProcessing) {
            break;
          }
        }
      }

      if (type === "diff") {
        const workBox = document.createElement("div");
        this.workBoxContainer.appendChild(workBox);

        this.createDiff(workBox, HTML[0], HTML[1]);

        workBox.remove();

        const box = document.getElementById(`excluded-${id}`);
        if (box) {
          box.id = "";
          box.replaceWith(workBox);
        } else {
          this.result.appendChild(workBox);
        }
      } else {
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
    }

    if (!this.abortProcessing) {
      await this.fixupLink(type);
    }

    this.diffStat.textContent = "";

    this.processing = false;
  }

  createDiff(box, fromHTML, toHTML) {
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

    if (fromHTML !== null && toHTML !== null) {
      if (this.treeDiff.checked) {
        new HTMLTreeDiff().diff(box, workBoxFrom, workBoxTo);
      } else {
        fromHTML = workBoxFrom.innerHTML;
        toHTML = workBoxTo.innerHTML;

        box.innerHTML = HTMLPathDiff.diff(fromHTML, toHTML);
      }
    } else if (fromHTML !== null) {
      box.innerHTML = fromHTML;
    } else if (toHTML !== null) {
      box.innerHTML = toHTML;
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

    let i = 0;
    const len = links.length;

    for (const link of links) {
      if (len > 1) {
        i++;
        if (i % 97 === 0) {
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
      if (type === "from") {
        link.href = `${fromRenderedPage}${href}`;
      } else if (type === "to") {
        link.href = `${toRenderedPage}${href}`;
      } else {
        link.href = `${toRenderedPage}${href}`;
      }
    }
  }

  async onPRFilterChange() {
    this.updateUI({
      type: "pr",
      pr: this.prFilter.value,
    });
  }

  async onRevFilterChange() {
    this.updateUI({
      type: "rev",
      rev: this.revFilter.value,
    });
  }

  async onFromRevChange() {
    this.updateUI({
      type: "from-to",
      rev: this.revFilter.value,
    });
  }

  async onToRevChange() {
    this.updateUI({
      type: "from-to",
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

  async onTreeDiffChange() {
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

/* exported onTreeDiffChange */
function onTreeDiffChange() {
  comparator.onTreeDiffChange().catch(e => console.error(e));
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
