"use strict";

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
      filterPR();
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
      filterPR();

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

function filterPR() {
  var revFilter = document.getElementById("rev-filter");

  var fromRev = document.getElementById("from-rev");
  var toRev = document.getElementById("to-rev");

  var pr = revFilter.value;

  if (pr in prs) {
    var info = prs[pr];
    var revSet = new Set(info.revs.map(function(rev) {
      return "PR/" + pr + "/" + rev;
    }).concat(info.base));

    [fromRev, toRev].forEach(function(menu) {
      Array.from(menu.children).forEach(function(opt) {
        if (revSet.has(opt.value)) {
          opt.style.display = "";
          opt.disabled = false;
        } else {
          opt.style.display = "none";
          opt.disabled = true;
        }
      });
    });

    fromRev.value = info.base;
    toRev.value = "PR/" + pr + "/" + info.revs[0];
  } else {
    [fromRev, toRev].forEach(function(menu) {
      Array.from(menu.children).forEach(function(opt) {
        opt.style.display = "";
        opt.disabled = false;
      });
    });
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

  filter();
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

function getListDepth(node) {
  var depth = 0;
  while (node && node != document.body) {
    if (node.nodeName.toLowerCase() == "ol") {
      depth++;
    }
    node = node.parentNode;
  }
  return depth;
}

function DecimalToText(ordinal) {
  return ordinal.toString(10);
};

function RomanToText(ordinal, achars, bchars) {
  if (ordinal < 1 || ordinal > 3999) {
    DecimalToText(ordinal);
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
};

var gLowerAlphaChars = [
  0x0061, 0x0062, 0x0063, 0x0064, 0x0065, // A   B   C   D   E
  0x0066, 0x0067, 0x0068, 0x0069, 0x006A, // F   G   H   I   J
  0x006B, 0x006C, 0x006D, 0x006E, 0x006F, // K   L   M   N   O
  0x0070, 0x0071, 0x0072, 0x0073, 0x0074, // P   Q   R   S   T
  0x0075, 0x0076, 0x0077, 0x0078, 0x0079, // U   V   W   X   Y
  0x007A                                  // Z
];
function CharListToText(ordinal, chars) {
  var base = chars.length;
  var buf = "";
  if (ordinal < 1) {
    return DecimalToText(ordinal);
  }
  do {
    ordinal--; // a == 0
    var cur = ordinal % base;
    buf = String.fromCharCode(chars[cur]) + buf;
    ordinal = Math.floor(ordinal / base);
  } while ( ordinal > 0);

  return buf;
};

function toListMark(i, depth) {
  if (depth == 1 || depth == 4) {
    return DecimalToText(i + 1);
  }
  if (depth == 2 || depth == 5) {
    return CharListToText(i + 1, gLowerAlphaChars);
  }
  if (depth == 3 || depth == 6) {
    return RomanToText(i + 1, "ixcm", "vld");
  }

  return DecimalToText(i + 1);
}

function fixup(innerHTML) {
  var tempbox = document.getElementById("tempbox");
  tempbox.innerHTML = innerHTML;

  var ols = document.getElementsByTagName("ol");
  Array.from(ols).forEach(function(ol) {
    var depth = getListDepth(ol);

    var i = 0;
    Array.from(ol.children).forEach(function(li) {
      if (li.nodeName.toLowerCase() == "li") {
        li.insertBefore(document.createTextNode(toListMark(i, depth) + ". "), li.firstChild);

        i++;
      }
    });
  });

  return tempbox.innerHTML;
}

function compare() {
  var id = document.getElementById("sec-list").value;

  var fromHTML = id in fromSecData.secData ? fromSecData.secData[id].html : null;
  var toHTML = id in toSecData.secData ? toSecData.secData[id].html : null;

  var result = document.getElementById("result");

  result.className = "";
  if (document.getElementById("view-diff").checked) {
    if (fromHTML !== null && toHTML !== null) {
      result.className = "diff-view";
      result.innerHTML = htmldiff(fixup(fromHTML), fixup(toHTML));
    } else if (fromHTML !== null) {
      result.className = "diff-view";
      result.innerHTML = htmldiff(fixup(fromHTML), "");
    } else if (toHTML !== null) {
      result.className = "diff-view";
      result.innerHTML = htmldiff("", fixup(toHTML));
    } else {
      result.innerHTML = "";
    }
  } else if (document.getElementById("view-from").checked) {
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

  var add = result.getElementsByClassName("htmldiff-add").length;
  var del = result.getElementsByClassName("htmldiff-del").length;

  var note = "";
  if (add == 0 && del == 0) {
    if (fromHTML != toHTML) {
      note = " (changes in markup or something)";
    }
  }

  document.getElementById("diff-stat").innerHTML = "+" + add + " " + "-" + del + note;
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

function filter() {
  var count;
  if (document.getElementById("sec-search").checked) {
    count = filterSearch();
  } else {
    count = filterChanged();
  }

  var hit = document.getElementById("search-hit");
  if (count != -1) {
    hit.innerHTML = count + " section(s) found";
  } else {
    hit.innerHTML = "";
  }

  compare();
}

function filterSearch() {
  var term = document.getElementById("sec-input").value;

  var value = "";
  var count = 0;

  var menu = document.getElementById("sec-list");
  Array.from(menu.children).forEach(function(opt) {
    if (opt.innerHTML.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
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

  if (term == "") {
    return -1;
  }

  return count;
}

function isChanged(id) {
  if (!(id in fromSecData.secData) || !(id in toSecData.secData)) {
    return true;
  }

  var fromHTML = fromSecData.secData[id].html;
  var toHTML = toSecData.secData[id].html;

  return fromHTML != toHTML;
}

function filterChanged() {
  var value = "";
  var count = 0;

  var menu = document.getElementById("sec-list");
  Array.from(menu.children).forEach(function(opt) {
    var sec = opt.value;
    if (opt.className != "same") {
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
