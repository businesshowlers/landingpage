# Howlers Digitals — Website Plans Landing Page

Live: **https://offer.howlers.in**

Plain HTML + CSS + JavaScript (no build step). Leads go to Google Sheets via Google Apps Script, with an email alert to business.howlers@gmail.com. Google Tag Manager: `GTM-NW4J6R95`.

```
index.html                  landing page
thank-you.html              shown after every form submit (popup + contact form)
assets/css/styles.css       all styles (mobile-first) + animations
assets/js/config.js         WhatsApp/phone, Google Sheet URL, popup timings
assets/js/main.js           popup, clean URLs, forms → Sheet → thank-you, animations
assets/img/logo-mark.svg    logo mark (placeholder — replace with the official logo)
.htaccess                   Hostinger: HTTPS, clean URLs (/services …), caching, blocks dev files
robots.txt, sitemap.xml     SEO
google-apps-script/         Code.gs + SETUP.md for the Google Sheet backend (not served publicly)
dev-server.py               local preview with clean URLs
```

## Deploy to Hostinger
1. hPanel → Websites → offer.howlers.in → **Files / Git**.
2. Either connect this repo under **Advanced → Git** (branch `main`, install path `public_html`) and click **Deploy**,
   or upload all files (including the hidden `.htaccess`) into `public_html` with File Manager.
3. Open https://offer.howlers.in/services — it should show the landing page (confirms `.htaccess` works).

**After changing CSS/JS:** bump `?v=1.0.0` in `index.html` and `thank-you.html` so visitors get the new files.

## Tracking (GTM dataLayer events)
| Event | When |
|---|---|
| `lead_thank_you` | thank-you page, once per real submission — use as the conversion |
| `generate_lead` | form submitted |
| `popup_open` | popup shown (`popup_source`) |
| `form_start` | first keystroke in a form |
| `whatsapp_click` | any WhatsApp button |
| `cta_click` | other buttons (`cta_id`) |

## Run locally
```
python dev-server.py
```
Then open http://localhost:5510
