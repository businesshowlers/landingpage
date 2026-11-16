/**
 * Howlers Digitals — website leads → Google Sheet + email notification
 * Sheet: https://docs.google.com/spreadsheets/d/1rer5BCgg785D7dy2cr4mdPAEQmps2AlZd6x1eEuKSmI/edit
 * Setup steps: google-apps-script/SETUP.md
 */

var SHEET_ID = "1rer5BCgg785D7dy2cr4mdPAEQmps2AlZd6x1eEuKSmI";
var SHEET_NAME = "Leads";
var NOTIFY_EMAIL = "business.howlers@gmail.com";

var HEADERS = ["Timestamp", "Name", "Email", "Phone", "Service", "Plan", "Source", "Page", "Status"];

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.company_website) return json({ ok: true }); // spam trap

  var lead = {
    name: clean(p.name),
    email: clean(p.email),
    phone: clean(p.phone),
    service: clean(p.service),
    plan: clean(p.plan),
    source: clean(p.source),
    page: clean(p.page)
  };
  if (!lead.name || !lead.phone) return json({ ok: false, error: "missing fields" });

  // Save to the sheet and send the email independently: if one fails the
  // other still captures the lead, so it is never lost silently.
  var saved = false, mailed = false, errors = [];
  var lock = LockService.getScriptLock();
  var locked = lock.tryLock(10000);
  try {
    getSheet().appendRow([
      new Date(), lead.name, lead.email, lead.phone, lead.service,
      lead.plan, lead.source, lead.page, "New"
    ]);
    saved = true;
  } catch (err) {
    errors.push("sheet: " + err);
  } finally {
    if (locked) lock.releaseLock();
  }

  try {
    notify(lead, saved ? "" : "⚠️ Could not save this lead to the sheet — add it manually. (" + errors.join("; ") + ")");
    mailed = true;
  } catch (err) {
    errors.push("mail: " + err);
  }

  return json({ ok: saved || mailed, saved: saved, mailed: mailed, error: errors.join("; ") || undefined });
}

function doGet() {
  return json({ ok: true, message: "Howlers Digitals lead endpoint is running." });
}

function notify(lead, warning) {
  if (!NOTIFY_EMAIL) throw new Error("NOTIFY_EMAIL not set");
  var digits = lead.phone.replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  var rows = [
    ["Name", lead.name], ["Email", lead.email], ["Phone", lead.phone],
    ["Service", lead.service], ["Plan", lead.plan || "—"], ["Source", lead.source], ["Page", lead.page]
  ];
  var html =
    '<div style="font-family:Arial,sans-serif;max-width:520px">' +
    '<h2 style="margin:0 0 12px;color:#FF6B00">New website lead 🎉</h2>' +
    (warning ? '<p style="background:#fff3cd;padding:10px;border-radius:6px;color:#7a4b00">' + escapeHtml(warning) + "</p>" : "") +
    '<table style="border-collapse:collapse;width:100%">' +
    rows.map(function (r) {
      return '<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;width:90px">' + r[0] +
        '</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">' + escapeHtml(r[1]) + "</td></tr>";
    }).join("") +
    "</table>" +
    '<p style="margin-top:18px">' +
    '<a href="https://wa.me/' + digits + '" style="background:#25D366;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;margin-right:8px">WhatsApp lead</a>' +
    '<a href="tel:+' + digits + '" style="background:#FF6B00;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Call lead</a>' +
    "</p></div>";

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "🔥 New Lead: " + lead.name + " — " + (lead.plan || lead.service),
    htmlBody: html,
    replyTo: /@/.test(lead.email) ? lead.email : NOTIFY_EMAIL
  });
}

function getSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#FF6B00").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trim, cap length and neutralise spreadsheet formula injection.
function clean(v) {
  v = String(v || "").trim().slice(0, 1000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run this once from the Apps Script editor to test the sheet + email. */
function testLead() {
  doPost({ parameter: { name: "Test Lead", email: "test@example.com", phone: "9791718488", service: "Website Development", plan: "Advance Plan", source: "manual_test", page: "apps-script" } });
}
