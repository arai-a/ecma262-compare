function bodyOnLoad() {
  let fromRev = document.getElementById("from-rev");
  let toRev = document.getElementById("to-rev");
  populateRevs(fromRev);
  populateRevs(toRev);

  document.getElementById("compare").disabled = true;

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
    let from = queryParams.from;
    let to = queryParams.to;
    let id = queryParams.id;

    fromRev.value = from;
    toRev.value = to;

    update().then(() => {
      let menu = document.getElementById("sec-list");
      menu.value = id;
      compare();
    });
  }
}

function populateRevs(menu) {
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  for (let [date, rev] of revs) {
    let opt = document.createElement("option");
    opt.value = rev;
    opt.appendChild(document.createTextNode(rev + " (" + date + ")"));
    menu.appendChild(opt);
  }
}

function updateFrame(id) {
  let hash = hashOf(id);
  let frame = document.getElementById(id + "-frame");
  if (frame.getAttribute("current-hash") == hash) {
      return Promise.resolve(frame);
  }
  frame.setAttribute("current-hash", hash);

  return new Promise(resolve => {
    let f = function() {
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
  let list = [];
  let map = new Map();
  for (let nodes of [doc.getElementsByTagName("EMU-CLAUSE"),
                     doc.getElementsByTagName("EMU-ANNEX")]) {
    for (let node of nodes) {
      if ("id" in node && node.id.startsWith("sec-")) {
        list.push(node.id);

        let h1s = node.getElementsByTagName("h1");
        if (h1s.length) {
          let title = h1s[0].innerText;

          title = title.replace(/([A-Z0-9][0-9.]*)/, "$1 ").replace(/#$/, "");

          map.set(node.id, title);
        }
      }
    }
  }

  return [list, map];
}

function updateSecList(fromDoc, toDoc) {
  let hit = document.getElementById("search-hit");
  hit.innerHTML = "";

  let menu = document.getElementById("sec-list");
  while (menu.firstChild) {
    menu.firstChild.remove();
  }

  let [fromSecList, fromTitleMap] = getSecList(fromDoc);
  let [toSecList, toTitleMap] = getSecList(toDoc);

  let fromSet = new Set(fromSecList);
  let toSet = new Set(toSecList);
  let set = new Set(fromSecList.concat(toSecList));

  let s = (a, b) => {
    let aTitle = getComparableTitle(a);
    let bTitle = getComparableTitle(b);
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

  function getComparableTitle(sec) {
    let t = getTitle(sec);
    return t.replace(/([0-9]+)/g, matched => String.fromCharCode(matched));
  }

  for (let sec of [...set].sort(s)) {
    let opt = document.createElement("option");
    opt.value = sec;

    let stat = "same";

    if (fromSet.has(sec)) {
      if (!toSet.has(sec)) {
        stat = "del";
      }
    } else {
      stat = "add";
    }

    let title = getTitle(sec);

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
    let fromDoc = fromFrame.contentDocument;
    let toDoc = toFrame.contentDocument;
    updateSecList(fromDoc, toDoc);
    document.getElementById("update").disabled = false;
    document.getElementById("compare").disabled = false;
  });
}

function compare() {
  let id = document.getElementById("sec-list").value;

  let fromFrame = document.getElementById("from-frame");
  let toFrame = document.getElementById("to-frame");

  let fromDoc = fromFrame.contentDocument;
  let toDoc = toFrame.contentDocument;

  let fromNode = fromDoc.getElementById(id);
  let toNode = toDoc.getElementById(id);

  let result = document.getElementById("result");

  if (fromNode && toNode) {
    result.innerHTML = htmldiff(fromNode.innerHTML, toNode.innerHTML);
  } else if (fromNode) {
    result.innerHTML = htmldiff(fromNode.innerHTML, "");
  } else if (toNode) {
    result.innerHTML = htmldiff("", toNode.innerHTML);
  } else {
    result.innerHTML = "";
  }

  let add = result.getElementsByClassName("htmldiff-add").length;
  let del = result.getElementsByClassName("htmldiff-del").length;

  document.getElementById("diff-stat").innerHTML = "+" + add + " " + "-" + del;
}

function updateURL() {
  let id = document.getElementById("sec-list").value;

  window.location.hash
    = "#from=" + hashOf("from")
    + "&to=" + hashOf("to")
    + "&id=" + encodeURIComponent(id);
}

function search() {
  let term = document.getElementById("sec-input").value;

  let value = "";
  let count = 0;

  let menu = document.getElementById("sec-list");
  for (let opt of menu.children) {
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

  let hit = document.getElementById("search-hit");
  hit.innerHTML = count + " section(s) found";

  compare();
}
