# Google Sheet se form connect karna (5 minute)

Sheet: https://docs.google.com/spreadsheets/d/1rer5BCgg785D7dy2cr4mdPAEQmps2AlZd6x1eEuKSmI/edit
Notification email: business.howlers@gmail.com

1. Upar wali Sheet kholo (usi Google account se jiske paas edit access hai).
2. Menu me **Extensions → Apps Script** pe click karo.
3. Jo code pehle se hai use delete karo, aur `Code.gs` ka pura code paste karo. **Save** (Ctrl+S).
4. Upar function dropdown me **testLead** select karo → **Run**.
   - Permission maangega → **Review permissions** → apna account → **Advanced → Go to project (unsafe) → Allow**.
   - Sheet me "Leads" tab ban jayega with a test row, aur business.howlers@gmail.com pe email aayega. ✅
5. **Deploy → New deployment** → gear icon → **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy** → **Web app URL** copy karo (ending `/exec`).
6. `assets/js/config.js` kholo aur URL paste karo:
   ```js
   sheetEndpoint: "https://script.google.com/macros/s/XXXXXXXX/exec",
   ```
7. Website pe form fill karke test karo → Sheet me row + email notification aana chahiye.

**Baad me script edit kiya?** Deploy → Manage deployments → ✏️ Edit → Version: **New version** → Deploy (URL same rahega).
