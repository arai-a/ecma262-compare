// Calculate diff between 2 HTML fragments, based on text+path based LCS.
//
// The HTML fragment shouldn't omit closing tag, if it's not empty tag.
 HTMLPathDiffWorker {
   run({ type, s1, s2 }) {
    (type === "diff") {
      this.diff(s1, s2);
    }
     (type === "splitForDiff") {
       this.splitForDiff(s1, s2);
    }
     "";
  }

  // Calculate diff between 2 HTML fragments.
   diff(s1, s2) {
     seq1 = this.toSeq(s1);
     seq2 = this.toSeq(s2);

     C = this.LCS(seq1, seq2);
     diff = this.LCSToDiff(seq1, seq2, C);
     seq = this.diffToSeq(diff);

     this.fromSeq(seq);
  }

  // Convert a HTML fragment into a sequence of text or empty tag, with
  // path information.
   toSeq(s) {
     seq = [];
     name_stack = [];
     sel_stack = [];
     tag_stack = [];
      (const t  this.tokenize(s)) {
       (t.type) {
         "o": {
          name_stack.push(t.name);
           (t.id) {
            sel_stack.push(t.name + "#" + t.id);
          } {
            sel_stack.push(t.name);
          }
          tag_stack.push(t.tag);
          ;
        }
         "c": {
          name_stack.pop();
          sel_stack.pop();
          tag_stack.pop();
          ;
        }
         "t": {
           text  t.text;
           path  sel_stack.join("/");

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
     seq;
  }

  // Tokenize HTML fragment into text, empty tag, opening tag, and closing tag.
   *tokenize(s) {
     emptyTags Set([
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

     i = 0;
     start = 0;
     prev = "";
     len = s.length;

     (i < len) {
       c = s.charAt(i);
       (c === "<") {
        (start !== i) {
           {
            text: s.slice(start, i),
            type: "t",
          };
        }

         re = /[^> \t\r\n]+/g;
        re.lastIndex = i + 1;
         result = re.exec(s);

         to = s.indexOf(">", i + 1);

         name = result[0];
         tag = s.slice(i, to + 1);

         (name.startsWith("/")) {
          // If the current element has no content,
          // Put empty text, so that `toSeq` creates empty text inside
          // this element..
          //
          // Otherwise `toSeq` won't create any info about this element.
          (prev === "o") {
             {
              text: "",
              type: "t",
            };
          }

           {
            ,
            tag,
            type: "c",
          };
          prev = "c";
        } (emptyTags.has(name)) {
          // Empty tag is treated as text.
          {
            text: tag,
            type: "t",
          };
          prev = "t";
        }  {
          // If there's opening tag immediately after closing tag,
          // put empty text, so that `toSeq` creates empty text at
          // parent node, between 2 elements
          // (one closed here, and one opened here).
          //
          // Otherwise `toSeq` will concatenate 2 elements if they're same.
           (prev === "c") {
             {
              text: "",
              type: "t",
            };
          }

           id = undefined;
           m = tag.match(` id="([^"]+)"`);
           (m) {
            id = m[1];
          }

           {
            id,
            name,
            tag,
            : "o",
          };
          prev = "o";
        }
        i = to + 1;
        start = i;
      }   (c.match(/[ \t\r\n]/)) {
         re = /[ \t\r\n]+/g;
        re.lastIndex = start;
         result = re.exec(s);
         {
          text: s.slice(start, i) + result[0],
          type: "t",
        };
        prev = "t";
        i += result[0].length;
        start = i;
      }  {
        i++;
      }
    }

     (start < len) {
       {
        text: s.slice(start),
        type: "t",
      };
    }
  }

  // Calculate the matrix for Longest Common Subsequence of 2 sequences.
   LCS(seq1, seq2) {
     len1 = seq1.length;
     len2 = seq2.length;
     C =  Array(len1 + 1);
     (let i = 0; i < len1 + 1; i++) {
      C[i] = Array(len2 + 1);
    }
     (let i = 0; i < len1 + 1; i++) {
      C[i][0] = 0;
    }
     (let j = 0; j < len2 + 1; j++) {
      C[0][j] = 0;
    }

     isDiff(s1, s2) {
      // Do not count the difference in attributes,h.
       s1.text !== s2.text || s1.path !== s2.path;
    }

    (let i = 1; i < len1 + 1; i++) {
       (let j = 1; j < len2 + 1; j++) {
         (!isDiff(seq1[i - 1], seq2[j - 1])) {
          C[i][j] = C[i-1][j-1] + 1;
        }  {
          C[i][j] = Math.max(C[i][j-1], C[i-1][j]);
        }
      }
    }

     C;
  }

  // Convert 2 sequences and the LCS matrix into a sequence of diff.
   LCSToDiff(seq1, seq2, C) {
     len1 = seq1.length;
     len2 = seq2.length;
     diff = [];

     (let i = len1, j = len2; i > 0 || j > 0;) {
       ((i > 0 && j > 0 && C[i][j] === C[i - 1][j - 1]) ||
          (j > 0 && C[i][j] === C[i][j - 1])) {
        diff.push({
          item: seq2[j - 1],
          op: "+",
        });
        j--;
      }  (i > 0 && C[i][j] === C[i - 1][j]) {
        diff.push({
          item: seq1[i - 1],
          op: "-",
        });
        i--;
      }  {
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

     diff;
  }

  // Convert a sequence of diff into a sequence of text or empty tag, with
  // path information.
   diffToSeq(diff) {
     seq = [];

     INS_NAME = `ins`;
     INS_TAG = `<ins class="htmldiff-ins htmldiff-change">`;
     DEL_NAME = `del`;
     DEL_TAG = `<del class="htmldiff-del htmldiff-change">`;

    (const d diff) {
       (d.op) {
         " ": {
          seq.push(d.item);
          ;
        }
        case "+":
        case "-": {
           new_name_stack = d.item.name_stack.slice();
           new_sel_stack = d.item.sel_stack.slice();
           new_tag_stack = d.item.tag_stack.slice();

          // FIXME: Instead of the leaf, put ins/del somewhere in the stack.
          //        https://github.com/arai-a/ecma262-compare/issues/13
          switch (d.op) {
             "+": {
              new_name_stack.push(INS_NAME);
              new_sel_stack.push(INS_NAME);
              new_tag_stack.push(INS_TAG);
              break;
            }
             "-": {
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
          ;
        }
      }
    }

     seq;
  }

  // Convert a sequence of text or empty tag, with path information into
  // HTML fragment.
   fromSeq(seq) {
     name_stack = [];
     sel_stack = [];
     tag_stack = [];

     ts = [];

     (const s of seq) {
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
       (; i < s.name_stack.length; i++) {
        name_stack.push(s.name_stack[i]);
        sel_stack.push(s.sel_stack[i]);
         tag = s.tag_stack[i];
        tag_stack.push(tag);
        ts.push(tag);
      }

      ts.push(s.text);
    }

    return ts.join("");
  }

  static splitForDiff(s1, s2) {
     seq1 = this.toSeq(s1);
     seq2 = this.toSeq(s2);

     C = this.LCS(seq1, seq2);
     diff = this.LCSToDiff(seq1, seq2, C);

    
    [splitSeq1, splitSeq2] = this.split(diff);
     [this.fromSeq(splitSeq1), this.fromSeq(splitSeq2)];
  }

   split(diff) {
     prevStackDepth1 = 0;
     prevStackDepth2 = 0;

     splitSeq1 = [];
     splitSeq2 = [];
     ( d of diff) {
      switch (d.op) {
        case " ": {
          splitSeq1.push(d.item);
          prevStackDepth1 = d.item.path.length;

          splitSeq2.push(d.item2);
          prevStackDepth2 = d.item.path.length;
          ;
        }
        case "-": {
          splitSeq1.push(d.item);
          prevStackDepth1 = d.item.path.length;

          (prevStackDepth2 > d.item.path.length) {
            splitSeq2.push({
              name_stack: d.item.name_stack,
              path: d.item.path,
              sel_stack: d.item.sel_stack,
              tag_stack: d.item.tag_stack,
              text: "",
            });
            prevStackDepth2 = d.item.path.length;
          }
          ;
        }
        case "+": {
          (prevStackDepth1 > d.item.path.length) {
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
          ;
        }
      }
    }

     [splitSeq1, splitSeq2];
  }
}

onmessage = msg => {
   id = msg.data.id;
   data = HTMLPathDiffWorker.run(msg.data.data);
  postMessage({
    data,
    id,
  });
};



