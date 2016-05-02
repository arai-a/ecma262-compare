"use strict";

var REPO_URL = "https://github.com/tc39/ecma262";
var PR_URL = "https://github.com/tc39/ecma262/pull/<PR>";

var fromSecData = {};
var toSecData = {};

function bodyOnLoad() {
  var revFilter = document.getElementById("rev-filter");
  var fromRev = document.getElementById("from-rev");
  var toRev = document.getElementById("to-rev");

  populatePRs(revFilter);

  populateRevs(fromRev);
  populateRevs(toRev);

  document.getElementById("compare").disabled = true;
  document.getElementById("view-diff").checked = true;
  document.getElementById("sec-changed").checked = true;

  parseQuery();
}

function parseQuery() {
  var revFilter = document.getElementById("rev-filter");
  var fromRev = document.getElementById("from-rev");
  var toRev = document.getElementById("to-rev");

  var query = window.location.hash.substring(1);
  var items = query.split("&");
  var queryParams = {};
  for (var i = 0; i < items.length; i++) {
    var item = items[i].split("=");
    try {
      queryParams[item[0]] = decodeURIComponent(item[1]);
    } catch (e) {
    }
  }

  if ("from" in queryParams && "to" in queryParams) {
    var from = queryParams.from;
    var to = queryParams.to;

    fromRev.value = from;
    toRev.value = to;

    if ("pr" in queryParams) {
      revFilter.value = queryParams.pr;
      filterRev('both');
    }

    update().then(function() {
      if ("id" in queryParams) {
        var id = queryParams.id;
        var menu = document.getElementById("sec-list");
        menu.value = id;
        compare();
      }
    });
  } else if ("pr" in queryParams) {
    var pr = queryParams.pr;
    if (pr in prs) {
      var info = prs[pr];

      fromRev.value = info.base;
      toRev.value = info.revs[0];

      revFilter.value = pr;
      filterRev('both');

      update();
    }
  }
}

function prnums() {
  return Object.keys(prs).map(function(x) {
    return parseInt(x, 10);
  }).sort().reverse();
}

function populateRevs(menu) {
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  revs.forEach(function(tmp) {
    var date = tmp[0], rev = tmp[1];
    var opt = document.createElement("option");
    opt.value = rev;
    opt.appendChild(document.createTextNode(rev + " (" + date + ")"));
    menu.appendChild(opt);
  });

  prnums().forEach(function(pr) {
    var info = prs[pr];

    var len = info.revs.length;
    var i = len;
    info.revs.forEach(function(rev) {
      var opt = document.createElement("option");
      opt.value = "PR/" + pr + "/" + rev;
      opt.appendChild(document.createTextNode(rev + " (PR " + pr + " by " + info.login + " [" + i + "/" + len + "])"));
      menu.appendChild(opt);
      i--;
    });
  });
}

function populatePRs(menu) {
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  var opt = document.createElement("option");
  opt.value = "all";
  opt.appendChild(document.createTextNode("all"));
  menu.appendChild(opt);

  prnums().forEach(function(pr) {
    var info = prs[pr];
    var opt = document.createElement("option");
    opt.value = pr;
    opt.appendChild(document.createTextNode("PR " + pr + ": " + info.title.slice(0, 100) + " (by " + info.login + ")"));
    menu.appendChild(opt);
  });

  menu.value = "all";
}

