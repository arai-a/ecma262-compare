"use strict";

// ==== BEGIN: copied and modified from wasm-pack binding ====

let wasm;

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
  if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
    cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachegetUint8Memory0;
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1);
  getUint8Memory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
  if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
    cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachegetInt32Memory0;
}

function getArrayU8FromWasm0(ptr, len) {
  return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

/**
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
/* exported decompress */
async function decompress(data) {
  if (!wasm) {
    await init();
  }

  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.decompress(retptr, ptr0, len0);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var v1 = getArrayU8FromWasm0(r0, r1).slice();
    wasm.__wbindgen_free(r0, r1 * 1);
    return v1;
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

async function load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        if (module.headers.get("Content-Type") !== "application/wasm") {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

        } else {
          throw e;
        }
      }
    }

    const bytes = await module.arrayBuffer();
    return WebAssembly.instantiate(bytes, imports);
  }

  const instance = await WebAssembly.instantiate(module, imports);

  if (instance instanceof WebAssembly.Instance) {
    return { instance, module };
  }

  return instance;
}

async function init() {
  const input = fetch("js/gunzip.wasm");

  const imports = {};
  const { instance, module } = await load(await input, imports);

  wasm = instance.exports;
  init.__wbindgen_wasm_module = module;

  return wasm;
}

// ==== END ====

/* exported DateUtils */
class DateUtils {
  static toReadable(d) {
    try {
      const date = new Date(d);
      return date.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    } catch (e) {
      return d;
    }
  }

  static toRelativeTime(d) {
    try {
      const date = new Date(d);
      const now = new Date();
      const sec = Math.floor(now.getTime() - date.getTime()) / 1000;
      if (sec < 0) {
        return "";
      }
      if (sec <= 1) {
        return "now, ";
      }
      if (sec < 60) {
        return `${sec} seconds ago, `;
      }
      const min = Math.floor(sec / 60);
      if (min === 1) {
        return "1 minute ago, ";
      }
      if (min < 60) {
        return `${min} minutes ago, `;
      }
      const hour = Math.floor(min / 60);
      if (hour === 1) {
        return "1 hour ago, ";
      }
      if (hour < 24) {
        return `${hour} hours ago, `;
      }
      const day = Math.floor(hour / 24);
      if (day === 1) {
        return "yesterday, ";
      }
      return `${day} days ago, `;
    } catch (e) {
      return "";
    }
  }
}

/* exported Base */
class Base {
  async loadResources() {
    [this.revs, this.prs] = await Promise.all([
      this.getJSON("./history/revs.json"),
      this.getJSON("./history/prs.json"),
    ]);

    this.revMap = {};
    for (const rev of this.revs) {
      this.revMap[rev.hash] = rev;
    }

    this.prMap = {};
    for (const pr of this.prs) {
      pr.parent = this.getFirstParent(pr.revs[pr.revs.length-1]);
      this.prMap[pr.number] = pr;
    }
  }

  // Return the first parent of `rev`.
  // `rev.parents` can contain multiple hash if it's a merge.
  getFirstParent(rev) {
    return rev.parents.split(" ")[0];
  }

  async getJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
      return undefined;
    }
    return response.json();
  }

  async getJSON_GZ(path) {
    const response = await fetch(path);
    if (!response.ok) {
      return undefined;
    }
    const buf = await response.arrayBuffer();
    const arr = await decompress(new Uint8Array(buf));
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(arr));
  }

  async getTextGZ(path) {
    const response = await fetch(path);
    if (!response.ok) {
      return undefined;
    }
    const buf = await response.arrayBuffer();
    const arr = await decompress(new Uint8Array(buf));
    const decoder = new TextDecoder();
    return decoder.decode(arr);
  }
}
