/* Moberly Motorsports Park — shared behavior (rebuild sample)
   Vanilla JS, no dependencies. Progressive: page works without it. */
(function () {
  "use strict";

  /* ---------- mobile nav + dropdowns ---------- */
  var burger = document.querySelector(".hamburger");
  var links = document.querySelector(".nav-links");
  var backdrop = document.querySelector(".nav-backdrop");

  function closeNav() {
    if (!links) return;
    links.classList.remove("open");
    if (burger) { burger.classList.remove("on"); burger.setAttribute("aria-expanded", "false"); }
    if (backdrop) backdrop.classList.remove("on");
  }
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.classList.toggle("on", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      if (backdrop) backdrop.classList.toggle("on", open);
    });
  }
  if (backdrop) backdrop.addEventListener("click", closeNav);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeNav(); closeLightbox(); } });

  /* dropdown toggles (click on mobile, hover handled by CSS on desktop) */
  document.querySelectorAll(".nav-links > li > .navbtn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var li = btn.parentElement;
      var isMobile = window.matchMedia("(max-width:860px)").matches;
      if (isMobile) {
        e.preventDefault();
        var wasOpen = li.classList.contains("open");
        li.parentElement.querySelectorAll("li.open").forEach(function (o) { if (o !== li) o.classList.remove("open"); });
        li.classList.toggle("open", !wasOpen);
      }
    });
  });
  /* close menus when clicking a real link */
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    a.addEventListener("click", closeNav);
  });

  /* ---------- scroll reveal (content shows even if JS is off, slow, or throttled) ---------- */
  var reveals = document.querySelectorAll(".reveal");
  function showReveal(el) { el.classList.add("in"); }
  if (reveals.length) {
    // Turn on the animation gate, then immediately reveal whatever is already on screen,
    // all in one synchronous step so above-the-fold content never flashes hidden.
    document.documentElement.classList.add("js");
    var vh = window.innerHeight || document.documentElement.clientHeight;
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) showReveal(el);
    });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { showReveal(en.target); io.unobserve(en.target); }
        });
      }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) { if (!el.classList.contains("in")) io.observe(el); });
      // Ultimate safety net: never leave any content invisible.
      setTimeout(function () { reveals.forEach(showReveal); }, 1400);
    } else {
      reveals.forEach(showReveal);
    }
  }

  /* ---------- signup (sample handler) ---------- */
  document.querySelectorAll("form[data-signup]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = form.parentElement.querySelector(".ok") || form.querySelector(".ok");
      if (ok) ok.classList.add("show");
      form.reset();
    });
  });

  /* ---------- gallery lightbox ---------- */
  var figs = Array.prototype.slice.call(document.querySelectorAll(".gallery figure"));
  var lb, lbImg, lbCap, idx = 0;
  function buildLightbox() {
    lb = document.createElement("div");
    lb.className = "lb";
    lb.innerHTML =
      '<button class="lb-x" aria-label="Close">&times;</button>' +
      '<button class="lb-prev" aria-label="Previous">&#8249;</button>' +
      '<img alt="">' +
      '<button class="lb-next" aria-label="Next">&#8250;</button>' +
      '<div class="lb-cap"></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector("img");
    lbCap = lb.querySelector(".lb-cap");
    lb.querySelector(".lb-x").addEventListener("click", closeLightbox);
    lb.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); show(idx - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
  }
  function show(i) {
    if (!figs.length) return;
    idx = (i + figs.length) % figs.length;
    var fig = figs[idx];
    var full = fig.getAttribute("data-full") || fig.querySelector("img").src;
    var cap = fig.querySelector("figcaption");
    lbImg.src = full;
    lbImg.alt = fig.querySelector("img").alt || "";
    lbCap.textContent = cap ? cap.textContent : "";
    lb.classList.add("on");
  }
  function closeLightbox() { if (lb) lb.classList.remove("on"); }
  if (figs.length) {
    figs.forEach(function (fig, i) {
      fig.setAttribute("tabindex", "0");
      fig.addEventListener("click", function () { if (!lb) buildLightbox(); show(i); });
      fig.addEventListener("keydown", function (e) { if (e.key === "Enter") { if (!lb) buildLightbox(); show(i); } });
    });
  }

  /* ---------- mark active nav item by filename ---------- */
  var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a[href]").forEach(function (a) {
    var href = a.getAttribute("href").toLowerCase();
    if (href === here || (here === "index.html" && href === "index.html")) a.classList.add("active");
  });

  /* ---------- next-event weather (Open-Meteo, real data, safe) ----------
     Safe by design:
       - only forecasts the next event, and only within a reliable window (<= 7 days);
         beyond that it shows current conditions, never a far-out guess.
       - it is labelled a forecast and always says the track makes the final call.
       - it never implies a cancellation; the "Rained Out" banner stays manual.
       - if the weather service is unreachable, the chip simply hides (never breaks). */
  (function () {
    var el = document.querySelector("[data-weather]");
    if (!el || !window.fetch) return;
    var lat = el.getAttribute("data-lat"), lon = el.getAttribute("data-lon"), date = el.getAttribute("data-date");
    if (!lat || !lon) return;
    var WINDOW_DAYS = 7;

    function wmo(code) {
      if (code === 0) return { ic: "☀️", t: "Clear" };
      if (code === 1) return { ic: "🌤️", t: "Mostly sunny" };
      if (code === 2) return { ic: "⛅", t: "Partly cloudy" };
      if (code === 3) return { ic: "☁️", t: "Cloudy" };
      if (code === 45 || code === 48) return { ic: "🌫️", t: "Fog" };
      if (code >= 51 && code <= 57) return { ic: "🌦️", t: "Drizzle" };
      if (code >= 61 && code <= 67) return { ic: "🌧️", t: "Rain" };
      if (code >= 71 && code <= 77) return { ic: "🌨️", t: "Snow" };
      if (code >= 80 && code <= 82) return { ic: "🌦️", t: "Showers" };
      if (code >= 95) return { ic: "⛈️", t: "Storms" };
      return { ic: "🌡️", t: "" };
    }
    function set(sel, html) { var n = el.querySelector(sel); if (n) n.innerHTML = html; }

    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
      "&daily=weather_code,temperature_2m_max,precipitation_probability_max" +
      "&current=temperature_2m,weather_code" +
      "&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=16";

    fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      var days = (d.daily && d.daily.time) || [];
      var idx = date ? days.indexOf(date) : -1;
      var noteFinal = ' The track makes the final call on rainouts — <a href="https://www.facebook.com/MoberlyMotorsportsPark" target="_blank" rel="noopener">watch Facebook</a>.';

      if (idx >= 0 && idx <= WINDOW_DAYS) {
        var ci = wmo(d.daily.weather_code[idx]);
        var hi = Math.round(d.daily.temperature_2m_max[idx]);
        var pop = d.daily.precipitation_probability_max[idx];
        set(".wx-ic", ci.ic);
        set(".wx-main", hi + "&deg;F" + (ci.t ? " &middot; " + ci.t : ""));
        set(".wx-pop", (pop == null || isNaN(pop)) ? "" : Math.round(Number(pop)) + "% rain");
        set(".wx-note", "Race-day forecast for the track." + noteFinal);
      } else if (d.current) {
        var cc = wmo(d.current.weather_code);
        set(".wx-ic", cc.ic);
        set(".wx-main", Math.round(d.current.temperature_2m) + "&deg;F at the track now");
        set(".wx-pop", "");
        set(".wx-note", "Race-day forecast posts closer to the event." + noteFinal);
      } else { return; }
      el.hidden = false;
    }).catch(function () { /* weather service unreachable: leave the chip hidden */ });
  })();
})();
