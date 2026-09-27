(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var doc = document;
  var $ = function (s, ctx) { return (ctx || doc).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var html = doc.documentElement;
  html.classList.add("js");

  window.dataLayer = window.dataLayer || [];
  function track(event, params) {
    var payload = { event: event };
    for (var k in params) payload[k] = params[k];
    window.dataLayer.push(payload);
  }

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  /* ---------- Links from config ---------- */
  function waLink(text) {
    return "https://wa.me/" + String(CFG.whatsappNumber || "").replace(/\D/g, "") +
      "?text=" + encodeURIComponent(text || CFG.whatsappMessage || "");
  }
  $$("[data-wa]").forEach(function (a) { a.href = waLink(); a.target = "_blank"; a.rel = "noopener"; });
  $$("[data-tel]").forEach(function (a) { if (CFG.phone) a.href = "tel:" + CFG.phone; });
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Clean section URLs: /services, /website-plans, ... (no #hash) ---------- */
  var ROUTES = {
    "": "top",
    "services": "services",
    "website-plans": "plans",
    "portfolio": "work",
    "why-custom-code": "why-custom",
    "process": "process",
    "faq": "faq",
    "contact": "contact"
  };
  var slugOf = {};
  for (var s in ROUTES) slugOf[ROUTES[s]] = s;

  // Works at the domain root or inside a sub-folder: BASE is everything before the slug.
  var lastSeg = location.pathname.split("/").pop();
  var startId = lastSeg && ROUTES.hasOwnProperty(lastSeg) ? ROUTES[lastSeg] : null;
  var BASE = startId ? location.pathname.slice(0, -lastSeg.length) : location.pathname.replace(/[^/]*$/, "");

  function routeFromHref(href) {
    if (!href) return null;
    if (href.charAt(0) === "#") { var h = href.slice(1); return slugOf.hasOwnProperty(h) ? h : null; }
    var seg = href.replace(/^\.?\//, "").replace(/\/$/, "");
    return ROUTES.hasOwnProperty(seg) ? ROUTES[seg] : null;
  }

  function scrollToId(id, instant) {
    var target = id && id !== "top" ? doc.getElementById(id) : null;
    var top = target ? target.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(html).scrollPaddingTop, 10) || 0) : 0;
    // "instant" (not "auto"): html has scroll-behavior:smooth, which "auto" would inherit
    window.scrollTo({ top: top, behavior: instant || reduceMotion ? "instant" : "smooth" });
  }

  function goTo(id) {
    var url = BASE + slugOf[id] + location.search;
    if (location.pathname + location.search !== url) history.pushState({ section: id }, "", url);
    scrollToId(id);
  }

  // Old #hash links → clean path
  if (location.hash && slugOf.hasOwnProperty(location.hash.slice(1))) {
    startId = location.hash.slice(1);
    history.replaceState({ section: startId }, "", BASE + slugOf[startId] + location.search);
  } else if (location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
  }

  // Opened directly on /services etc. → jump to that section
  if (startId && startId !== "top") {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    var jump = function () { scrollToId(startId, true); };
    window.addEventListener("load", function () { jump(); setTimeout(jump, 150); });
  }

  window.addEventListener("popstate", function () {
    var seg = location.pathname.split("/").pop();
    scrollToId(ROUTES.hasOwnProperty(seg) ? ROUTES[seg] : "top");
  });

  doc.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    if (a.hasAttribute("data-popup")) {
      e.preventDefault();
      openModal({ plan: a.getAttribute("data-plan"), source: "popup_" + (a.getAttribute("data-track") || "cta") });
      return;
    }
    var id = routeFromHref(a.getAttribute("href"));
    if (!id) return;
    e.preventDefault();
    goTo(id);
  });

  // Highlight the header link of the section on screen
  if ("IntersectionObserver" in window) {
    var navLinks = $$(".nav a");
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.toggle("is-active", routeFromHref(l.getAttribute("href")) === en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["services", "plans", "work", "why-custom", "process", "faq", "contact"].forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- Click tracking (GTM-ready) ---------- */
  doc.addEventListener("click", function (e) {
    var el = e.target.closest("[data-track], [data-wa]");
    if (!el) return;
    track(el.hasAttribute("data-wa") ? "whatsapp_click" : "cta_click", { cta_id: el.getAttribute("data-track") || "whatsapp" });
  });

  /* ---------- Header + scroll progress ---------- */
  var header = $(".header");
  var bar = $(".progress span");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    var max = html.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("load", onScroll);

  /* ---------- Scroll lock shared by drawer + modal ---------- */
  var locks = 0;
  function lockScroll(on) {
    locks = Math.max(0, locks + (on ? 1 : -1));
    html.classList.toggle("no-scroll", locks > 0);
  }

  function trapTab(e, container) {
    if (e.key !== "Tab") return;
    var f = $$("a[href], button:not([disabled]), input:not([type=hidden]):not([tabindex='-1']), select, textarea", container)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Mobile drawer ---------- */
  var drawer = $("#drawer");
  var menuBtn = $(".header .menu-btn");
  var drawerReturn = null;

  function openDrawer() {
    drawerReturn = doc.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
    lockScroll(true);
    setTimeout(function () { $(".menu-btn--close", drawer).focus(); }, 60);
  }
  function closeDrawer() {
    if (!drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    lockScroll(false);
    if (drawerReturn) drawerReturn.focus({ preventScroll: true });
  }
  menuBtn.addEventListener("click", openDrawer);
  $$("[data-close]", drawer).forEach(function (el) { el.addEventListener("click", closeDrawer); });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", function (m) { if (m.matches) closeDrawer(); });

  /* ---------- Lead popup ---------- */
  var modal = $("#lead-modal");
  var modalPanel = $(".modal__panel", modal);
  var modalTitle = $("#modal-title");
  var modalForm = $(".lead-form", modal);
  var modalReturn = null;
  var autoShown = 0;
  var autoTimer = null;

  function isOpen(el) { return el.classList.contains("is-open"); }

  function openModal(opts) {
    opts = opts || {};
    clearTimeout(autoTimer);
    if (isOpen(drawer)) closeDrawer();
    modalReturn = doc.activeElement;
    modalForm.dataset.source = opts.source || "popup";
    setPlan(modalForm, opts.plan || "");
    if (opts.plan) modalTitle.innerHTML = 'Get the <span class="text-grad">' + opts.plan + "</span>";
    else modalTitle.innerHTML = modalTitle.getAttribute("data-default");

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    lockScroll(true);
    track("popup_open", { popup_source: modalForm.dataset.source });
    // Autofocus on desktop only: on phones the keyboard would cover the sheet.
    if (window.matchMedia("(min-width: 768px)").matches) {
      setTimeout(function () { $("input[name=name]", modalForm).focus({ preventScroll: true }); }, 320);
    } else {
      setTimeout(function () { modalPanel.focus({ preventScroll: true }); }, 50);
    }
  }

  function closeModal() {
    if (!isOpen(modal)) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    lockScroll(false);
    if (modalReturn && modalReturn.focus) modalReturn.focus({ preventScroll: true });
    scheduleAuto(CFG.popupSecondDelay || 15000);
  }

  $$("[data-modal-close]", modal).forEach(function (el) { el.addEventListener("click", closeModal); });

  doc.addEventListener("keydown", function (e) {
    if (isOpen(modal)) {
      if (e.key === "Escape") closeModal();
      trapTab(e, modalPanel);
    } else if (isOpen(drawer)) {
      if (e.key === "Escape") closeDrawer();
      trapTab(e, $(".drawer__panel", drawer));
    }
  });

  // Swipe down to close the bottom sheet on mobile
  (function () {
    var startY = null, dy = 0;
    var isSheet = window.matchMedia("(max-width: 767px)");
    modalPanel.addEventListener("touchstart", function (e) {
      if (!isSheet.matches || modalPanel.scrollTop > 0 || e.target.closest("input, select, textarea, button")) { startY = null; return; }
      modalPanel.style.transition = "none";
      startY = e.touches[0].clientY; dy = 0;
    }, { passive: true });
    modalPanel.addEventListener("touchmove", function (e) {
      if (startY === null) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      modalPanel.style.transform = "translateY(" + dy + "px)";
    }, { passive: true });
    modalPanel.addEventListener("touchend", function () {
      if (startY === null) return;
      modalPanel.style.transition = "";
      modalPanel.style.transform = "";
      if (dy > 110) closeModal();
      startY = null;
    });
  })();

  // Auto popup: first after 5s, then again 15s after it is closed (max 2 automatic shows).
  function leadSubmitted() { return store("hd_lead_submitted") === "1"; }
  function userIsBusy() {
    var a = doc.activeElement;
    return isOpen(modal) || isOpen(drawer) || (a && a.closest && a.closest("#lead-form"));
  }
  function scheduleAuto(ms) {
    clearTimeout(autoTimer);
    if (autoShown >= 2 || leadSubmitted()) return;
    autoTimer = setTimeout(function () {
      if (userIsBusy()) { scheduleAuto(4000); return; }
      autoShown++;
      openModal({ source: autoShown === 1 ? "popup_auto_5s" : "popup_auto_15s" });
    }, ms);
  }
  scheduleAuto(CFG.popupFirstDelay || 5000);

  /* ---------- Plans: selected plan chip ---------- */
  function setPlan(form, name) {
    var box = $(".form-plan", form);
    form.elements.plan.value = name || "";
    box.hidden = !name;
    $("[data-plan-label]", box).textContent = name || "";
    if (name) form.elements.service.value = "Website Development";
  }
  $$(".lead-form").forEach(function (form) {
    $(".form-plan__clear", form).addEventListener("click", function () { setPlan(form, ""); });
  });

  /* ---------- Lead forms → Google Sheet → thank-you page ---------- */
  function setError(field, msg) {
    var wrap = field.closest(".field");
    wrap.classList.toggle("has-error", !!msg);
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    $(".err", wrap).textContent = msg || "";
  }

  function normalisePhone(v) {
    var d = String(v).replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
    return d;
  }

  function validate(form) {
    var el = form.elements, ok = true, first = null;
    function check(field, cond, msg) {
      setError(field, cond ? "" : msg);
      if (!cond) { ok = false; if (!first) first = field; }
    }
    check(el.name, el.name.value.trim().length >= 2, "Please enter your name.");
    check(el.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.email.value.trim()), "Please enter a valid email ID.");
    check(el.phone, /^[6-9]\d{9}$/.test(normalisePhone(el.phone.value)), "Please enter a valid 10-digit mobile number.");
    if (first) {
      first.focus();
      var f = first.closest(".field");
      f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake");
    }
    return ok;
  }

  function waSummary(d) {
    return [
      "Hi Howlers Digitals, I'd like a free consultation.",
      "Name: " + d.name, "Email: " + d.email, "Phone: " + d.phone,
      "Service: " + d.service, d.plan && "Plan: " + d.plan
    ].filter(Boolean).join("\n");
  }

  function goThankYou(d) {
    store("hd_lead_submitted", "1");
    try {
      sessionStorage.setItem("hd_lead_name", d.name.split(" ")[0]);
      sessionStorage.setItem("hd_lead_pending", "1"); // thank-you page fires the conversion once
    } catch (e) {}
    window.location.href = CFG.thankYouUrl || "thank-you.html";
  }

  $$(".lead-form").forEach(function (form) {
    var btn = $("button[type=submit]", form);
    var errorBox = $(".form-error", form);
    var started = false;
    var submitting = false;

    $$("input", form).forEach(function (f) {
      f.addEventListener("input", function () {
        if (!started) { started = true; track("form_start", { form_source: form.dataset.source }); }
        if (f.closest(".field") && f.closest(".field").classList.contains("has-error")) setError(f, "");
      });
    });
    // Digits and spaces only in the phone field
    form.elements.phone.addEventListener("input", function () {
      var v = this.value.replace(/[^\d ]/g, "");
      if (v !== this.value) this.value = v;
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitting) return;
      errorBox.hidden = true;
      if (form.elements.company_website.value) return; // bot
      if (!validate(form)) return;

      var el = form.elements;
      var data = {
        name: el.name.value.trim(),
        email: el.email.value.trim(),
        phone: "+91 " + normalisePhone(el.phone.value),
        service: el.service.value,
        plan: el.plan.value,
        source: form.dataset.source || "form",
        page: location.origin + location.pathname
      };

      btn.disabled = true;
      btn.classList.add("is-loading");
      track("generate_lead", { form_source: data.source, service: data.service, plan: data.plan });

      if (!CFG.sheetEndpoint) {
        console.warn("[Howlers] sheetEndpoint is empty in assets/js/config.js — sending the enquiry via WhatsApp instead.");
        window.open(waLink(waSummary(data)), "_blank", "noopener");
        goThankYou(data);
        return;
      }

      submitting = true;
      var done = false;
      var finish = function () { if (!done) { done = true; goThankYou(data); } };
      setTimeout(finish, 6000);

      fetch(CFG.sheetEndpoint, {
        method: "POST",
        mode: "no-cors", // Apps Script sends no CORS headers; the row is still saved
        keepalive: true,
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams(data).toString()
      })
        .then(finish)
        .catch(function () {
          if (done) return;
          done = true;
          submitting = false;
          btn.disabled = false;
          btn.classList.remove("is-loading");
          errorBox.textContent = "";
          errorBox.appendChild(doc.createTextNode("Network issue. Please try again or "));
          var a = doc.createElement("a");
          a.href = waLink(waSummary(data)); a.target = "_blank"; a.rel = "noopener";
          a.textContent = "send your details on WhatsApp";
          errorBox.appendChild(a);
          errorBox.hidden = false;
        });
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Price count-up ---------- */
  var counters = $$("[data-count]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target, end = +el.getAttribute("data-count"), t0 = null, dur = 1400;
        el.closest(".price").classList.add("is-counting");
        (function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(end * eased).toLocaleString("en-IN");
          if (p < 1) requestAnimationFrame(step);
          else el.closest(".price").classList.add("is-done");
        })(performance.now());
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) { el.closest(".price").classList.add("is-done"); });
  }

  /* ---------- Plan feature toggles ---------- */
  $$(".plan__toggle").forEach(function (btn) {
    var panel = doc.getElementById(btn.getAttribute("aria-controls"));
    var label = $("span", btn);
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
      label.textContent = label.getAttribute(open ? "data-label-open" : "data-label-closed");
      if (!open) {
        var top = btn.closest(".plan").getBoundingClientRect().top;
        if (top < 0) window.scrollTo({ top: window.scrollY + top - 90, behavior: reduceMotion ? "instant" : "smooth" });
      }
    });
  });

  /* ---------- FAQ accordion ---------- */
  $$(".qa button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var qa = btn.closest(".qa");
      var open = btn.getAttribute("aria-expanded") !== "true";
      $$(".qa").forEach(function (other) {
        if (other !== qa) { other.classList.remove("is-open"); $("button", other).setAttribute("aria-expanded", "false"); }
      });
      qa.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Process line progress ---------- */
  var steps = $(".steps");
  if (steps) {
    var updateSteps = function () {
      var r = steps.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      if (reduceMotion) p = 1;
      steps.style.setProperty("--progress", p.toFixed(3));
      $$(".step", steps).forEach(function (s, i, all) { s.classList.toggle("is-active", p >= i / all.length + 0.02); });
    };
    updateSteps();
    window.addEventListener("scroll", updateSteps, { passive: true });
    window.addEventListener("resize", updateSteps);
  }

  /* ---------- Portfolio rail: dots + one-time swipe hint ---------- */
  var rail = $(".work-rail");
  var dotsWrap = $(".rail-dots");
  if (rail && dotsWrap) {
    var cards = $$(".wcard", rail);
    cards.forEach(function () { dotsWrap.appendChild(doc.createElement("i")); });
    var dots = $$("i", dotsWrap);
    var setDot = function () {
      var center = rail.scrollLeft + rail.clientWidth / 2, idx = 0, best = Infinity;
      cards.forEach(function (c, i) {
        var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
        if (d < best) { best = d; idx = i; }
      });
      dots.forEach(function (d, i) { d.classList.toggle("on", i === idx); });
    };
    setDot();
    rail.addEventListener("scroll", setDot, { passive: true });

    if ("IntersectionObserver" in window && !reduceMotion) {
      var hint = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting || rail.scrollWidth <= rail.clientWidth) return;
        hint.disconnect();
        setTimeout(function () {
          if (rail.scrollLeft > 0) return;
          rail.scrollTo({ left: 90, behavior: "smooth" });
          setTimeout(function () { rail.scrollTo({ left: 0, behavior: "smooth" }); }, 650);
        }, 500);
      }, { threshold: 0.6 });
      hint.observe(rail);
    }
  }

  /* ---------- Mobile sticky bar & floating WhatsApp ---------- */
  var mbar = $(".mbar");
  var waFloat = $(".wa-float");
  var hero = $(".hero");
  var contactVisible = false;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      contactVisible = en[0].isIntersecting;
      updateFloating();
    }, { threshold: 0.15 }).observe($("#contact"));
  }
  function updateFloating() {
    var pastHero = window.scrollY > hero.offsetHeight * 0.45;
    mbar.classList.toggle("is-visible", pastHero && !contactVisible);
    waFloat.classList.toggle("is-visible", window.scrollY > 300);
  }
  updateFloating();
  window.addEventListener("scroll", updateFloating, { passive: true });

  /* ---------- Desktop: spotlight that follows the cursor on key cards ---------- */
  if (window.matchMedia("(hover: hover)").matches && !reduceMotion) {
    $$(".svc--primary, .plan, .cmp--win, .feat").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }
})();
