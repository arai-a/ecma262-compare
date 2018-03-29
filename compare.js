"use strict";

if (!("prs" in window)) {
  window.prs = {};
}

const REPO_URL = "https://github.com/tc39/ecma262";
let pr_url = pr => `https://github.com/tc39/ecma262/pull/${pr}`;

let fromSecData = {};
let toSecData = {};

let prnums = Object.keys(prs).map(x => parseInt(x, 10)).sort().reverse();

function bodyOnLoad() {
  let revFilter = document.getElementById("rev-filter");
  let fromRev = document.getElementById("from-rev");
  let toRev = document.getElementById("to-rev");

  populatePRs(revFilter);

  populateRevs(fromRev);
  populateRevs(toRev);

  document.getElementById("compare").disabled = true;
  document.getElementById("view-diff").checked = true;
  document.getElementById("sec-changed").checked = true;

  parseQuery();
}

async function parseQuery() {
  let revFilter = document.getElementById("rev-filter");
  let fromRev = document.getElementById("from-rev");
  let toRev = document.getElementById("to-rev");

  let query = window.location.hash.slice(1);
  let items = query.split("&");
  let queryParams = {};
  for (let item of items) {
    let [name, value] = item.split("=");
    try {
      queryParams[name] = decodeURIComponent(value);
    } catch (e) {
    }
  }

  if ("from" in queryParams && "to" in queryParams) {
    let from = queryParams.from;
    let to = queryParams.to;

    fromRev.value = from;
    toRev.value = to;

    if ("pr" in queryParams) {
      revFilter.value = queryParams.pr;
      filterRev("both");
    }

    await update();

    if ("id" in queryParams) {
      let id = queryParams.id;
      let menu = document.getElementById("sec-list");
      menu.value = id;
      compare();
    }
  } else if ("pr" in queryParams) {
    let pr = queryParams.pr;
    if (pr in prs) {
      let info = prs[pr];

      fromRev.value = info.base;
      toRev.value = info.revs[0];

      revFilter.value = pr;
      filterRev("both");

      await update();
    }
  }
}

function populateRevs(menu) {
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  for (let [date, rev] of revs) {
    let opt = document.createElement("option");
    opt.value = rev;
    opt.appendChild(document.createTextNode(`${rev} (${date})`));
    menu.appendChild(opt);
  }

  for (let pr of prnums) {
    let info = prs[pr];

    let len = info.revs.length;
    let i = len;
    for (let rev of info.revs) {
      let opt = document.createElement("option");
      opt.value = `PR/${pr}/${rev}`;
      opt.appendChild(document.createTextNode(`${rev} (PR ${pr} by ${info.login} [${i}/${len}])`));
      menu.appendChild(opt);
      i--;
    }
  }
}

function populatePRs(menu) {
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  let opt = document.createElement("option");
  opt.value = "all";
  opt.appendChild(document.createTextNode("all"));
  menu.appendChild(opt);

  for (let pr of prnums) {
    let info = prs[pr];
    let opt = document.createElement("option");
    opt.value = pr;
    opt.appendChild(document.createTextNode(`PR ${pr}: ${info.title.slice(0, 100)} (by ${info.login})`));
    menu.appendChild(opt);
  }

  menu.value = "all";
}

