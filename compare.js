"use strict";

if (!("prs" in window)) {
  window.prs = {};
}

const REPO_URL = "https://github.com/tc39/ecma262";
let pr_url = pr => `https://github.com/tc39/ecma262/pull/${pr}`;

let fromSecData = {};
let toSecData = {};

let fromOpts = [];
let toOpts = [];
let secOpts = [];

let prnums = Object.keys(prs).map(x => parseInt(x, 10)).sort().reverse();

function bodyOnLoad() {
  let prFilter = document.getElementById("pr-filter");
  let fromRev = document.getElementById("from-rev");
  let toRev = document.getElementById("to-rev");

  populatePRs(prFilter);

  populateRevs(fromRev, fromOpts);
  populateRevs(toRev, toOpts);

  document.getElementById("compare").disabled = true;
  document.getElementById("view-diff").checked = true;
  document.getElementById("sec-filter").checked = true;

  parseQuery();
}

async function parseQuery() {
  let prFilter = document.getElementById("pr-filter");
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

    if ("pr" in queryParams) {
      prFilter.value = queryParams.pr;
      filterRev("both");
    }
    fromRev.value = from;
    toRev.value = to;

    await updateSectionList();

    if ("id" in queryParams) {
      let id = queryParams.id;
      let menu = document.getElementById("sec-list");
      menu.value = id;
    }

    await compare();
  } else if ("pr" in queryParams) {
    let pr = queryParams.pr;
    if (pr in prs) {
      let info = prs[pr];

      fromRev.value = info.base;
      toRev.value = info.revs[0];

      prFilter.value = pr;
      filterRev("both");

      await updateSectionList();

      await compare();
    }
  }
}

function populateRevs(menu, opts) {
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  for (let [date, rev] of revs) {
    let opt = document.createElement("option");
    opt.value = rev;
    opt.appendChild(document.createTextNode(`${rev} (${date})`));
    opts.push(opt);
  }

  for (let pr of prnums) {
    let info = prs[pr];

    let len = info.revs.length;
    let i = len;
    for (let rev of info.revs) {
      let opt = document.createElement("option");
      opt.value = `PR/${pr}/${rev}`;
      opt.appendChild(document.createTextNode(`${rev} (PR ${pr} by ${info.login} [${i}/${len}])`));
      opts.push(opt);
      i--;
    }
  }

  populateMenu(menu, opts, () => true);
}

function populatePRs(menu) {
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  let opt = document.createElement("option");
  opt.value = "-";
  opt.appendChild(document.createTextNode("-"));
  menu.appendChild(opt);

  for (let pr of prnums) {
    let info = prs[pr];
    let opt = document.createElement("option");
    opt.value = pr;
    opt.appendChild(document.createTextNode(`PR ${pr}: ${info.title.slice(0, 100)} (by ${info.login})`));
    menu.appendChild(opt);
  }

  menu.value = "-";
}

