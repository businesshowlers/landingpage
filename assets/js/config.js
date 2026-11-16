/* =========================================================
   HOWLERS DIGITALS — SITE SETTINGS
   ========================================================= */
window.SITE_CONFIG = {
  // WhatsApp + call number (country code + number, digits only)
  whatsappNumber: "919791718488",
  whatsappMessage: "Hi Howlers Digitals, I'd like a free consultation for my website.",
  phone: "+919791718488",

  // Google Apps Script Web App URL (see google-apps-script/SETUP.md)
  // Example: "https://script.google.com/macros/s/AKfycb.../exec"
  sheetEndpoint: "https://script.google.com/macros/s/AKfycbwIvLyK1NN0a4mDO9PphoBkY2PhxFTIZfiqp60iTOS9Eybm40Rg6vWhr3xSFh80PRMWkw/exec",

  // Page shown after a form is submitted
  thankYouUrl: "thank-you.html",

  // Auto popup (shown once per visit, never after a lead is submitted)
  popupFirstDelay: 25000,  // ms after page load…
  popupScrollDepth: 0.5,   // …or when the visitor has scrolled 50% of the page (0 = off)
  popupMaxAuto: 1,         // max automatic popups per browser session
  popupSecondDelay: 0      // ms after closing to show again (0 = never); needs popupMaxAuto ≥ 2
};