function filterRev(target) {
  var revFilter = document.getElementById("rev-filter");

  var fromRev = document.getElementById("from-rev");
  var toRev = document.getElementById("to-rev");

  var fromRevSearch = document.getElementById("from-rev-search").value;
  var toRevSearch = document.getElementById("to-rev-search").value;

  var pr = revFilter.value;
  var revSet = null;

  if (pr in prs) {
    var info = prs[pr];
    revSet = new Set(info.revs.map(function(rev) {
      return "PR/" + pr + "/" + rev;
    }).concat(info.base));

    var prLink = document.getElementById("pr-link");
    prLink.href = PR_URL.replace("<PR>", pr);
    prLink.innerHTML = "Open PR " + pr;
  } else {
    prLink.innerHTML = "";
  }

  if (target == "both" || target == "from") {
    filterMenu(fromRev, function(opt) {
      if (revSet) {
        if (!revSet.has(opt.value)) {
          return false;
        }
      }
      if (fromRevSearch) {
        if (opt.innerHTML.toLowerCase().indexOf(fromRevSearch.toLowerCase()) === -1) {
          return false;
        }
      }

      return true;
    });
  }
  if (target == "both" || target == "to") {
    filterMenu(toRev, function(opt) {
      if (revSet) {
        if (!revSet.has(opt.value)) {
          return false;
        }
      }
      if (toRevSearch) {
        if (opt.innerHTML.toLowerCase().indexOf(toRevSearch.toLowerCase()) !== 0) {
          return false;
        }
      }

      return true;
    });
  }

  if (revSet && !fromRevSearch && !toRevSearch) {
    fromRev.value = info.base;
    toRev.value = "PR/" + pr + "/" + info.revs[0];
  }
}

function hashOf(id) {
  return document.getElementById(id + "-rev").value;
}

function updateSecList() {
  var hit = document.getElementById("search-hit");
  hit.innerHTML = "";

  var menu = document.getElementById("sec-list");
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  var fromSet = new Set(fromSecData.secList);
  var toSet = new Set(toSecData.secList);
  var set = new Set(fromSecData.secList.concat(toSecData.secList));

  var s = function(a, b) {
    var aTitle = getComparableTitle(a);
    var bTitle = getComparableTitle(b);
    if (aTitle == bTitle) {
      return 0;
    }
    return aTitle < bTitle ? -1 : 1;
  };

  function getTitle(sec) {
    if (sec in fromSecData.secData) {
      return fromSecData.secData[sec].num + " " + fromSecData.secData[sec].title;
    }

    if (sec in toSecData.secData) {
      return toSecData.secData[sec].num + " " + toSecData.secData[sec].title;
    }

    return "";
  }

  function getComparableTitle(sec) {
    var t = getTitle(sec);
    return t.replace(/([0-9]+)/g, function(matched) {
      return String.fromCharCode(matched);
    });
  }

  Array.from(set).sort(s).forEach(function(sec) {
    var opt = document.createElement("option");
    opt.value = sec;

    var stat = "same";
    var mark = "\u00A0\u00A0";

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

    var title = getTitle(sec);

    if (title) {
      opt.appendChild(document.createTextNode(mark + " " + title.slice(0, 100)));
    } else {
      opt.appendChild(document.createTextNode(mark + " " + sec));
    }
    opt.className = stat;

    menu.appendChild(opt);
  });

  filterSec();
}

function getSecData(id) {
  return new Promise(function(resolve) {
    var hash = hashOf(id);
    var req = new XMLHttpRequest();
    req.addEventListener("load", function() {
      if (req.readyState == 4 && req.status == 200) {
        resolve(req.response);
      }
    });
    req.open("GET", "./history/" + hash + ".json", true);
    req.responseType = "json";
    req.send(null);
  });
}

function update() {
  document.getElementById("update").disabled = true;
  document.getElementById("result").innerHTML = "";
  document.getElementById("diff-stat").innerHTML = "";

  return Promise.all([
    getSecData("from"),
    getSecData("to")
  ]).then(function(tmp) {
    fromSecData = tmp[0];
    toSecData = tmp[1];
    updateSecList();
    document.getElementById("update").disabled = false;
    document.getElementById("compare").disabled = false;
  });
}