function filterRev(target) {
  let prFilter = document.getElementById("pr-filter");
  let fromRev = document.getElementById("from-rev");
  let toRev = document.getElementById("to-rev");

  let fromRevSearch = document.getElementById("from-rev-search").value;
  let toRevSearch = document.getElementById("to-rev-search").value;

  let pr = prFilter.value;
  let revSet = null;
  let info = null;
  let prLink = document.getElementById("pr-link");
  if (pr in prs) {
    info = prs[pr];
    revSet = new Set(info.revs.map(rev => `PR/${pr}/${rev}`).concat(info.base));

    prLink.href = pr_url(pr);
    prLink.innerText = `Open PR ${pr}`;
  } else {
    prLink.innerText = "";
  }

  if (target === "both" || target === "from") {
    populateMenu(fromRev, fromOpts, opt => {
      if (revSet) {
        if (!revSet.has(opt.value)) {
          return false;
        }
      }
      if (fromRevSearch) {
        if (opt.innerText.toLowerCase().includes(fromRevSearch.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }
  if (target === "both" || target === "to") {
    populateMenu(toRev, toOpts, opt => {
      if (revSet) {
        if (!revSet.has(opt.value)) {
          return false;
        }
      }
      if (toRevSearch) {
        if (opt.innerText.toLowerCase().includes(toRevSearch.toLowerCase())) {
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

function getSecData(id) {
  let hash = hashOf(id);
  let req = new XMLHttpRequest();
  let loadPromise = new Promise(resolve => {
    req.addEventListener("load", () => {
      if (req.readyState === 4 && req.status === 200) {
        resolve(req.response);
      }
    });
  });
  req.open("GET", `./history/${hash}.json`, true);
  req.responseType = "json";
  req.send(null);

  return loadPromise;
}

async function updateSectionList() {
  document.getElementById("update").disabled = true;
  document.getElementById("result").innerText = "";
  document.getElementById("diff-stat").innerText = "";

  [fromSecData, toSecData] = await Promise.all([
    getSecData("from"),
    getSecData("to")
  ]);

  let hit = document.getElementById("search-hit");
  hit.innerText = "";

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

  secOpts = [];

  let opt = document.createElement("option");
  opt.value = "combined";
  opt.appendChild(document.createTextNode(`Combined view`));
  secOpts.push(opt);

  for (let sec of Array.from(set).sort((a, b) => {
    let aTitle = getComparableTitle(a);
    let bTitle = getComparableTitle(b);
    if (aTitle === bTitle) {
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

    secOpts.push(opt);
  }

  filterSectionList();

  document.getElementById("update").disabled = false;
  document.getElementById("compare").disabled = false;
}

let ListMarkUtils = {
  getListDepth(node) {
    let depth = 0;
    while (node && node !== document.body) {
      if (node.nodeName.toLowerCase() === "ol") {
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
  },

  textify(innerHTML) {
    let tempbox = document.getElementById("tempbox");
    tempbox.innerHTML = innerHTML;

    let ols = tempbox.getElementsByTagName("ol");
    for (let ol of ols) {
      let depth = this.getListDepth(ol);

      let i = 0;
      for (let li of ol.children) {
        if (li.nodeName.toLowerCase() !== "li") {
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

let combineStatus = {
  processIndicator: null,
  processing: false,
  abortProcessing: false,
};

async function combineSections(result, sections, isDiff) {
  if (combineStatus.processing) {
    combineStatus.abortProcessing = true;
    do {
      await new Promise(r => setTimeout(r, 100));
    } while (combineStatus.processing);
    combineStatus.abortProcessing = false;
  }

  combineStatus.processing = true;

  let i = 0, len = sections.size;

  if (len > 1) {
    if (!combineStatus.processIndicator) {
      combineStatus.processIndicator = document.createElement("div");
      combineStatus.processIndicator.id = "progress-indicator";
    }
    document.body.appendChild(combineStatus.processIndicator);
  }

  result.innerText = "";
  for (let [id, HTML] of sections) {
    if (len > 1) {
      i++;
      combineStatus.processIndicator.textContent = `processing ${i}/${len}`;
      await new Promise(r => setTimeout(r, 1));

      if (combineStatus.abortProcessing) {
        break;
      }
    }

    if (isDiff) {
      HTML = createDiff(HTML[0], HTML[1]);
    }

    let box = document.getElementById(`excluded-${id}`);
    if (box) {
      box.id = "";
      box.innerHTML = HTML;
    } else {
      box = document.createElement("div");
      box.innerHTML = HTML;
      result.appendChild(box);
    }
  }
  if (len > 1) {
    combineStatus.processIndicator.remove();
  }

  combineStatus.processing = false;
}

function createDiff(fromHTML, toHTML) {
  if (fromHTML !== null && toHTML !== null) {
    return htmldiff(ListMarkUtils.textify(fromHTML),
                    ListMarkUtils.textify(toHTML));
  }
  if (fromHTML !== null) {
    return htmldiff(ListMarkUtils.textify(fromHTML), "");
  }
  if (toHTML !== null) {
    return htmldiff("", ListMarkUtils.textify(toHTML));
  }
  return "";
}

async function compare() {
  let result = document.getElementById("result");
  result.className = "";

  let secList = [];
  if (document.getElementById("sec-list").value === "combined") {
    result.classList.add("combined");

    for (let opt of document.getElementById("sec-list").children) {
      let id = opt.value;
      if (id === "combined") {
        continue;
      }

      let fromHTML = null, toHTML = null;
      if (id in fromSecData.secData) {
        fromHTML = fromSecData.secData[id].html;
      }
      if (id in toSecData.secData) {
        toHTML = toSecData.secData[id].html;
      }
      secList.push([id, fromHTML, toHTML]);
    }
  } else {
    let id = document.getElementById("sec-list").value;

    let fromHTML = null, toHTML = null;
    if (id in fromSecData.secData) {
      fromHTML = fromSecData.secData[id].html;
    }
    if (id in toSecData.secData) {
      toHTML = toSecData.secData[id].html;
    }
    secList.push([id, fromHTML, toHTML]);
  }

  if (document.getElementById("view-diff").checked) {
    result.classList.add("diff-view");

    let sections = new Map();
    let differ = false;
    for (let [id, fromHTML, toHTML] of secList) {
      if (fromHTML !== toHTML) {
        differ = true;
      }
      sections.set(id, [fromHTML, toHTML]);
    }

    await combineSections(result, sections, true);

    let add = result.getElementsByClassName("htmldiff-add").length;
    let del = result.getElementsByClassName("htmldiff-del").length;

    let note = "";
    if (add === 0 && del === 0) {
      if (differ) {
        note = " (changes in markup or something)";
      }
    }

    document.getElementById("diff-stat").innerText = `+${add} -${del}${note}`;
  } else {
    if (document.getElementById("view-from").checked) {
      let sections = new Map();
      for (let [id, fromHTML, toHTML] of secList) {
        sections.set(id, fromHTML);
      }
      await combineSections(result, sections, false);
    } else if (document.getElementById("view-to").checked) {
      let sections = new Map();
      for (let [id, fromHTML, toHTML] of secList) {
        sections.set(id, toHTML);
      }
      await combineSections(result, sections, false);
    } else {
      result.innerText = "";
    }

    document.getElementById("diff-stat").innerText = "-";
  }
}

function updateURL() {
  let id = document.getElementById("sec-list").value;

  let params = [];
  params.push(`from=${hashOf("from")}`);
  params.push(`to=${hashOf("to")}`);
  params.push(`id=${encodeURIComponent(id)}`);
  let prFilter = document.getElementById("pr-filter");
  let pr = prFilter.value;
  if (pr !== "-") {
    params.push(`pr=${pr}`);
  }

  window.location.hash = `#${params.join("&")}`;
}

let optsMap = new Map();
function populateMenu(menu, opts, filter) {
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  let value = "";
  let count = 0;
  for (let opt of opts) {
    if (filter(opt)) {
      if (!value) {
        value = opt.value;
      }
      menu.appendChild(opt);
      opt.disabled = false;
      count++;
    }
  }

  menu.value = value;
  return count;
}

async function filterSectionList(doCompare=true) {
  let search = document.getElementById("sec-list-search").value;
  let changedOnly = document.getElementById("sec-filter").checked;

  let menu = document.getElementById("sec-list");
  let count = populateMenu(menu, secOpts, opt => {
    if (changedOnly) {
      if (opt.className === "same") {
        return false;
      }
    }
    if (search) {
      if (opt.innerText.toLowerCase().indexOf(search.toLowerCase()) === -1) {
        return false;
      }
    }

    return true;
  });

  let hit = document.getElementById("search-hit");
  if (search || changedOnly) {
    hit.innerText = `${count - 1} section(s) found`;
  } else {
    hit.innerText = "";
  }

  if (doCompare) {
    await compare();
    updateURL();
  }
}

function isChanged(id) {
  if (!(id in fromSecData.secData) || !(id in toSecData.secData)) {
    return true;
  }

  let fromHTML = fromSecData.secData[id].html;
  let toHTML = toSecData.secData[id].html;

  return fromHTML !== toHTML;
}

async function onPRFilterChange() {
  filterRev("both");
  updateSectionList();
  await compare();
  updateURL();
}
async function onFromRevFilterChange() {
  filterRev("from");
  updateSectionList();
  await compare();
  updateURL();
}
async function onToRevFilterChange() {
  filterRev("to");
  updateSectionList();
  await compare();
  updateURL();
}

async function onFromRevChange() {
  updateSectionList();
  await compare();
  updateURL();
}
async function onToRevChange() {
  updateSectionList();
  await compare();
  updateURL();
}

async function onSecListSearchChanged() {
  filterSectionList();
  await compare();
  updateURL();
}
async function onSecFlterChanged() {
  filterSectionList();
  await compare();
  updateURL();
}