function filterRev(target) {
  let revFilter = document.getElementById("rev-filter");
  let fromRev = document.getElementById("from-rev");
  let toRev = document.getElementById("to-rev");

  let fromRevSearch = document.getElementById("from-rev-search").value;
  let toRevSearch = document.getElementById("to-rev-search").value;

  let pr = revFilter.value;
  let revSet = null;
  let info = null;
  let prLink = document.getElementById("pr-link");
  if (pr in prs) {
    info = prs[pr];
    revSet = new Set(info.revs.map(rev => `PR/${pr}/${rev}`).concat(info.base));

    prLink.href = pr_url(pr);
    prLink.innerHTML = `Open PR ${pr}`;
  } else {
    prLink.innerHTML = "";
  }

  if (target == "both" || target == "from") {
    filterMenu(fromRev, opt => {
      if (revSet) {
        if (!revSet.has(opt.value)) {
          return false;
        }
      }
      if (fromRevSearch) {
        if (opt.innerHTML.toLowerCase().includes(fromRevSearch.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }
  if (target == "both" || target == "to") {
    filterMenu(toRev, opt => {
      if (revSet) {
        if (!revSet.has(opt.value)) {
          return false;
        }
      }
      if (toRevSearch) {
        if (opt.innerHTML.toLowerCase().includes(toRevSearch.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  if (revSet && !fromRevSearch && !toRevSearch) {
    fromRev.value = info.base;
    toRev.value = `PR/${pr}/${info.revs[0]}`;
  }
}

function hashOf(id) {
  return document.getElementById(`${id}-rev`).value;
}

function updateSecList() {
  let hit = document.getElementById("search-hit");
  hit.innerHTML = "";

  let menu = document.getElementById("sec-list");
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  let fromSet = new Set(fromSecData.secList);
  let toSet = new Set(toSecData.secList);
  let set = new Set(fromSecData.secList.concat(toSecData.secList));

  function getTitle(sec) {
    if (sec in fromSecData.secData) {
      return `${fromSecData.secData[sec].num} ${fromSecData.secData[sec].title}`;
    }

    if (sec in toSecData.secData) {
      return `${toSecData.secData[sec].num} ${toSecData.secData[sec].title}`;
    }

    return "";
  }

  function getComparableTitle(sec) {
    let t = getTitle(sec);
    return t.replace(/([0-9]+)/g, matched => String.fromCharCode(matched));
  }

  for (let sec of Array.from(set).sort((a, b) => {
    let aTitle = getComparableTitle(a);
    let bTitle = getComparableTitle(b);
    if (aTitle == bTitle) {
      return 0;
    }
    return aTitle < bTitle ? -1 : 1;
  })) {
    let opt = document.createElement("option");
    opt.value = sec;

    let stat = "same";
    let mark = "\u00A0\u00A0";

    if (fromSet.has(sec)) {
      if (toSet.has(sec)) {
        if (isChanged(sec)) {
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

    let title = getTitle(sec);

    if (title) {
      opt.appendChild(document.createTextNode(`${mark} ${title.slice(0, 100)}`));
    } else {
      opt.appendChild(document.createTextNode(`${mark} ${sec}`));
    }
    opt.className = stat;

    menu.appendChild(opt);
  }

  filterSec();
}

function getSecData(id) {
  let hash = hashOf(id);
  let req = new XMLHttpRequest();
  let loadPromise = new Promise(resolve => {
    req.addEventListener("load", () => {
      if (req.readyState == 4 && req.status == 200) {
        resolve(req.response);
      }
    });
  });
  req.open("GET", `./history/${hash}.json`, true);
  req.responseType = "json";
  req.send(null);

  return loadPromise;
}

async function update() {
  document.getElementById("update").disabled = true;
  document.getElementById("result").innerHTML = "";
  document.getElementById("diff-stat").innerHTML = "";

  [fromSecData, toSecData] = await Promise.all([
    getSecData("from"),
    getSecData("to")
  ]);

  updateSecList();
  document.getElementById("update").disabled = false;
  document.getElementById("compare").disabled = false;
}

let ListMarkUtils = {
  getListDepth(node) {
    let depth = 0;
    while (node && node != document.body) {
      if (node.nodeName.toLowerCase() == "ol") {
        depth++;
      }
      node = node.parentNode;
    }
    return depth;
  },

  decimalToText(ordinal) {
    return ordinal.toString(10);
  },

  romanToText(ordinal, achars, bchars) {
    if (ordinal < 1 || ordinal > 3999) {
      this.decimalToText(ordinal);
      return false;
    }
    let addOn, decStr;
    decStr = ordinal.toString(10);
    let len = decStr.length;
    let romanPos = len;
    let result = "";

    for (let i = 0; i < len; i++) {
      let dp = decStr.substr(i, 1);
      romanPos--;
      addOn = "";
      switch(dp) {
        case "3":
          addOn += achars[romanPos];
          /* fall through */
        case "2":
          addOn += achars[romanPos];
          /* fall through */
        case "1":
          addOn += achars[romanPos];
          break;
        case "4":
          addOn += achars[romanPos];
          /* fall through */
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
  },

  charListToText(ordinal, chars) {
    let base = chars.length;
    let buf = "";
    if (ordinal < 1) {
      return this.decimalToText(ordinal);
    }
    do {
      ordinal--;
      let cur = ordinal % base;
      buf = chars.charAt(cur) + buf;
      ordinal = Math.floor(ordinal / base);
    } while (ordinal > 0);

    return buf;
  },

  toListMark(i, depth) {
    if (depth == 1 || depth == 4) {
      return this.decimalToText(i + 1);
    }
    if (depth == 2 || depth == 5) {
      return this.charListToText(i + 1, "abcdefghijklmnopqrstuvwxyz");
    }
    if (depth == 3 || depth == 6) {
      return this.romanToText(i + 1, "ixcm", "vld");
    }

    return this.decimalToText(i + 1);
  },

  textify(innerHTML) {
    let tempbox = document.getElementById("tempbox");
    tempbox.innerHTML = innerHTML;

    let ols = document.getElementsByTagName("ol");
    for (let ol of ols) {
      let depth = this.getListDepth(ol);

      let i = 0;
      for (let li of ol.children) {
        if (li.nodeName.toLowerCase() != "li") {
          continue;
        }

        let mark = document.createTextNode(`${this.toListMark(i, depth)}. `);
        li.insertBefore(mark, li.firstChild);

        i++;
      }
    }

    return tempbox.innerHTML;
  }
};

function compare() {
  let id = document.getElementById("sec-list").value;

  let fromHTML = id in fromSecData.secData ? fromSecData.secData[id].html : null;
  let toHTML = id in toSecData.secData ? toSecData.secData[id].html : null;

  let result = document.getElementById("result");

  result.className = "";
  if (document.getElementById("view-diff").checked) {
    if (fromHTML !== null && toHTML !== null) {
      result.className = "diff-view";
      result.innerHTML = htmldiff(ListMarkUtils.textify(fromHTML), ListMarkUtils.textify(toHTML));
    } else if (fromHTML !== null) {
      result.className = "diff-view";
      result.innerHTML = htmldiff(ListMarkUtils.textify(fromHTML), "");
    } else if (toHTML !== null) {
      result.className = "diff-view";
      result.innerHTML = htmldiff("", ListMarkUtils.textify(toHTML));
    } else {
      result.innerHTML = "";
    }

    let add = result.getElementsByClassName("htmldiff-add").length;
    let del = result.getElementsByClassName("htmldiff-del").length;

    let note = "";
    if (add == 0 && del == 0) {
      if (fromHTML != toHTML) {
        note = " (changes in markup or something)";
      }
    }

    document.getElementById("diff-stat").innerHTML = `+${add} -${del}${note}`;
  } else {
    if (document.getElementById("view-from").checked) {
      if (fromHTML !== null) {
        result.innerHTML = fromHTML;
      } else {
        result.innerHTML = "";
      }
    } else if (document.getElementById("view-to").checked) {
      if (toHTML !== null) {
        result.innerHTML = toHTML;
      } else {
        result.innerHTML = "";
      }
    } else {
      result.innerHTML = "";
    }

    document.getElementById("diff-stat").innerHTML = "-";
  }
}

function updateURL() {
  let id = document.getElementById("sec-list").value;

  let params = [];
  params.push(`from=${hashOf("from")}`);
  params.push(`to=${hashOf("to")}`);
  params.push(`id=${encodeURIComponent(id)}`);

  let revFilter = document.getElementById("rev-filter");
  let pr = revFilter.value;
  if (pr != "all") {
    params.push(`pr=${pr}`);
  }

  window.location.hash = `#${params.join("&")}`;
}

function filterMenu(menu, filter) {
  let value = "";
  let count = 0;
  for (let opt of menu.children) {
    if (filter(opt)) {
      if (!value) {
        value = opt.value;
      }
      opt.style.display = "";
      opt.disabled = false;
      count++;
    } else {
      opt.style.display = "none";
      opt.disabled = true;
    }
  }

  menu.value = value;

  return count;
}

function filterSec() {
  let search = document.getElementById("sec-list-search").value;
  let changedOnly = document.getElementById("sec-changed").checked;

  let menu = document.getElementById("sec-list");
  let count = filterMenu(menu, opt => {
    if (changedOnly) {
      if (opt.className == "same") {
        return false;
      }
    }
    if (search) {
      if (opt.innerHTML.toLowerCase().indexOf(search.toLowerCase()) === -1) {
        return false;
      }
    }

    return true;
  });

  let hit = document.getElementById("search-hit");
  if (search || changedOnly) {
    hit.innerHTML = `${count} section(s) found`;
  } else {
    hit.innerHTML = "";
  }

  compare();
}

function isChanged(id) {
  if (!(id in fromSecData.secData) || !(id in toSecData.secData)) {
    return true;
  }

  let fromHTML = fromSecData.secData[id].html;
  let toHTML = toSecData.secData[id].html;

  return fromHTML != toHTML;
}
