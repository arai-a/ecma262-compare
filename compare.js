function bodyOnLoad() {
  var fromRev = document.getElementById("from-rev");
  var toRev = document.getElementById("to-rev");
  populateRevs(fromRev);
  populateRevs(toRev);

  document.getElementById("compare").disabled = true;
  document.getElementById("view-diff").checked = true;

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

  if ("from" in queryParams && "to" in queryParams && "id" in queryParams) {
    var from = queryParams.from;
    var to = queryParams.to;
    var id = queryParams.id;

    fromRev.value = from;
    toRev.value = to;

    update().then(function() {
      var menu = document.getElementById("sec-list");
      menu.value = id;
      compare();
    });
  }
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
}

function updateFrame(id) {
  var hash = hashOf(id);
  var frame = document.getElementById(id + "-frame");
  if (frame.getAttribute("current-hash") == hash) {
    return Promise.resolve(frame);
  }
  frame.setAttribute("current-hash", hash);

  return new Promise(function(resolve) {
    var f = function() {
      frame.removeEventListener("load", f);
      frame.setAttribute("current-hash", hash);
      resolve(frame);
    };
    frame.addEventListener("load", f);
    frame.src = "./history/" + hash + ".html";
  });
}

function hashOf(id) {
  return document.getElementById(id + "-rev").value;
}

function getSecList(doc) {
  var list = [];
  var map = new Map();
  var emus = [doc.getElementsByTagName("EMU-CLAUSE"),
              doc.getElementsByTagName("EMU-ANNEX")];
  emus.forEach(function(nodes) {
    Array.from(nodes).forEach(function(node) {
      if ("id" in node && node.id.startsWith("sec-")) {
        list.push(node.id);

        var h1s = node.getElementsByTagName("h1");
        if (h1s.length) {
          var title = h1s[0].innerText;

          title = title.replace(/([A-Z0-9][0-9.]*)/, "$1 ").replace(/#$/, "");

          map.set(node.id, title);
        }
      }
    });
  });

  return [list, map];
}

function updateSecList(fromDoc, toDoc) {
  var hit = document.getElementById("search-hit");
  hit.innerHTML = "";

  var menu = document.getElementById("sec-list");
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  var tmp = getSecList(fromDoc);
  var fromSecList = tmp[0], fromTitleMap = tmp[1];

  tmp = getSecList(toDoc);
  var toSecList = tmp[0], toTitleMap = tmp[1];

  var fromSet = new Set(fromSecList);
  var toSet = new Set(toSecList);
  var set = new Set(fromSecList.concat(toSecList));

  var s = function(a, b) {
    var aTitle = getComparabvaritle(a);
    var bTitle = getComparabvaritle(b);
    if (aTitle == bTitle) {
      return 0;
    }
    return aTitle < bTitle ? -1 : 1;
  };

  function getTitle(sec) {
    if (toTitleMap.has(sec)) {
      return toTitleMap.get(sec);
    }

    if (fromTitleMap.has(sec)) {
      return fromTitleMap.get(sec);
    }

    return "";
  }

  function getComparabvaritle(sec) {
    var t = getTitle(sec);
    return t.replace(/([0-9]+)/g, function(matched) {
      return String.fromCharCode(matched);
    });
  }

  Array.from(set).sort(s).forEach(function(sec) {
    var opt = document.createElement("option");
    opt.value = sec;

    var stat = "same";

    if (fromSet.has(sec)) {
      if (!toSet.has(sec)) {
        stat = "del";
      }
    } else {
      stat = "add";
    }

    var title = getTitle(sec);

    if (title) {
      opt.appendChild(document.createTextNode(title.slice(0, 100)));
    } else {
      opt.appendChild(document.createTextNode(sec));
    }
    opt.className = stat;
    menu.appendChild(opt);
  });
}

function update() {
  document.getElementById("update").disabled = true;
  document.getElementById("result").innerHTML = "";
  document.getElementById("diff-stat").innerHTML = "";

  return Promise.all([
    updateFrame("from"),
    updateFrame("to")
  ]).then(function(tmp) {
    var fromFrame = tmp[0], toFrame = tmp[1];
    var fromDoc = fromFrame.contentDocument;
    var toDoc = toFrame.contentDocument;
    updateSecList(fromDoc, toDoc);
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
    console.log(depth);

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

  var fromFrame = document.getElementById("from-frame");
  var toFrame = document.getElementById("to-frame");

  var fromDoc = fromFrame.contentDocument;
  var toDoc = toFrame.contentDocument;

  var fromNode = fromDoc.getElementById(id);
  var toNode = toDoc.getElementById(id);

  var result = document.getElementById("result");

  result.className = "";
  if (document.getElementById("view-diff").checked) {
    if (fromNode && toNode) {
      result.className = "diff-view";
      result.innerHTML = htmldiff(fixup(fromNode.innerHTML), fixup(toNode.innerHTML));
    } else if (fromNode) {
      result.className = "diff-view";
      result.innerHTML = htmldiff(fixup(fromNode.innerHTML), "");
    } else if (toNode) {
      result.className = "diff-view";
      result.innerHTML = htmldiff("", fixup(toNode.innerHTML));
    } else {
      result.innerHTML = "";
    }
  } else if (document.getElementById("view-from").checked) {
    if (fromNode) {
      result.innerHTML = fromNode.innerHTML;
    } else {
      result.innerHTML = "";
    }
  } else if (document.getElementById("view-to").checked) {
    if (toNode) {
      result.innerHTML = toNode.innerHTML;
    } else {
      result.innerHTML = "";
    }
  } else {
      result.innerHTML = "";
  }

  var add = result.getElementsByClassName("htmldiff-add").length;
  var del = result.getElementsByClassName("htmldiff-del").length;

  document.getElementById("diff-stat").innerHTML = "+" + add + " " + "-" + del;
}

function updateURL() {
  var id = document.getElementById("sec-list").value;

  window.location.hash
    = "#from=" + hashOf("from")
    + "&to=" + hashOf("to")
    + "&id=" + encodeURIComponent(id);
}

function search() {
  var term = document.getElementById("sec-input").value;

  var value = "";
  var count = 0;

  var menu = document.getElementById("sec-list");
  Array.from(menu.children).forEach(function(opt) {
    if (opt.innerHTML.toLowerCase().contains(term.toLowerCase())) {
      if (!value) {
        value = opt.value;
      }
      opt.style.display = "";
      count++;
    } else {
      opt.style.display = "none";
    }
  });

  menu.value = value;

  var hit = document.getElementById("search-hit");
  hit.innerHTML = count + " section(s) found";

  compare();
}
