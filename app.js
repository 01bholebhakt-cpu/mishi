/* Mishi Women's Apparel storefront. Catalogue lives in data.js; everything here is shared by all pages. */
(function () {
  "use strict";
  var D = window.MISHI_DATA, P = D.products, C = D.cats;
  var CFG = {
    whatsapp: "919589574641",
    phone: "+91 95895 74641",
    insta: "https://www.instagram.com/mishiwomenapparel/",
    address: "Scheme No. 103, near Aangan Girls Hostel, Indore, Madhya Pradesh",
    hours: "12:00 PM to 9:00 PM",
    tagline: "For The Bold N Beautiful",
    shipping: [
      { id: "in-std", name: "India, Standard", eta: "Estimated 5 to 8 working days", where: "in", charge: "Confirmed on WhatsApp" },
      { id: "in-exp", name: "India, Express", eta: "Estimated 2 to 4 working days", where: "in", charge: "Confirmed on WhatsApp" },
      { id: "intl", name: "International", eta: "Estimated 10 to 15 working days", where: "out", charge: "Confirmed on WhatsApp" }
    ],
    countries: ["India", "United States", "United Kingdom", "United Arab Emirates", "Canada", "Australia", "Singapore", "Other"]
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var byId = {}, bySlug = {}, catBy = {};
  P.forEach(function (p) { byId[p.id] = p; bySlug[p.slug] = p; });
  C.forEach(function (c) { catBy[c.key] = c; });

  /* storage with in-memory fallback */
  var mem = {};
  function sget(k, d) { try { var v = localStorage.getItem("mishi:" + k); return v ? JSON.parse(v) : (k in mem ? mem[k] : d); } catch (e) { return k in mem ? mem[k] : d; } }
  function sset(k, v) { mem[k] = v; try { localStorage.setItem("mishi:" + k, JSON.stringify(v)); } catch (e) {} }
  function sdel(k) { delete mem[k]; try { localStorage.removeItem("mishi:" + k); } catch (e) {} }

  /* cart */
  var cart = {
    get: function () { return sget("cart", []); },
    set: function (v) { sset("cart", v); badge(); },
    add: function (id, size, qty) {
      var c = cart.get(), ex = c.filter(function (i) { return i.id === id && i.size === size; })[0];
      if (ex) ex.qty += qty; else c.push({ id: id, size: size, qty: qty });
      cart.set(c);
    },
    count: function () { return cart.get().reduce(function (a, i) { return a + i.qty; }, 0); },
    total: function () { return cart.get().reduce(function (a, i) { return a + (byId[i.id] ? byId[i.id].price * i.qty : 0); }, 0); }
  };
  function badge() { var n = cart.count(); $$(".bagn").forEach(function (e) { e.textContent = n; e.classList.toggle("z", !n); }); }

  var toastT;
  function toast(msg) {
    var t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ---------- illustration of a garment, drawn in SVG ---------- */
  var SHAPES = {
    gown: { main: ["M168 96 Q200 128 232 96 L246 108 L226 214 Q300 380 318 486 Q200 512 82 486 Q100 380 174 214 L154 108 Z"], neck: "M168 96 Q200 126 232 96", waist: 214, hem: 470 },
    anarkali: { main: ["M166 96 Q200 124 234 96 L250 110 L232 206 Q290 330 306 440 Q200 466 94 440 Q110 330 168 206 L150 110 Z"], sleeve: ["M150 110 L106 262 L128 270 L168 150 Z", "M250 110 L294 262 L272 270 L232 150 Z"], neck: "M166 96 Q200 124 234 96", waist: 206, hem: 424 },
    dress: { main: ["M170 96 Q200 126 230 96 L244 108 L228 210 Q276 300 288 392 Q200 412 112 392 Q124 300 172 210 L156 108 Z"], neck: "M170 96 Q200 124 230 96", waist: 210, hem: 380 },
    coord: { main: ["M160 100 Q200 122 240 100 L264 132 L246 152 L240 216 L160 216 L154 152 L136 132 Z"], sleeve: ["M162 236 L238 236 L288 492 L214 492 L200 336 L186 492 L112 492 Z"], neck: "M160 100 Q200 120 240 100", waist: 226, hem: 0 },
    kurti: { main: ["M166 96 Q200 122 234 96 L252 112 L240 200 L246 392 L204 378 L200 392 L196 378 L154 392 L160 200 L148 112 Z"], sleeve: ["M164 394 L236 394 L248 492 L208 492 L200 412 L192 492 L152 492 Z"], neck: "M166 96 Q200 120 234 96", waist: 200, hem: 384 },
    top: { main: ["M158 120 Q200 148 242 120 L298 168 L272 216 L246 198 L248 336 L152 336 L154 198 L128 216 L102 168 Z"], neck: "M158 120 Q200 146 242 120", waist: 0, hem: 330, scale: 1.28 }
  };
  function art(p, mode) {
    var id = "a" + p.id + (mode || "f"), c1 = p.c[0], c2 = p.c[1], c3 = p.c[2], s = SHAPES[p.type], o = "";
    var defs = '<defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".36" stop-color="#fff" stop-opacity=".3"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>' +
      '<radialGradient id="' + id + 'r" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="' + c1 + '" stop-opacity=".22"/><stop offset="1" stop-color="' + c1 + '" stop-opacity="0"/></radialGradient>';
    var sc = mode === "d" ? 2.6 : 1, pat = "";
    if (p.pat === "dots") pat = '<pattern id="' + id + 'p" width="' + 18 * sc + '" height="' + 18 * sc + '" patternUnits="userSpaceOnUse"><circle cx="' + 9 * sc + '" cy="' + 9 * sc + '" r="' + 1.6 * sc + '" fill="' + c3 + '" opacity=".7"/></pattern>';
    if (p.pat === "stripe") pat = '<pattern id="' + id + 'p" width="' + 14 * sc + '" height="10" patternUnits="userSpaceOnUse"><rect width="' + 2 * sc + '" height="10" fill="' + c3 + '" opacity=".3"/></pattern>';
    if (p.pat === "floral") pat = '<pattern id="' + id + 'p" width="' + 44 * sc + '" height="' + 44 * sc + '" patternUnits="userSpaceOnUse"><g fill="' + c3 + '" opacity=".6" transform="scale(' + sc + ')"><circle cx="22" cy="15" r="3.6"/><circle cx="29" cy="22" r="3.6"/><circle cx="22" cy="29" r="3.6"/><circle cx="15" cy="22" r="3.6"/><circle cx="22" cy="22" r="2" fill="' + c2 + '"/></g></pattern>';
    if (p.pat === "zari") pat = '<pattern id="' + id + 'p" width="' + 12 * sc + '" height="' + 12 * sc + '" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="' + 1 * sc + '" height="' + 12 * sc + '" fill="#f3d9a8" opacity=".55"/></pattern>';
    defs += pat + "</defs>";
    o += defs + '<rect width="400" height="520" fill="url(#' + id + 'r)"/>';
    if (mode === "d") {
      o += '<rect width="400" height="520" fill="url(#' + id + 'g)"/>';
      if (pat) o += '<rect width="400" height="520" fill="url(#' + id + 'p)"/>';
      o += '<path d="M-10 90 Q120 40 240 150 T420 120" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="40"/><path d="M-10 330 Q140 260 260 380 T420 340" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="46"/><path d="M-10 460 Q150 400 280 470 T420 440" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="30"/><rect width="400" height="520" fill="url(#' + id + 'h)"/>';
      return '<svg viewBox="0 0 400 520" role="img" aria-label="' + esc(p.name) + ' fabric detail" preserveAspectRatio="xMidYMid slice">' + o + "</svg>";
    }
    var g = s.scale ? ' transform="translate(200 300) scale(' + s.scale + ') translate(-200 -228)"' : "";
    o += '<path d="M66 520 V214 A134 134 0 0 1 334 214 V520 Z" fill="' + c1 + '" opacity=".13"/><path d="M82 520 V216 A118 118 0 0 1 318 216 V520" fill="none" stroke="#c98b86" stroke-opacity=".6" stroke-width="1.1"/>';
    o += '<g fill="#d9a39a"><path d="M52 110 l2.6 8 8 2.6 -8 2.6 -2.6 8 -2.6 -8 -8 -2.6 8 -2.6z" opacity=".85"/><path d="M342 170 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" opacity=".75"/><path d="M350 80 l1.6 4.4 4.4 1.6 -4.4 1.6 -1.6 4.4 -1.6 -4.4 -4.4 -1.6 4.4 -1.6z" opacity=".6"/></g>';
    o += '<ellipse cx="200" cy="506" rx="112" ry="7" fill="#2a1820" opacity=".16"/><ellipse cx="200" cy="508" rx="150" ry="4" fill="#c98b86" opacity=".25"/>';
    o += '<g stroke="#b98a82" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M200 70 L200 58 Q200 44 211 44 Q222 44 222 55"/><path d="M200 70 L146 102 M200 70 L254 102"/></g>';
    o += "<g" + g + ">";
    var paint = function (d) { o += '<path d="' + d + '" fill="url(#' + id + 'g)"/>'; if (pat) o += '<path d="' + d + '" fill="url(#' + id + 'p)"/>'; o += '<path d="' + d + '" fill="url(#' + id + 'h)"/>'; };
    (s.sleeve || []).forEach(paint); s.main.forEach(paint);
    if (s.hem && (p.type === "gown" || p.type === "anarkali" || p.type === "dress")) {
      var hw = p.type === "gown" ? 112 : p.type === "anarkali" ? 100 : 86, k;
      o += '<g fill="none" stroke-linecap="round">';
      for (k = -2; k <= 2; k++) o += '<path d="M' + (200 + k * 9) + " " + (s.waist + 12) + " Q" + (200 + k * hw * .42) + " " + ((s.waist + s.hem) / 2) + " " + (200 + k * hw * .46) + " " + (s.hem + 16) + '" stroke="' + (k % 2 ? "#fff" : "#000") + '" stroke-opacity="' + (k % 2 ? .16 : .12) + '" stroke-width="2.2"/>';
      o += "</g>";
    }
    o += '<path d="' + s.neck + '" fill="none" stroke="' + c3 + '" stroke-width="2.6" stroke-linecap="round"/>';
    if (s.waist) o += '<path d="M' + (p.type === "coord" ? 160 : 178) + " " + s.waist + " L" + (p.type === "coord" ? 240 : 222) + " " + s.waist + '" stroke="' + c3 + '" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>';
    if (s.hem && p.type !== "top" && p.type !== "kurti") { var hw2 = p.type === "gown" ? 112 : p.type === "anarkali" ? 100 : 86; o += '<path d="M' + (200 - hw2) + " " + (s.hem + 14) + " Q200 " + (s.hem + 36) + " " + (200 + hw2) + " " + (s.hem + 14) + '" fill="none" stroke="#f3d9a8" stroke-width="1.6" opacity=".8"/>'; }
    o += "</g>";
    return '<svg viewBox="0 0 400 520" role="img" aria-label="' + esc(p.name) + '">' + o + "</svg>";
  }

  var wish = { get: function () { return sget("wish", []); }, has: function (id) { return wish.get().indexOf(id) > -1; }, toggle: function (id) { var w = wish.get(), i = w.indexOf(id); if (i > -1) w.splice(i, 1); else w.push(id); sset("wish", w); wbadge(); return i === -1; } };
  function wbadge() { var n = wish.get().length; $$(".wishc").forEach(function (e) { e.textContent = n || ""; e.classList.toggle("z", !n); }); }
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.7 4.8 6.9 4.8c2 0 3.7 1.2 5.1 3.1 1.4-1.9 3.1-3.1 5.1-3.1 3.2 0 5.3 3 4.1 6.4-1.7 4.7-9.2 9.3-9.2 9.3z"/></svg>';
  var SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 L21 21"/></svg>';
  var BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>';
  function card(p) {
    return '<div class="card"><div class="card-art">' + (p.tag ? '<span class="badge">' + esc(p.tag) + "</span>" : "") +
      '<button class="heart ' + (wish.has(p.id) ? "on" : "") + '" data-heart="' + p.id + '" aria-label="Save ' + esc(p.name) + ' to wishlist">' + HEART + "</button>" +
      '<a href="product-' + p.slug + '.html" aria-label="' + esc(p.name) + '">' + art(p) + '</a><span class="quick">View piece</span></div>' +
      '<a class="card-meta" href="product-' + p.slug + '.html"><span class="cat">' + esc(catBy[p.cat].name) + "</span><h3>" + esc(p.name) + '</h3><span class="price tn">' + money(p.price) + '</span><span class="sw"><i class="dot" style="background:' + p.c[0] + '"></i>' + esc(p.color) + "</span></a></div>";
  }
  function match(q) {
    q = (q || "").toLowerCase().trim(); if (!q) return [];
    var parts = q.split(/\s+/);
    return P.filter(function (p) { var h = (p.name + " " + p.color + " " + catBy[p.cat].name + " " + p.fabric + " " + p.type + " " + (p.tag || "") + " " + p.pat).toLowerCase(); return parts.every(function (w) { return h.indexOf(w) > -1; }); });
  }

  /* ---------- layout: header / footer ---------- */
  function goSearch(q) {
    q = (q || "").trim(); sset("q", q);
    if (window.Mishi && Mishi.onSearch) { Mishi.onSearch(q); closeSearch(); } else location.href = "shop.html#all";
  }
  function openSearch() { var s = $("#sx"); s.hidden = false; document.body.style.overflow = "hidden"; var i = $("#sxi"); i.value = ""; drawSearch(""); setTimeout(function () { i.focus(); }, 30); }
  function closeSearch() { var s = $("#sx"); if (s) { s.hidden = true; document.body.style.overflow = ""; } }
  function drawSearch(q) {
    var r = match(q), box = $("#sxr");
    if (!q.trim()) { box.innerHTML = P.filter(function (p) { return p.tag === "Bestseller"; }).slice(0, 6).map(sxRow).join(""); $("#sxt").textContent = "Bestsellers"; $("#sxall").hidden = true; return; }
    $("#sxt").textContent = r.length + (r.length === 1 ? " result" : " results");
    box.innerHTML = r.length ? r.slice(0, 6).map(sxRow).join("") : '<div class="sx-none">Nothing matches “' + esc(q) + '”. Try a colour, fabric or category such as gown, wine or satin.</div>';
    $("#sxall").hidden = r.length < 1; $("#sxall").textContent = "View all " + r.length + " results";
  }
  function sxRow(p) { return '<a class="sxr" href="product-' + p.slug + '.html"><div class="th">' + art(p) + "</div><div><b>" + esc(p.name) + "</b><span>" + esc(catBy[p.cat].name) + " · " + esc(p.color) + '</span></div><em class="tn">' + money(p.price) + "</em></a>"; }

  function layout(active) {
    var nav = [["shop.html#all", "Shop all", "all"], ["shop.html#gowns", "Gowns", "gowns"], ["shop.html#anarkalis", "Anarkalis", "anarkalis"], ["shop.html#coords", "Co-ords", "coords"], ["shop.html#dresses", "Dresses", "dresses"]];
    var h = $("#site-header"), f = $("#site-footer");
    if (h) {
      h.className = "site-header";
      h.innerHTML = '<div class="announce">Shipping worldwide from Indore &nbsp;·&nbsp; <b>' + CFG.tagline + '</b></div>' +
        '<div class="wrap bar"><div style="display:flex;align-items:center"><button class="menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false"><span></span></button>' +
        '<nav class="navl" aria-label="Main">' + nav.slice(0, 4).map(function (n) { return '<a href="' + n[0] + '"' + (active === n[2] ? ' class="on"' : "") + ">" + n[1] + "</a>"; }).join("") + "</nav></div>" +
        '<a class="brand" href="index.html">Mishi<small>Women’s Apparel</small></a>' +
        '<div class="navr"><button class="sbtn" data-open-search aria-label="Search">' + SEARCH + "<span>Search the collection</span></button>" +
        '<a class="ico" href="wishlist.html" aria-label="Wishlist">' + HEART.replace("<svg", '<svg style="fill:none;stroke:currentColor;stroke-width:1.5"') + '<span class="n wishc z"></span></a>' +
        '<a class="ico" href="bag.html" aria-label="Bag">' + BAG + '<span class="n bagn">0</span></a></div></div>' +
        '<nav class="mnav" id="mnav"><div class="wrap">' + nav.map(function (n) { return '<a href="' + n[0] + '">' + n[1] + "</a>"; }).join("") + '<a href="wishlist.html">Wishlist</a><a href="contact.html">Visit &amp; contact</a><a href="shipping.html">Delivery &amp; policies</a></div></nav>';
      $("#menuBtn").onclick = function () { var m = $("#mnav"), o = m.classList.toggle("open"); this.setAttribute("aria-expanded", o); };
      var s = document.createElement("div"); s.id = "sx"; s.className = "sx"; s.hidden = true;
      s.innerHTML = '<div class="sx-in"><div class="wrap"><div class="sx-box"><div class="sx-bar">' + SEARCH + '<input id="sxi" type="search" placeholder="Search gowns, anarkalis, colours" autocomplete="off" aria-label="Search the collection"><button id="sxc" aria-label="Close search">×</button></div>' +
        '<div class="sx-pop"><span>Popular</span>' + ["Gown", "Anarkali", "Co-ord", "Wine", "Emerald", "Satin"].map(function (t) { return '<button data-q="' + t + '">' + t + "</button>"; }).join("") + '</div>' +
        '<div class="eyebrow" id="sxt" style="margin-bottom:6px"></div><div class="sx-res" id="sxr"></div><div class="sx-all"><button class="btn solid" id="sxall" hidden>View all results</button></div></div></div></div>';
      document.body.appendChild(s);
      s.addEventListener("click", function (e) { if (e.target === s) closeSearch(); });
      $("#sxc").onclick = closeSearch;
      $("#sxi").addEventListener("input", function (e) { drawSearch(e.target.value); });
      $("#sxi").addEventListener("keydown", function (e) { if (e.key === "Enter") goSearch(this.value); });
      $("#sxall").onclick = function () { goSearch($("#sxi").value); };
      $$("[data-q]", s).forEach(function (b) { b.onclick = function () { $("#sxi").value = b.dataset.q; drawSearch(b.dataset.q); $("#sxi").focus(); }; });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSearch(); if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "")) { e.preventDefault(); openSearch(); } });
    }
    document.addEventListener("click", function (e) {
      var o = e.target.closest("[data-open-search]"); if (o) { e.preventDefault(); openSearch(); return; }
      var hh = e.target.closest("[data-heart]"); if (hh) { e.preventDefault(); e.stopPropagation(); var on = wish.toggle(+hh.dataset.heart); $$('[data-heart="' + hh.dataset.heart + '"]').forEach(function (x) { x.classList.toggle("on", on); }); toast(on ? "Saved to wishlist" : "Removed from wishlist"); return; }
      var ds = e.target.closest("[data-search]"); if (ds) { sset("q", ds.dataset.search); if (window.Mishi && Mishi.onSearch) { e.preventDefault(); Mishi.onSearch(ds.dataset.search); } }
    });
    if (f) {
      f.className = "site-footer";
      f.innerHTML = '<div class="wrap"><div><a class="brand" href="index.html">Mishi<small>Women’s Apparel</small></a><p class="tag">' + CFG.tagline + '</p><p>Women’s apparel from Indore, shipped worldwide.</p></div>' +
        '<div><h4>Shop</h4><ul>' + C.map(function (c) { return '<li><a href="shop.html#' + c.key + '">' + c.name + "</a></li>"; }).join("") + "</ul></div>" +
        '<div><h4>Help</h4><ul><li><a href="shipping.html">Delivery &amp; policies</a></li><li><a href="bag.html">Your bag</a></li><li><a href="wishlist.html">Wishlist</a></li><li><a href="contact.html">Contact us</a></li></ul></div>' +
        '<div><h4>Visit</h4><p>' + CFG.address + "</p><p style=\"margin-top:10px\">" + CFG.hours + "<br>" + CFG.phone + '</p><p style="margin-top:10px"><a href="' + CFG.insta + '" target="_blank" rel="noopener">@mishiwomenapparel</a></p></div></div>' +
        '<div class="legal">© ' + new Date().getFullYear() + " Mishi Women’s Apparel, Indore. All rights reserved.</div>";
    }
    if (!$(".fab")) {
      var a = document.createElement("a"); a.className = "fab"; a.target = "_blank"; a.rel = "noopener"; a.textContent = "WhatsApp";
      a.href = "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent("Hi Mishi, I have a question about your collection."); document.body.appendChild(a);
    }
    badge(); wbadge();
  }

  var root = function () { return $("#app"); };
  function stepsHTML(n) {
    var s = ["Bag", "Details", "Delivery", "Order"];
    return '<ol class="steps">' + s.map(function (x, i) { return '<li class="' + (i + 1 === n ? "on" : i + 1 < n ? "done" : "") + '"><i>' + (i + 1) + "</i>" + x + "</li>"; }).join("") + "</ol>";
  }
  function emptyBag() { return '<div class="empty"><h2>Your bag is empty</h2><p>Find something bold and beautiful.</p><a class="btn solid" href="shop.html#all">Shop the collection</a></div>'; }
  function summary(showShip) {
    var c = cart.get(), ship = sget("ship", null);
    return '<aside class="panel sum"><h3>Order summary</h3>' + c.map(function (i) { var p = byId[i.id]; if (!p) return ""; return '<div class="mini"><div class="th">' + art(p) + '</div><div>' + esc(p.name) + '<br><span class="muted">Size ' + esc(i.size) + " · Qty " + i.qty + '</span></div><span class="tn">' + money(p.price * i.qty) + "</span></div>"; }).join("") +
      '<div class="row" style="margin-top:10px"><span>Subtotal</span><span class="tn">' + money(cart.total()) + "</span></div>" +
      '<div class="row"><span>Delivery</span><span class="muted">' + (showShip && ship ? esc(ship.name) + ", confirmed on WhatsApp" : "Chosen next") + "</span></div>" +
      '<div class="row t"><span>Total</span><span class="tn">' + money(cart.total()) + '</span></div><p class="muted" style="font-size:12px;margin-top:6px">Delivery charges are confirmed with you on WhatsApp before payment.</p></aside>';
  }

  /* ---------- pages ---------- */
  function home() {
    var g = byId[2], an = byId[8];
    $("#hero-art").innerHTML = '<a class="arch a1" href="product-' + g.slug + '.html"><div class="in">' + art(g) + '</div></a><a class="arch a2" href="product-' + an.slug + '.html"><div class="in">' + art(an) + '</div></a>' +
      '<div class="seal"><div><b>Worldwide</b>shipping from Indore</div></div><div class="tagcard">New in<b>' + esc(g.name) + '</b><span class="tn">' + money(g.price) + "</span></div>";
    $("#new-grid").innerHTML = P.filter(function (p) { return p.tag === "New"; }).slice(0, 8).map(card).join("");
    $("#cat-tiles").innerHTML = C.map(function (c) {
      var list = P.filter(function (x) { return x.cat === c.key; });
      return '<a class="tile" href="shop.html#' + c.key + '">' + art(list[1] || list[0]) + '<div class="lab"><span>' + list.length + " styles</span><h3>" + c.name + "</h3></div></a>";
    }).join("");
    var f = byId[6];
    $("#feat").innerHTML = '<div class="pic"><a class="arch" href="product-' + f.slug + '.html"><div class="in">' + art(f) + '</div></a></div><div class="txt"><span class="eyebrow">The signature edit</span><h2>' + esc(f.name.split(" ")[0]) + ", <em>" + esc(f.name.split(" ").slice(1).join(" ")) + '</em></h2><p>' + esc(f.desc) + '</p><div class="tn" style="font-family:var(--display);font-size:30px">' + money(f.price) + '</div><div><a class="btn solid" href="product-' + f.slug + '.html">Discover the piece</a></div></div>';
    var seen = {}, cols = [];
    P.forEach(function (p) { if (!seen[p.color]) { seen[p.color] = 1; cols.push(p); } });
    $("#swatches").innerHTML = cols.slice(0, 8).map(function (p) { return '<a class="swatch" href="shop.html#all" data-search="' + esc(p.color) + '"><i style="background:linear-gradient(135deg,' + p.c[0] + ',' + p.c[1] + ')"></i>' + esc(p.color) + "</a>"; }).join("");
    $("#igrid").innerHTML = [3, 11, 19, 25, 31, 14].map(function (i) { var p = byId[i]; return '<a href="product-' + p.slug + '.html" aria-label="' + esc(p.name) + '">' + art(p) + "</a>"; }).join("");
    var t = ["For The Bold N Beautiful", "Worldwide Shipping", "Gowns & Anarkalis", "Co-ords & Dresses", "Made To Be Noticed", "Indore"]; var row = t.concat(t).concat(t).concat(t).map(function (x) { return "<span>" + x + "</span>"; }).join("");
    $("#tick").innerHTML = row;
  }

  function shop() {
    var st = { cat: "all", q: sget("q", ""), sort: "feat" };
    function fromHash() { var h = (location.hash || "#all").slice(1); st.cat = (h === "all" || h === "new" || catBy[h]) ? h : "all"; }
    function draw() {
      var list = P.filter(function (p) {
        var inCat = st.cat === "all" || (st.cat === "new" ? p.tag === "New" : p.cat === st.cat);
        var q = st.q.toLowerCase();
        return inCat && (!q || (p.name + " " + p.color + " " + catBy[p.cat].name).toLowerCase().indexOf(q) > -1);
      });
      if (st.sort === "low") list.sort(function (a, b) { return a.price - b.price; });
      if (st.sort === "high") list.sort(function (a, b) { return b.price - a.price; });
      var chips = [["all", "All"], ["new", "New in"]].concat(C.map(function (c) { return [c.key, c.name]; }));
      $("#chips").innerHTML = chips.map(function (c) { return '<a class="chip ' + (st.cat === c[0] ? "on" : "") + '" href="#' + c[0] + '">' + c[1] + "</a>"; }).join("");
      var title = st.cat === "all" ? "The Collection" : st.cat === "new" ? "New In" : catBy[st.cat].name;
      $("#shop-title").textContent = title;
      $("#count").textContent = list.length + (list.length === 1 ? " style" : " styles") + (st.q ? " for “" + st.q + "”" : "");
      $("#grid").innerHTML = list.length ? list.map(card).join("") : '<div class="empty" style="grid-column:1/-1"><h2>Nothing found</h2><p>Try a different search or category.</p></div>';
    }
    fromHash(); $("#q").value = st.q; draw();
    Mishi.onSearch = function (q) { st.q = q; st.cat = "all"; $("#q").value = q; draw(); try { location.hash = "all"; } catch (e) {} };
    window.addEventListener("hashchange", function () { fromHash(); draw(); });
    $("#q").addEventListener("input", function (e) { st.q = e.target.value; sset("q", st.q); draw(); });
    $("#sort").addEventListener("change", function (e) { st.sort = e.target.value; draw(); });
  }

  var SIZE_GUIDE = [["XS", 32, 26, 35], ["S", 34, 28, 37], ["M", 36, 30, 39], ["L", 38, 32, 41], ["XL", 40, 34, 43], ["XXL", 42, 36, 45]];
  function product(slug) {
    var p = bySlug[slug], cat = catBy[p.cat], size = null, qty = 1, view = "f";
    var rel = P.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
    var i = P.indexOf(p), prev = P[(i + P.length - 1) % P.length], next = P[(i + 1) % P.length];
    var wa = "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent("Hi Mishi, I'm interested in the " + p.name + " (" + p.color + "). Is it available?");
    root().innerHTML = '<div class="wrap"><div class="crumbs"><a href="index.html">Home</a> / <a href="shop.html#' + p.cat + '">' + cat.name + "</a> / " + esc(p.name) + "</div>" +
      '<div class="pdp"><div class="gal"><div class="thumbs"><button class="th on" data-v="f" aria-label="Front view">' + art(p) + '</button><button class="th" data-v="d" aria-label="Fabric detail">' + art(p, "d") + '</button></div><div class="main" id="main-art">' + art(p) + "</div></div>" +
      '<div class="info"><span class="eyebrow">' + esc(cat.name) + "</span><h1>" + esc(p.name) + '</h1><div class="price tn">' + money(p.price) + '</div><div class="muted" style="display:flex;gap:8px;align-items:center"><i class="dot" style="background:' + p.c[0] + '"></i>' + esc(p.color) + " · " + esc(p.fabric) + "</div>" +
      '<p class="lead">' + esc(p.desc) + "</p>" +
      '<div class="lbl"><span>Select size</span><button id="sg">Size guide</button></div><div class="sizes" id="sizes">' + p.sizes.map(function (s) { return '<button class="size" data-s="' + s + '">' + s + "</button>"; }).join("") + '</div><div class="msg" id="msg" role="status"></div>' +
      '<div class="buyrow"><div class="qty"><button id="qm" aria-label="Fewer">−</button><span id="qv" class="tn">1</span><button id="qp" aria-label="More">+</button></div><button class="btn solid block" id="add">Add to bag</button></div>' +
      '<button class="btn line block" id="buy">Buy now</button><a class="btn wa block" style="margin-top:12px" target="_blank" rel="noopener" href="' + wa + '">Ask about this piece on WhatsApp</a>' +
      '<div class="acc"><details><summary>Details</summary><div class="in"><ul>' + p.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + '</ul></div></details>' +
      '<details id="sgbox"><summary>Size guide</summary><div class="in"><div class="tablewrap"><table><tr><th>Size</th><th>Bust (in)</th><th>Waist (in)</th><th>Hip (in)</th></tr>' + SIZE_GUIDE.map(function (r) { return "<tr><td>" + r.join("</td><td>") + "</td></tr>"; }).join("") + '</table></div><p style="margin-top:10px">Body measurements. Message us on WhatsApp if you are between sizes.</p></div></details>' +
      '<details><summary>Delivery</summary><div class="in">We ship worldwide from Indore. Delivery charges and timing are confirmed with you on WhatsApp once you place your order. <a class="link" href="shipping.html">Delivery &amp; policies</a></div></details></div></div></div>' +
      '<div style="display:flex;justify-content:space-between;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:18px 0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:600"><a href="product-' + prev.slug + '.html">← Previous</a><a href="shop.html#' + p.cat + '">All ' + cat.name + '</a><a href="product-' + next.slug + '.html">Next →</a></div>' +
      '<section class="sec"><div class="sec-head"><div><span class="eyebrow">You may also love</span><h2>More ' + cat.name + '</h2></div></div><div class="grid">' + rel.map(card).join("") + "</div></section></div>";
    function setMsg(t, ok) { var m = $("#msg"); m.textContent = t; m.className = "msg" + (ok ? " ok" : ""); }
    $$(".th").forEach(function (b) { b.onclick = function () { view = b.dataset.v; $$(".th").forEach(function (x) { x.classList.toggle("on", x === b); }); $("#main-art").innerHTML = art(p, view === "d" ? "d" : undefined); }; });
    $$(".size").forEach(function (b) { b.onclick = function () { size = b.dataset.s; $$(".size").forEach(function (x) { x.classList.toggle("on", x === b); }); setMsg(""); }; });
    $("#sg").onclick = function () { var d = $("#sgbox"); d.open = true; d.scrollIntoView({ behavior: "smooth", block: "center" }); };
    $("#qm").onclick = function () { qty = Math.max(1, qty - 1); $("#qv").textContent = qty; };
    $("#qp").onclick = function () { qty = Math.min(9, qty + 1); $("#qv").textContent = qty; };
    function add() { if (!size) { setMsg("Please select a size."); return false; } cart.add(p.id, size, qty); return true; }
    $("#add").onclick = function () { if (add()) { setMsg("Added to your bag.", true); toast(p.name + " added to bag"); } };
    $("#buy").onclick = function () { if (add()) location.href = "checkout.html"; };
  }

  function bag() {
    var c = cart.get().filter(function (i) { return byId[i.id]; });
    if (!c.length) { root().innerHTML = '<div class="wrap">' + emptyBag() + "</div>"; return; }
    root().innerHTML = '<div class="wrap"><div class="page-head" style="border:0;padding-bottom:0"><span class="eyebrow">Step 1 of 4</span><h1>Your bag</h1></div>' + stepsHTML(1) +
      '<div class="co"><div class="panel" id="lines"></div><aside class="panel sum"><h3>Summary</h3><div class="row"><span>Subtotal</span><span class="tn" id="st">' + money(cart.total()) + '</span></div><div class="row"><span>Delivery</span><span class="muted">Chosen at checkout</span></div><div class="row t"><span>Total</span><span class="tn" id="tt">' + money(cart.total()) + '</span></div><a class="btn solid block" style="margin-top:18px" href="checkout.html">Checkout</a><a class="btn line block" style="margin-top:10px" href="shop.html#all">Continue shopping</a></aside></div></div>';
    function draw() {
      var cc = cart.get();
      if (!cc.length) { root().innerHTML = '<div class="wrap">' + emptyBag() + "</div>"; return; }
      $("#lines").innerHTML = cc.map(function (it, idx) {
        var p = byId[it.id];
        return '<div class="line-item"><a class="th" href="product-' + p.slug + '.html">' + art(p) + '</a><div><h3>' + esc(p.name) + '</h3><div class="m">' + esc(p.color) + " · Size " + esc(it.size) + " · " + money(p.price) + '</div><div class="qty"><button data-m="' + idx + '" aria-label="Fewer">−</button><span class="tn">' + it.qty + '</span><button data-p="' + idx + '" aria-label="More">+</button></div></div><div class="pr"><b class="tn">' + money(p.price * it.qty) + '</b><button class="rm" data-r="' + idx + '">Remove</button></div></div>';
      }).join("");
      $("#st").textContent = $("#tt").textContent = money(cart.total());
      $$("[data-m]").forEach(function (b) { b.onclick = function () { var a = cart.get(), i = +b.dataset.m; a[i].qty--; if (a[i].qty < 1) a.splice(i, 1); cart.set(a); draw(); }; });
      $$("[data-p]").forEach(function (b) { b.onclick = function () { var a = cart.get(); a[+b.dataset.p].qty = Math.min(9, a[+b.dataset.p].qty + 1); cart.set(a); draw(); }; });
      $$("[data-r]").forEach(function (b) { b.onclick = function () { var a = cart.get(); a.splice(+b.dataset.r, 1); cart.set(a); draw(); }; });
    }
    draw();
  }

  function checkout() {
    if (!cart.count()) { root().innerHTML = '<div class="wrap">' + emptyBag() + "</div>"; return; }
    var a = sget("addr", {});
    function f(id, label, type, full, ph, auto) { return '<div class="field' + (full ? " full" : "") + '"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + (type || "text") + '" value="' + esc(a[id] || "") + '"' + (ph ? ' placeholder="' + ph + '"' : "") + (auto ? ' autocomplete="' + auto + '"' : "") + '><small id="e-' + id + '"></small></div>'; }
    root().innerHTML = '<div class="wrap"><div class="page-head" style="border:0;padding-bottom:0"><span class="eyebrow">Step 2 of 4</span><h1>Your details</h1></div>' + stepsHTML(2) +
      '<div class="co"><form class="panel" id="frm" novalidate><h2>Contact &amp; address</h2><div class="form">' +
      f("fn", "Full name", "text", true, "", "name") + f("ph", "Phone / WhatsApp", "tel", false, "+91", "tel") + f("em", "Email (optional)", "email", false, "", "email") +
      f("a1", "Address line 1", "text", true, "House / flat no., street", "address-line1") + f("a2", "Address line 2 (optional)", "text", true, "Area, landmark", "address-line2") +
      f("ct", "City", "text", false, "", "address-level2") + f("st", "State / region", "text", false, "", "address-level1") + f("pin", "PIN / ZIP code", "text", false, "", "postal-code") +
      '<div class="field"><label for="cn">Country</label><select id="cn" autocomplete="country-name">' + CFG.countries.map(function (c) { return "<option" + ((a.cn || "India") === c ? " selected" : "") + ">" + c + "</option>"; }).join("") + '</select><small></small></div></div>' +
      '<div style="display:flex;gap:12px;margin-top:22px;flex-wrap:wrap"><button class="btn solid" type="submit">Continue to delivery</button><a class="btn line" href="bag.html">Back to bag</a></div></form>' + summary(false) + "</div></div>";
    $("#frm").onsubmit = function (e) {
      e.preventDefault(); var ok = true, v = {};
      ["fn", "ph", "em", "a1", "a2", "ct", "st", "pin", "cn"].forEach(function (k) { v[k] = $("#" + k).value.trim(); });
      [["fn", "Please enter your name."], ["ph", "Please enter a phone number."], ["a1", "Please enter your address."], ["ct", "Please enter your city."], ["st", "Please enter your state."], ["pin", "Please enter your PIN or ZIP code."]].forEach(function (r) { var m = $("#e-" + r[0]); if (!v[r[0]]) { m.textContent = r[1]; ok = false; } else m.textContent = ""; });
      if (v.ph && v.ph.replace(/\D/g, "").length < 8) { $("#e-ph").textContent = "That number looks too short."; ok = false; }
      if (v.em && !/^\S+@\S+\.\S+$/.test(v.em)) { $("#e-em").textContent = "That email looks incomplete."; ok = false; }
      if (!ok) { var first = $$("small").filter(function (s) { return s.textContent; })[0]; if (first) first.previousElementSibling.focus(); return; }
      sset("addr", v); location.href = "delivery.html";
    };
  }

  function delivery() {
    if (!cart.count()) { root().innerHTML = '<div class="wrap">' + emptyBag() + "</div>"; return; }
    var a = sget("addr", null);
    if (!a || !a.fn) { location.replace("checkout.html"); return; }
    var india = a.cn === "India", ship = sget("ship", null), gift = sget("gift", { on: false, note: "" });
    var opts = CFG.shipping.map(function (m) { return Object.assign({ ok: india ? m.where === "in" : m.where === "out" }, m); });
    if (!ship || !opts.some(function (m) { return m.id === ship.id && m.ok; })) { var d = opts.filter(function (m) { return m.ok; })[0]; ship = { id: d.id, name: d.name, eta: d.eta }; }
    root().innerHTML = '<div class="wrap"><div class="page-head" style="border:0;padding-bottom:0"><span class="eyebrow">Step 3 of 4</span><h1>Delivery</h1></div>' + stepsHTML(3) +
      '<div class="co"><div><div class="panel" style="margin-bottom:20px"><h2>Delivering to</h2><p>' + esc(a.fn) + "<br>" + esc(a.a1) + (a.a2 ? ", " + esc(a.a2) : "") + "<br>" + esc(a.ct) + ", " + esc(a.st) + " " + esc(a.pin) + "<br>" + esc(a.cn) + '</p><p style="margin-top:10px"><a class="link" href="checkout.html">Edit address</a></p></div>' +
      '<div class="panel"><h2>Delivery method</h2><div id="methods"></div><h3 style="margin-top:26px">Gift options</h3><label class="chk"><input type="checkbox" id="gw"><span>Pack this order as a gift</span></label><div class="field" id="gnw" hidden><label for="gn">Gift message (optional)</label><textarea id="gn" rows="3" maxlength="200"></textarea></div>' +
      '<div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap"><button class="btn solid" id="go">Review your order</button><a class="btn line" href="checkout.html">Back</a></div></div></div>' + summary(false) + "</div></div>";
    function draw() {
      $("#methods").innerHTML = opts.map(function (m) {
        return '<label class="method ' + (ship.id === m.id ? "on" : "") + (m.ok ? "" : " dis") + '"><input type="radio" name="m" value="' + m.id + '"' + (ship.id === m.id ? " checked" : "") + (m.ok ? "" : " disabled") + '><div><b>' + m.name + "</b><span>" + m.eta + (m.ok ? "" : (india ? " · for addresses outside India" : " · for addresses in India")) + "</span></div><em>" + m.charge + "</em></label>";
      }).join("");
      $$("input[name=m]").forEach(function (r) { r.onchange = function () { var m = opts.filter(function (x) { return x.id === r.value; })[0]; ship = { id: m.id, name: m.name, eta: m.eta }; draw(); }; });
    }
    draw();
    $("#gw").checked = gift.on; $("#gnw").hidden = !gift.on; $("#gn").value = gift.note || "";
    $("#gw").onchange = function () { $("#gnw").hidden = !this.checked; };
    $("#go").onclick = function () { sset("ship", ship); sset("gift", { on: $("#gw").checked, note: $("#gn").value.trim() }); location.href = "order.html"; };
  }

  function orderId() { var o = sget("oid", null); if (!o) { var d = new Date(); o = "MSH-" + String(d.getFullYear()).slice(2) + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) + "-" + Math.floor(1000 + Math.random() * 9000); sset("oid", o); } return o; }
  function orderMsg() {
    var a = sget("addr", {}), ship = sget("ship", {}), gift = sget("gift", {}), id = orderId();
    var lines = cart.get().map(function (i, n) { var p = byId[i.id]; return (n + 1) + ". " + p.name + " (" + p.color + ") | Size " + i.size + " | Qty " + i.qty + " | " + money(p.price * i.qty); });
    return "Hello Mishi Women's Apparel! I'd like to place an order.\nOrder ID: " + id + "\n\n" + lines.join("\n") + "\n\nSubtotal: " + money(cart.total()) + " (delivery charges to be confirmed)\nDelivery: " + (ship.name || "") + "\n" + (gift.on ? "Gift packing: Yes" + (gift.note ? " | Message: " + gift.note : "") + "\n" : "") + "\nName: " + a.fn + "\nPhone: " + a.ph + (a.em ? "\nEmail: " + a.em : "") + "\nAddress: " + a.a1 + (a.a2 ? ", " + a.a2 : "") + ", " + a.ct + ", " + a.st + " " + a.pin + ", " + a.cn + "\n\nPlease confirm availability and share payment details.";
  }
  function order() {
    var done = sget("done", null);
    if (done) { confirmed(done); return; }
    if (!cart.count()) { root().innerHTML = '<div class="wrap">' + emptyBag() + "</div>"; return; }
    var a = sget("addr", null), ship = sget("ship", null), gift = sget("gift", { on: false });
    if (!a || !a.fn) { location.replace("checkout.html"); return; }
    if (!ship) { location.replace("delivery.html"); return; }
    var link = "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(orderMsg());
    root().innerHTML = '<div class="wrap"><div class="page-head" style="border:0;padding-bottom:0"><span class="eyebrow">Step 4 of 4</span><h1>Review &amp; place order</h1></div>' + stepsHTML(4) +
      '<div class="co"><div class="panel"><div class="rv"><div><h4>Contact</h4>' + esc(a.fn) + "<br>" + esc(a.ph) + (a.em ? "<br>" + esc(a.em) : "") + '</div><a href="checkout.html">Edit</a></div>' +
      '<div class="rv"><div><h4>Address</h4>' + esc(a.a1) + (a.a2 ? ", " + esc(a.a2) : "") + "<br>" + esc(a.ct) + ", " + esc(a.st) + " " + esc(a.pin) + "<br>" + esc(a.cn) + '</div><a href="checkout.html">Edit</a></div>' +
      '<div class="rv"><div><h4>Delivery</h4>' + esc(ship.name) + "<br>" + esc(ship.eta) + (gift.on ? "<br>Gift packing" + (gift.note ? ": “" + esc(gift.note) + "”" : "") : "") + '</div><a href="delivery.html">Edit</a></div>' +
      '<div class="rv"><div><h4>How it works</h4>Tap the button below to send your order to us on WhatsApp. We confirm availability, share delivery charges and payment details, then dispatch your parcel.</div></div>' +
      '<label class="chk"><input type="checkbox" id="ack"><span>I have read the <a class="link" href="shipping.html" target="_blank">delivery &amp; store policies</a>.</span></label>' +
      '<a class="btn wa block off" id="place" target="_blank" rel="noopener" href="' + link + '">Place order on WhatsApp</a>' +
      '<button class="btn line block" style="margin-top:10px" id="copy">Copy order message</button><p class="muted" id="cm" style="font-size:12px;margin-top:8px;min-height:18px"></p><p class="muted" style="font-size:12px">Prefer to call? ' + CFG.phone + "</p></div>" + summary(true) + "</div></div>";
    $("#ack").onchange = function () { $("#place").classList.toggle("off", !this.checked); };
    $("#place").onclick = function () { setTimeout(function () { var d = { id: orderId(), at: Date.now() }; sset("done", d); confirmed(d); }, 600); };
    $("#copy").onclick = function () {
      var t = orderMsg(), m = $("#cm");
      try { navigator.clipboard.writeText(t).then(function () { m.textContent = "Order message copied. Paste it into WhatsApp."; }, function () { m.textContent = "Copy was blocked. Use the WhatsApp button instead."; }); } catch (e) { m.textContent = "Copy was blocked. Use the WhatsApp button instead."; }
    };
  }
  function confirmed(d) {
    root().innerHTML = '<div class="wrap"><div class="done-box"><span class="eyebrow">Thank you</span><h1>Your order is on its way to us</h1><p class="muted">If WhatsApp did not open, send your message to ' + CFG.phone + ' with your order ID.</p><div class="oid tn">' + esc(d.id) + '</div><p class="muted" style="margin-bottom:28px">We will confirm availability, share delivery charges and payment details, and dispatch your parcel.</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/' + CFG.whatsapp + "?text=" + encodeURIComponent("Hi Mishi, following up on order " + d.id) + '">Message us about this order</a><button class="btn line" id="again">Continue shopping</button></div></div></div>';
    $("#again").onclick = function () { cart.set([]); ["done", "oid", "ship", "gift"].forEach(sdel); location.href = "shop.html#all"; };
  }

  function wishlist() {
    var list = wish.get().map(function (id) { return byId[id]; }).filter(Boolean);
    root().innerHTML = '<div class="wrap"><div class="page-head"><span class="eyebrow">Saved for later</span><h1>Your wishlist</h1></div><div style="padding-block:34px 90px">' +
      (list.length ? '<div class="grid">' + list.map(card).join("") + "</div>" : '<div class="empty"><h2>Nothing saved yet</h2><p>Tap the heart on any piece to keep it here.</p><a class="btn solid" href="shop.html#all">Explore the collection</a></div>') + "</div></div>";
  }

  function contact() {
    var wa = function (t) { return "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(t); };
    $("#wa-form").onsubmit = function (e) {
      e.preventDefault(); var n = $("#cname").value.trim(), m = $("#cmsg").value.trim();
      if (!m) { $("#cerr").textContent = "Please write your message."; return; }
      $("#cerr").textContent = ""; var l = $("#clink"); l.href = wa((n ? "Hi, I'm " + n + ". " : "Hi. ") + m); l.hidden = false; l.focus();
    };
  }

  window.Mishi = { wishlist: wishlist, layout: layout, home: home, shop: shop, product: product, bag: bag, checkout: checkout, delivery: delivery, order: order, contact: contact, CFG: CFG };
})();
