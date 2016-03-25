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

    update().then(() => {
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

  for (var [date, rev] of revs) {
    var opt = document.createElement("option");
    opt.value = rev;
    opt.appendChild(document.createTextNode(rev + " (" + date + ")"));
    menu.appendChild(opt);
  }
}

function updateFrame(id) {
  var hash = hashOf(id);
  var frame = document.getElementById(id + "-frame");
  if (frame.getAttribute("current-hash") == hash) {
      return Promise.resolve(frame);
  }
  frame.setAttribute("current-hash", hash);

  return new Promise(resolve => {
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
  for (var nodes of [doc.getElementsByTagName("EMU-CLAUSE"),
                     doc.getElementsByTagName("EMU-ANNEX")]) {
    for (var node of Array.from(nodes)) {
      if ("id" in node && node.id.startsWith("sec-")) {
        list.push(node.id);

        var h1s = node.getElementsByTagName("h1");
        if (h1s.length) {
          var title = h1s[0].innerText;

          title = title.replace(/([A-Z0-9][0-9.]*)/, "$1 ").replace(/#$/, "");

          map.set(node.id, title);
        }
      }
    }
  }

  return [list, map];
}

function updateSecList(fromDoc, toDoc) {
  var hit = document.getElementById("search-hit");
  hit.innerHTML = "";

  var menu = document.getElementById("sec-list");
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  var [fromSecList, fromTitleMap] = getSecList(fromDoc);
  var [toSecList, toTitleMap] = getSecList(toDoc);

  var fromSet = new Set(fromSecList);
  var toSet = new Set(toSecList);
  var set = new Set(fromSecList.concat(toSecList));

  var s = (a, b) => {
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
    return t.replace(/([0-9]+)/g, matched => String.fromCharCode(matched));
  }

  for (var sec of [...set].sort(s)) {
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
  }
}

function update() {
  document.getElementById("update").disabled = true;
  document.getElementById("result").innerHTML = "";
  document.getElementById("diff-stat").innerHTML = "";

  return Promise.all([
    updateFrame("from"),
    updateFrame("to")
  ]).then(([fromFrame, toFrame]) => {
    var fromDoc = fromFrame.contentDocument;
    var toDoc = toFrame.contentDocument;
    updateSecList(fromDoc, toDoc);
    document.getElementById("update").disabled = false;
    document.getElementById("compare").disabled = false;
  });
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

  if (document.getElementById("view-diff").checked) {
    if (fromNode && toNode) {
      result.innerHTML = htmldiff(fromNode.innerHTML, toNode.innerHTML);
    } else if (fromNode) {
      result.innerHTML = htmldiff(fromNode.innerHTML, "");
    } else if (toNode) {
      result.innerHTML = htmldiff("", toNode.innerHTML);
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
  for (var opt of Array.from(menu.children)) {
    if (opt.innerHTML.toLowerCase().contains(term.toLowerCase())) {
      if (!value) {
        value = opt.value;
      }
      opt.style.display = "";
      count++;
    } else {
      opt.style.display = "none";
    }
  }

  menu.value = value;

  var hit = document.getElementById("search-hit");
  hit.innerHTML = count + " section(s) found";

  compare();
}
