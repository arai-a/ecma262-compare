class HTMLTreeDiffWorker {
  constructor() {
    this.LCSMapMap = new Map();
    this.depth = 0;
  }

  run({ nodeObj1, nodeObj2 }) {
    const diffNodeObj = this.createPlainObject("div");
    this.LCS(nodeObj1, nodeObj2);
    this.LCSToDiff(diffNodeObj, nodeObj1, nodeObj2);
    return diffNodeObj;
  }

  // Calculates LCS for 2 nodes, stores it into `this.LCSMapMap`, and returns
  // an object that represents how much they are different.
  LCS(nodeObj1, nodeObj2) {
    if (typeof nodeObj1 !== typeof nodeObj2) {
      if (typeof nodeObj1 === "object") {
        return {
          del: nodeObj1.textLength,
          ins: this.compressSpaces(nodeObj2).length,
          same: 0,
          state: "diff",
          stateCount: 1,
        };
      }
      return {
        del: this.compressSpaces(nodeObj1).length,
        ins: nodeObj2.textLength,
        same: 0,
        state: "diff",
        stateCount: 1,
      };
    }

    if (typeof nodeObj1 === "string") {
      if (nodeObj1 !== nodeObj2) {
        return {
          del: this.compressSpaces(nodeObj1).length,
          ins: this.compressSpaces(nodeObj2).length,
          same: 0,
          state: "diff",
          stateCount: 1,
        };
      }
      return {
        del: 0,
        ins: 0,
        same: this.compressSpaces(nodeObj2).length,
        state: "same",
        stateCount: 1,
      };
    }

    if (nodeObj1.name !== nodeObj2.name) {
      return {
        del: nodeObj1.textLength,
        ins: nodeObj2.textLength,
        same: 0,
        state: "diff",
        stateCount: 1,
      };
    }

    if (nodeObj1.id !== nodeObj2.id) {
      return {
        del: nodeObj1.textLength,
        ins: nodeObj2.textLength,
        same: 0,
        state: "diff",
        stateCount: 1,
      };
    }

    const len1 = nodeObj1.childNodes.length;
    const len2 = nodeObj2.childNodes.length;

    if (len1 === 0) {
      if (len2 === 0) {
        return {
          del: 0,
          ins: 0,
          same: 1,
          state: "same",
          stateCount: 1,
        };
      }
      return {
        del: 1,
        ins: 1,
        same: 0,
        state: "diff",
        stateCount: 1,
      };
    }
    if (len2 === 0) {
      return {
        del: 1,
        ins: 1,
        same: 0,
        state: "diff",
        stateCount: 1,
      };
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

    const D = new Array(len1 + 1);
    for (let i = 0; i < len1 + 1; i++) {
      D[i] = new Array(len2 + 1);
    }
    for (let i = 0; i < len1 + 1; i++) {
      D[i][0] = {
        del: 0,
        ins: 0,
        same: 0,
        state: "same",
        stateCount: 1,
      };
    }
    for (let j = 0; j < len2 + 1; j++) {
      D[0][j] = {
        del: 0,
        ins: 0,
        same: 0,
        state: "same",
        stateCount: 1,
      };
    }

    if (this.LCSMapMap.has(nodeObj1)) {
      this.LCSMapMap.get(nodeObj1).set(nodeObj2, C);
    } else {
      const m = new Map();
      m.set(nodeObj2, C);
      this.LCSMapMap.set(nodeObj1, m);
    }

    for (let i = 1; i < len1 + 1; i++) {
      for (let j = 1; j < len2 + 1; j++) {
        const child1 = nodeObj1.childNodes[i - 1];
        const child2 = nodeObj2.childNodes[j - 1];

        this.depth++;
        const result = this.LCS(child1, child2);
        this.depth--;
        const score = this.resultToScore(result);

        const score11 = C[i-1][j-1] + score;
        const score01 = C[i][j-1];
        const score10 = C[i-1][j];

        if (score11 >= score01 && score11 >= score10) {
          C[i][j] = score11;
          D[i][j] = this.addResult(D[i-1][j-1], result);
        } else if (score01 > score10) {
          C[i][j] = score01;
          if (typeof child2 === "string") {
            const D01 = D[i][j-1];
            D[i][j] = this.addResult(D01, {
              del: 0,
              ins: this.compressSpaces(child2).length,
              same: 0,
              state: "diff",
              stateCount: 1,
            });
          } else {
            const D01 = D[i][j-1];
            D[i][j] = this.addResult(D01, {
              del: 0,
              ins: child2.textLength,
              same: 0,
              state: "diff",
              stateCount: 1,
            });
          }
        } else {
          C[i][j] = score10;
          if (typeof child1 === "string") {
            const D10 = D[i-1][j];
            D[i][j] = this.addResult(D10, {
              del: this.compressSpaces(child1).length,
              ins: 0,
              same: 0,
              state: "diff",
              stateCount: 1,
            });
          } else {
            const D10 = D[i-1][j];
            D[i][j] = this.addResult(D10, {
              del: child1.textLength,
              ins: 0,
              same: 0,
              state: "diff",
              stateCount: 1,
            });
          }
        }
      }
    }

    return D[len1][len2];
  }

  compressSpaces(s) {
    return s.replace(/\s+/, " ");
  }

  // Calculates a score for the difference, in [0,1] range.
  // 1 means no difference, and 0 means completely different.
  resultToScore(r) {
    if (r.same + r.del + r.ins === 0) {
      return 1;
    }

    const fragmentFactor = r.stateCount > 2 ? (1 + (r.stateCount - 2) / 10) : 1;
    const score = r.same / (r.same + (r.del + r.ins) * fragmentFactor);

    const THRESHOLD = 0.1;
    if (score < THRESHOLD) {
      return 0;
    }
    return score;
  }

  addResult(r1, r2) {
    let stateCount = r1.stateCount;
    if (r1.state !== r2.state) {
      stateCount++;
    }
    return {
      del: r1.del + r2.del,
      ins: r1.ins + r2.ins,
      same: r1.same + r2.same,
      state: r2.state,
      stateCount,
    };
  }

  // Convert LCS maps into diff tree.
  LCSToDiff(parentObj, nodeObj1, nodeObj2) {
    if (typeof nodeObj1 !== typeof nodeObj2) {
      this.prependChildIns(parentObj, nodeObj2);
      this.prependChildDel(parentObj, nodeObj1);
      return;
    }

    if (typeof nodeObj1 === "string") {
      if (nodeObj1 !== nodeObj2) {
        this.prependChildIns(parentObj, nodeObj2);
        this.prependChildDel(parentObj, nodeObj1);
        return;
      }

      this.prependChild(parentObj, nodeObj2);
      return;
    }

    if (nodeObj1.name !== nodeObj2.name) {
      this.prependChildIns(parentObj, nodeObj2);
      this.prependChildDel(parentObj, nodeObj1);
      return;
    }

    if (nodeObj1.id !== nodeObj2.id) {
      this.prependChildIns(parentObj, nodeObj2);
      this.prependChildDel(parentObj, nodeObj1);
      return;
    }

    const len1 = nodeObj1.childNodes.length;
    const len2 = nodeObj2.childNodes.length;

    if (len1 === 0) {
      if (len2 === 0) {
        this.prependChild(parentObj, nodeObj2);
        return;
      }
      this.prependChildIns(parentObj, nodeObj2);
      this.prependChildDel(parentObj, nodeObj1);
      return;
    }
    if (len2 === 0) {
      this.prependChildIns(parentObj, nodeObj2);
      this.prependChildDel(parentObj, nodeObj1);
      return;
    }

    const C = this.LCSMapMap.get(nodeObj1).get(nodeObj2);

    for (let i = len1, j = len2; i > 0 || j > 0;) {
      if ((i > 0 && j > 0 && C[i][j] === C[i - 1][j - 1]) ||
          (j > 0 && C[i][j] === C[i][j - 1])) {
        this.prependChildIns(parentObj, nodeObj2.childNodes[j - 1]);
        j--;
      } else if (i > 0 && C[i][j] === C[i - 1][j]) {
        this.prependChildDel(parentObj, nodeObj1.childNodes[i - 1]);
        i--;
      } else if (i > 0 && j > 0 && C[i][j] - C[i - 1][j - 1] < 1) {
        if (typeof nodeObj2.childNodes[j - 1] === "string") {
          this.prependChildIns(parentObj, nodeObj2.childNodes[j - 1]);
          j--;
        } else {
          const box = this.shallowClone(nodeObj2.childNodes[j - 1]);

          this.LCSToDiff(box, nodeObj1.childNodes[i - 1], nodeObj2.childNodes[j - 1]);

          this.prependChild(parentObj, box);
          i--;
          j--;
        }
      } else {
        this.prependChild(parentObj, nodeObj2.childNodes[j - 1]);
        i--;
        j--;
      }
    }
  }

  // Prepend `nodeObj` to `parentObj`'s first child.
  prependChild(parentObj, nodeObj) {
    parentObj.childNodes.unshift(nodeObj);
  }

  // Prepend `nodeObj` to `parentObj`'s first child, wrapping `nodeObj` with
  // `ins`.
  prependChildIns(parentObj, nodeObj) {
    if (typeof nodeObj === "object" && nodeObj.name === "li") {
      const newNodeObj = this.shallowClone(nodeObj);
      for (let i = nodeObj.childNodes.length - 1; i >= 0; i--) {
        const child = nodeObj.childNodes[i];
        this.prependChildIns(newNodeObj, child);
      }
      this.prependChild(parentObj, newNodeObj);
      return;
    }

    if (parentObj.childNodes.length > 0) {
      const firstChild = parentObj.childNodes[0];
      if (typeof firstChild === "object" &&
          firstChild.name === "ins") {
        this.prependChild(firstChild, nodeObj);
        return;
      }
    }

    this.prependChild(parentObj, this.toIns(nodeObj));
  }

  // Clone nodeObj, without child nodes.
  shallowClone(nodeObj) {
    return {
      attributes: nodeObj.attributes,
      childNodes: [],
      id: nodeObj.id,
      name: nodeObj.name,
    };
  }

  // Prepend `nodeObj` to `parentObj`'s first child, wrapping `nodeObj` with
  // `del`.
  prependChildDel(parentObj, nodeObj) {
    if (typeof nodeObj === "object" && nodeObj.name === "li") {
      const newNodeObj = this.shallowClone(nodeObj);
      for (let i = nodeObj.childNodes.length - 1; i >= 0; i--) {
        const child = nodeObj.childNodes[i];
        this.prependChildDel(newNodeObj, child);
      }
      this.prependChild(parentObj, newNodeObj);
      return;
    }

    if (parentObj.childNodes.length > 0) {
      const firstChild = parentObj.childNodes[0];
      if (typeof firstChild === "object" &&
          firstChild.name === "del") {
        this.prependChild(firstChild, nodeObj);
        return;
      }
    }

    this.prependChild(parentObj, this.toDel(nodeObj));
  }

  toIns(nodeObj) {
    const ins = this.createIns();
    ins.childNodes.push(nodeObj);
    return ins;
  }

  createIns() {
    return this.createPlainObject("ins", undefined, {
      "class": "htmldiff-ins htmldiff-change",
    });
  }

  toDel(nodeObj) {
    const del = this.createDel();
    del.childNodes.push(nodeObj);
    return del;
  }

  createDel() {
    return this.createPlainObject("del", undefined, {
      "class": "htmldiff-del htmldiff-change",
    });
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
}

onmessage = msg => {
  const id = msg.data.id;
  const data = new HTMLTreeDiffWorker().run(msg.data.data);
  postMessage({
    data,
    id,
  });
};
