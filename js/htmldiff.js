"use strict";

const INS_NAME = `ins`;
const INS_TAG = `<ins class="htmldiff-add">`;
const DEL_NAME = `del`;
const DEL_TAG = `<del class="htmldiff-del">`;

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

function* tokenize(s) {
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
          yield {
            type: "t",
            text: tag,
          };
          prev = "t";
        } else {
          if (prev == "c") {
            yield {
              type: "t",
              text: "",
            };
          }

          yield {
            type: "o",
            name,
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

function toSeq(s) {
  const seq = [];
  const name_stack = [];
  const tag_stack = [];
  for (const t of tokenize(s)) {
    switch (t.type) {
      case "o": {
        name_stack.push(t.name);
        tag_stack.push(t.tag);
        break;
      }
      case "c": {
        name_stack.pop();
        tag_stack.pop();
        break;
      }
      case "t": {
        seq.push({
          name_stack: name_stack.slice(),
          name_path: name_stack.join("/"),
          tag_stack: tag_stack.slice(),
          text: t.text,
        });
      }
    }
  }
  return seq;
}

function fromSeq(seq) {
  const name_stack = [];
  const tag_stack = [];

  const ts = [];

  for (const s of seq) {
    let i = 0;
    for (; i < s.name_stack.length; i++) {
      if (s.name_stack[i] != name_stack[i]) {
        break;
      }
    }
    while (i < name_stack.length) {
      tag_stack.pop();
      const name = name_stack.pop();
      ts.push(`</${name}>`);
    }
    for (; i < s.name_stack.length; i++) {
      name_stack.push(s.name_stack[i]);
      const tag = s.tag_stack[i];
      tag_stack.push(tag);
      ts.push(tag);
    }
    ts.push(s.text);
  }

  return ts.join("");
}

function LCS(seq1, seq2) {
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
    return s1.text != s2.text || s1.name_path != s2.name_path;
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

  const diff = [];

  for (let i = len1, j = len2; i > 0 && j > 0;) {
    if (C[i][j] == C[i - 1][j - 1]) {
      diff.push({
        op: "+",
        item: seq2[j - 1],
      });
      j--;
    } else if (C[i][j] == C[i][j - 1]) {
      diff.push({
        op: "+",
        item: seq2[j - 1],
      });
      j--;
    } else if (C[i][j] == C[i - 1][j]) {
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

  const seq = [];

  let prev_name_stack = [];
  let prev_name_path = "";
  let prev_tag_stack = [];

  diff.reverse();
  for (const d of diff) {
    switch (d.op) {
      case ' ': {
        seq.push(d.item);
        break;
      }
      case '+':
      case '-': {
        const new_name_stack = [];
        const new_tag_stack = [];
        let i = 0;
        for (; i < d.item.name_stack.length; i++) {
          if (d.item.name_stack[i] == prev_name_stack[i]) {
            new_name_stack.push(d.item.name_stack[i]);
            new_tag_stack.push(d.item.tag_stack[i]);
          } else {
            break;
          }
        }
        for (; i < d.item.name_stack.length; i++) {
          new_name_stack.push(d.item.name_stack[i]);
          new_tag_stack.push(d.item.tag_stack[i]);
        }

        switch (d.op) {
          case '+': {
            new_name_stack.push(INS_NAME);
            new_tag_stack.push(INS_TAG);
            break;
          }
          case '-': {
            new_name_stack.push(DEL_NAME);
            new_tag_stack.push(DEL_TAG);
            break;
          }
        }

        seq.push({
          text: d.item.text,
          name_stack: new_name_stack,
          name_path: new_name_stack.join("/"),
          tag_stack: new_tag_stack,
        });
        break;
      }
    }
    prev_name_stack = d.item.name_stack;
    prev_name_path = d.item.name_path;
    prev_tag_stack = d.item.tag_stack;
  }

  return seq;
}

function htmldiff(s1, s2) {
  const seq1 = toSeq(s1);
  const seq2 = toSeq(s2);

  const seq = LCS(seq1, seq2);

  return fromSeq(seq);
}
