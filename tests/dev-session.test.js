/** Frontend preview must not mint a fake admin session or expose dev tools. */
const { JSDOM } = require("jsdom");
const fs = require("fs");
const ROOT = require("path").join(__dirname, "..");
const { adminScripts } = require("./helpers/page-scripts.js");
const html = fs.readFileSync(ROOT + "/html/admin.html", "utf8");
const dom = new JSDOM(html, { url: "http://localhost/html/admin.html", runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
const store = {};
Object.defineProperty(window, "localStorage", { value: {
  getItem: (key) => key in store ? store[key] : null,
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
}, configurable: true });
window.appApi = { auth: { logout: async () => {} }, admin: {
  users: { list: async () => [] }, products: { list: async () => [] },
  orders: { list: async () => [] }, messages: { list: async () => [] },
  notifications: { list: async () => [] }, ads: { list: async () => [] },
  settings: { get: async () => ({}), save: async () => ({}) },
} };
const source = adminScripts().map((file) => fs.readFileSync(ROOT + "/scripts/" + file, "utf8")).join("\n;\n");
window.scrollTo = () => {};
window.eval(source + "\nwindow.__gate = requireAdminSession;");
if (window.__gate() !== true) throw new Error("frontend preview should remain viewable");
if (store.benamacademySession) throw new Error("frontend must not mint a fake session");
if (window.adminDev) throw new Error("development role backdoor must not be exposed");
console.log("✓ preview opens without creating fake auth state");
console.log("✓ adminDev backdoor is absent");
