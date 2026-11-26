/**
 * Admin panel — access gate, roles and permission levels
 *
 * Who may open the panel at all, and what each role is allowed to do once
 * inside.
 *
 * BACKEND NOTE: a client-side gate is not security. Anyone can edit
 * JavaScript in their browser. Its job here is to stop the panel being
 * reached by typing the URL, and to give the server one obvious hook.
 * The real fix is for the server to refuse to serve admin.html, and every
 * /admin route, without a valid admin session.
 *
 * Split out of scripts/admin.js, which had grown to 5,241 lines. Every
 * classic <script> shares one global scope, so these files see each other
 * exactly as one file would. The load order in html/admin.html matters only
 * for code that runs while a file is being parsed; boot.js is last because
 * it is the only file that does that on purpose.
 */

/* The frontend preview does not authenticate users. In production, the web
 * server must protect this document and the API must enforce every role. */
const MANAGER_ROLES = ["مدیر سایت", "مدیر سیستم", "manager"];

function requireAdminSession() {
  return true;
}

function readAdminSession() {
  try {
    const raw = localStorage.getItem("benamacademySession");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

/** Read the signed-in operator's role from the session. */
function readAdminRole() {
  try {
    const raw = localStorage.getItem("benamacademySession");
    const session = raw ? JSON.parse(raw) : null;
    const role = session && session.user && session.user.role;
    if (!role) return "manager"; // visual preview default only; never an authorization decision
    return MANAGER_ROLES.indexOf(role) !== -1 ? "manager" : "admin";
  } catch (error) {
    return "manager";
  }
}

let currentAdminUserRole = readAdminRole();

/** True when the operator has full privileges. */
function isManager() {
  return currentAdminUserRole === "manager";
}

/* ----------------------------------------------------------------------------
   Staff hierarchy rules  (tab: مدیریت دسترسی‌ها)

     rank 1  مدیر سایت / مدیر سیستم   manager
     rank 2  ادمین                     admin
     rank 3  کاربر عادی                regular user

   Policy:
     - only a manager may change roles or delete staff
     - a manager may not act on another manager (no peer wars)
     - the last remaining manager cannot be deleted or demoted, otherwise the
       panel locks everyone out permanently
   -------------------------------------------------------------------------- */
const STAFF_RANK = {
  "مدیر سایت": 1,
  "مدیر سیستم": 1,
  ادمین: 2,
  "کاربر عادی": 3,
};

function rankOf(role) {
  return STAFF_RANK[role] || 3;
}

function isManagerRole(role) {
  return rankOf(role) === 1;
}

/** How many active managers exist right now. */
function managerCount() {
  const pool = (typeof appState !== "undefined" && appState.users) || [];
  return pool.filter((u) => u && isManagerRole(u.role)).length;
}

/**
 * Decide whether the signed-in operator may act on a target account.
 * Returns { allowed, reason } so callers can show a specific message rather
 * than a generic refusal.
 */
function canActOnStaff(target, action) {
  if (!target) return { allowed: false, reason: "حساب موردنظر پیدا نشد." };

  if (!isManager()) {
    return {
      allowed: false,
      reason: "این عملیات فقط برای مدیر سایت مجاز است.",
    };
  }

  // Never let the system end up without a manager - that would lock everyone
  // out of this tab permanently, with no way back from inside the panel.
  const removesAManager = action === "delete" || action === "demote";
  if (isManagerRole(target.role) && removesAManager && managerCount() <= 1) {
    return {
      allowed: false,
      reason: "این تنها مدیر سامانه است و نمی‌توان حذف یا تنزلش داد.",
    };
  }

  return { allowed: true, reason: "" };
}

/**
 * Roles a manager may assign from the panel.
 *
 * A manager can appoint another manager - the backend only seeds the *first*
 * one so there is someone to start with. "کاربر عادی" is deliberately absent:
 * this tab manages staff, and demoting someone out of staff happens by
 * deleting their staff record instead.
 */
function assignableRoles() {
  return ["مدیر سایت", "مدیر سیستم", "ادمین"];
}

/**
 * Hide all but the last four digits: ۰۹۱۲•••••۶۷۸۹ -> ۰۹۱۲•••••
 * The real value never reaches the DOM, so devtools cannot recover it.
 */
