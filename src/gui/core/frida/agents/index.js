// Misc
const env = require('./misc/env.js');
const info = require('./misc/info.js');
const frida = require('./misc/frida.js');
const type = require('./misc/type.js');
const pinning = require('./misc/pinning.js');

// Filesystem
const pwd = require('./filesystem/pwd.js');
const path = require('./filesystem/path.js');
const ls = require('./filesystem/ls.js');
const exists = require('./filesystem/exists.js');
const download = require('./filesystem/download.js');
const upload = require('./filesystem/upload.js');
const is_file = require('./filesystem/is_file.js');
const writable = require('./filesystem/writable.js');
const readable = require('./filesystem/readable.js');
const del = require('./filesystem/delete.js');
const mkdir = require('./filesystem/mkdir.js');

// UI
const alert = require('./ui/alert.js');
const uidump = require('./ui/dump');
const pasteboard = require('./ui/pasteboard.js');
const screenshot = require('./ui/screenshot.js');

// Root
const disable = require('./root/disable.js');
const simulate = require('./root/simulate.js');

// // Memory
// const search = require('./memory/search.js');
// const write = require('./memory/write.js');
const dump = require('./memory/dump.js');

// // Keychain
const key_clear = require('./keychain/clear.js');
const key_dump = require('./keychain/dump.js');


// // Hooking
// const dump_arguments = require('./hooking/dump_arguments.js');
// const list_activities = require('./hooking/list_activities.js');
// const list_broadcast_receiver = require('./hooking/list_broadcast_receivers.js');
const list_class_methods = require('./hooking/list_class_methods.js');
const list_classes = require('./hooking/list_classes.js');
const list_modules = require('./hooking/list_modules.js');
const list_exports = require('./hooking/list_exports.js');
const list_imports = require('./hooking/list_imports.js');
// const list_services = require('./hooking/list_services.js');
// const search_class = require('./hooking/search_class.js');
// const search_method = require('./hooking/search_method.js');
// const set_return = require('./hooking/set_return.js');
// const watch_class_methods = require('./hooking/watch_class_methods.js');
// const watch_method = require('./hooking/watch_method.js');


rpc.exports = {
  // Misc
  env: env,
  info: info,
  frida: frida,
  type: type,
  pinning:pinning,

  // Filesystem
  pwd: pwd,
  path: path,
  ls: ls,
  exists: exists,
  download: download,
  upload: upload,
  delete: del,
  isFile: is_file,
  writable: writable,
  readable: readable,
  mkdir: mkdir,

  // UI
  alert: alert,
  uidump: uidump,
  pasteboard: pasteboard,
  screenshot: screenshot,

  //Root
  disable: disable,
  simulate: simulate,

  // Memory
  dump: dump,

  // KeyChain
  key_clear: key_clear,
  key_dump: key_dump,

  // Hooking
  list_class_methods: list_class_methods,
  list_classes: list_classes,
  list_modules: list_modules,
  list_imports: list_imports,
  list_exports: list_exports

};