var ListMarkUtils = {
  getListDepth: function(node) {
    var depth = 0;
    while (node && node != document.body) {
      if (node.nodeName.toLowerCase() == "ol") {
        depth++;
      }
      node = node.parentNode;
    }
    return depth;
  },

  decimalToText: function(ordinal) {
    return ordinal.toString(10);
  },

  romanToText: function(ordinal, achars, bchars) {
    if (ordinal < 1 || ordinal > 3999) {
      this.decimalToText(ordinal);
      return false;
    }
    var addOn, decStr;
    decStr = ordinal.toString(10);
    var len = decStr.length;
    var romanPos = len;
    var n;
    var result = "";

    for (var i = 0; i < len; i++) {
      var dp = decStr.substr(i, 1);
      romanPos--;
      addOn = "";
      switch(dp) {
        case '3':
          addOn += achars[romanPos];
          /* fall through */
        case '2':
          addOn += achars[romanPos];
          /* fall through */
        case '1':
          addOn += achars[romanPos];
          break;
        case '4':
          addOn += achars[romanPos];
          /* fall through */
        case '5': case '6':
        case '7': case '8':
          addOn += bchars[romanPos];
          for(n=0;'5'.charCodeAt(0)+n<dp.charCodeAt(0);n++) {
            addOn += achars[romanPos];
          }
          break;
        case '9':
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

  charListToText: function(ordinal, chars) {
    var base = chars.length;
    var buf = "";
    if (ordinal < 1) {
      return this.decimalToText(ordinal);
    }
    do {
      ordinal--;
      var cur = ordinal % base;
      buf = chars.charAt(cur) + buf;
      ordinal = Math.floor(ordinal / base);
    } while ( ordinal > 0);

    return buf;
  },

  toListMark: function(i, depth) {
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

  textify: function(innerHTML) {
    var tempbox = document.getElementById("tempbox");
    tempbox.innerHTML = innerHTML;

    var ols = document.getElementsByTagName("ol");
    Array.from(ols).forEach(function(ol) {
      var depth = this.getListDepth(ol);

      var i = 0;
      Array.from(ol.children).forEach(function(li) {
        if (li.nodeName.toLowerCase() == "li") {
          var mark = document.createTextNode(this.toListMark(i, depth) + ". ");
          li.insertBefore(mark, li.firstChild);

          i++;
        }
      }, this);
    }, this);

    return tempbox.innerHTML;
  }
};

function compare() {
  var id = document.getElementById("sec-list").value;

  var fromHTML = id in fromSecData.secData ? fromSecData.secData[id].html : null;
  var toHTML = id in toSecData.secData ? toSecData.secData[id].html : null;

  var result = document.getElementById("result");

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

    var add = result.getElementsByClassName("htmldiff-add").length;
    var del = result.getElementsByClassName("htmldiff-del").length;

    var note = "";
    if (add == 0 && del == 0) {
      if (fromHTML != toHTML) {
        note = " (changes in markup or something)";
      }
    }

    document.getElementById("diff-stat").innerHTML = "+" + add + " " + "-" + del + note;
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
  var id = document.getElementById("sec-list").value;

  var hash = "#from=" + hashOf("from")
    + "&to=" + hashOf("to")
    + "&id=" + encodeURIComponent(id);

  var revFilter = document.getElementById("rev-filter");
  var pr = revFilter.value;
  if (pr != "all") {
    hash += "&pr=" + pr;
  }

  window.location.hash
    = hash;
}

function searchFromRev() {
}

function searchToRev() {
}

function filterMenu(menu, filter) {
  var value = "";
  var count = 0;
  Array.from(menu.children).forEach(function(opt) {
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
  });

  menu.value = value;

  return count;
}

function filterSec() {
  var search = document.getElementById("sec-list-search").value;
  var changedOnly = document.getElementById("sec-changed").checked;

  var menu = document.getElementById("sec-list");
  var count = filterMenu(menu, function(opt) {
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

  var hit = document.getElementById("search-hit");
  if (search || changedOnly) {
    hit.innerHTML = count + " section(s) found";
  } else {
    hit.innerHTML = "";
  }

  compare();
}

function isChanged(id) {
  if (!(id in fromSecData.secData) || !(id in toSecData.secData)) {
    return true;
  }

  var fromHTML = fromSecData.secData[id].html;
  var toHTML = toSecData.secData[id].html;

  return fromHTML != toHTML;
}
