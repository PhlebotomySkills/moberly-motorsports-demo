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

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
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
})();
