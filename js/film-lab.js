/* Film lab — renders the same four films into five layouts so they can be
   compared. Reads window.MINKO.films; changes nothing on the live site. */
(() => {
  "use strict";

  /* The data moved from MINKO.videos to MINKO.films when the live section was
     rebuilt as feature + rail. This page is a comparison of the OLD options,
     so it adapts the new shape back rather than being rewritten: a self-hosted
     film has no `embed`, so its mp4 stands in for one and the host label
     becomes where the file actually lives. */
  const V = ((window.MINKO && window.MINKO.films) || []).map((f) => ({
    ...f,
    embed: f.embed || f.src,
    source: f.source || f.src,
    host: f.host || "this site"
  }));
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  /* Deterministic tilt, so a reload never reshuffles the paper. */
  const rot = (i, amp) => (((i * 37) % 11) / 10 - 0.5) * 2 * amp;

  /* The four films are not one shape: two landscape, one square-ish Instagram
     post, one vertical reel. Every layout below has to answer for that. */
  const shapeOf = (v) =>
    /\/reel\//.test(v.embed) ? "vertical" : /instagram\.com/.test(v.embed) ? "square" : "wide";

  /* ------------------------------------------------------------- playback */
  const isYouTube = (src) => /(?:^|\.)youtube(?:-nocookie)?\.com\/embed\//.test(src);
  const hasOrigin = location.origin && location.origin !== "null";

  function playableSrc(src) {
    if (!isYouTube(src)) return src;
    const url = new URL(src);
    url.hostname = "www.youtube.com";
    url.searchParams.set("origin", location.origin);
    url.searchParams.set("widget_referrer", location.origin);
    return url.toString();
  }

  /* One poster frame that swaps itself for the real player on click. */
  function frame(v, extraClass) {
    const shape = shapeOf(v);
    return `<div class="v-frame ${shape === "wide" ? "" : "is-" + shape} ${extraClass || ""}"
                 data-embed="${esc(v.embed)}" data-away="${esc(v.source)}"
                 role="button" tabindex="0" aria-label="Play ${esc(v.title)}">
              <img src="${esc(v.poster)}" alt="${esc(v.title)}" loading="lazy" decoding="async">
              <span class="v-play" aria-hidden="true">▶</span>
            </div>`;
  }

  function play(el) {
    const src = el.dataset.embed;
    if (isYouTube(src) && !hasOrigin) {
      window.open(el.dataset.away || src, "_blank", "noopener");
      return;
    }
    if (el.dataset.loaded) return;
    el.dataset.loaded = "1";
    const iframe = document.createElement("iframe");
    iframe.src = playableSrc(src);
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.title = "Embedded player";
    el.appendChild(iframe);
    el.classList.add("is-playing");
    const cell = el.closest(".cell");
    if (cell) cell.classList.add("is-playing");
  }

  document.addEventListener("click", (e) => {
    const f = e.target.closest(".v-frame");
    if (f) play(f);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const f = document.activeElement && document.activeElement.closest(".v-frame");
    if (f) {
      e.preventDefault();
      play(f);
    }
  });

  const mount = (sel, html) => {
    const el = document.querySelector(sel);
    if (el) el.innerHTML = html;
    return el;
  };

  /* ==================================================== 1. cinema marquee */
  (() => {
    const root = document.querySelector("[data-opt-marquee]");
    if (!root) return;
    let current = 0;

    function render() {
      const v = V[current];
      root.innerHTML = `
        <div class="marquee-bulbs" aria-hidden="true">${"<i></i>".repeat(9)}</div>
        <div class="marquee-screen">${frame(v)}</div>
        <div class="marquee-now">
          <h3>${esc(v.title)}</h3>
          <p>${esc(v.note)}</p>
          <a href="${esc(v.source)}" target="_blank" rel="noopener">watch on ${esc(v.host)} ↗</a>
        </div>
        <div class="stubs">
          ${V.map(
            (f, i) => `<button class="stub" type="button" data-pick="${i}"
                               style="--r:${rot(i, 1.6)}deg" aria-pressed="${i === current}">
              <span class="stub-row">admit one <small>no. ${String(i + 1).padStart(2, "0")}</small></span>
              <strong>${esc(f.title)}</strong>
              <small>${esc(f.host)}</small>
            </button>`
          ).join("")}
        </div>`;
    }

    root.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-pick]");
      if (!pick) return;
      current = Number(pick.dataset.pick);
      render();
    });

    render();
  })();

  /* ==================================================== 2. contact sheet */
  (() => {
    mount(
      "[data-opt-sheet]",
      `<div class="sheet-grid">
        ${V.map(
          (v, i) => `<div class="cell">
            <span class="cell-no">${String(i + 1).padStart(2, "0")}</span>
            ${frame(v)}
            <div class="cell-cap">
              <strong>${esc(v.title)}</strong>
              <span>${esc(v.note)}</span>
            </div>
          </div>`
        ).join("")}
      </div>`
    );
  })();

  /* ====================================================== 3. reel index */
  (() => {
    const root = document.querySelector("[data-opt-index]");
    if (!root) return;
    let current = 0;

    function render() {
      const v = V[current];
      root.innerHTML = `
        <div class="index-split">
          <div class="index-list">
            ${V.map(
              (f, i) => `<button class="slate" type="button" data-pick="${i}" aria-pressed="${i === current}">
                <span class="slate-no" aria-hidden="true">${i + 1}</span>
                <span class="slate-copy">
                  <strong>${esc(f.title)}</strong>
                  <span>${esc(f.host)}</span>
                </span>
              </button>`
            ).join("")}
          </div>
          <div class="index-stage">
            <div class="index-screen">${frame(v)}</div>
            <div class="index-bar">
              <h3>${esc(v.title)}</h3>
              <p>${esc(v.note)}</p>
              <a href="${esc(v.source)}" target="_blank" rel="noopener">watch on ${esc(v.host)} ↗</a>
            </div>
          </div>
        </div>`;
    }

    root.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-pick]");
      if (!pick) return;
      current = Number(pick.dataset.pick);
      render();
    });

    render();
  })();

  /* ================================================= 4. editorial strips */
  (() => {
    mount(
      "[data-opt-strips]",
      `<div class="strips">
        ${V.map(
          (v, i) => `<article class="strip ${i % 2 ? "is-flip" : ""}">
            <div class="strip-media" style="--r:${rot(i + 2, 1.1)}deg">${frame(v)}</div>
            <div class="strip-copy">
              <p class="reel-no">reel ${String(i + 1).padStart(2, "0")}</p>
              <h3>${esc(v.title)}</h3>
              <p>${esc(v.note)}</p>
              <a class="button is-small" href="${esc(v.source)}" target="_blank" rel="noopener">
                watch on ${esc(v.host)} ↗
              </a>
            </div>
          </article>`
        ).join("")}
      </div>`
    );
  })();

  /* ======================================================= 5. tape shelf */
  (() => {
    const root = document.querySelector("[data-opt-vhs]");
    if (!root) return;
    let current = 0;

    function render() {
      const v = V[current];
      root.innerHTML = `
        <div class="vhs-stack">
          <div class="vhs-tv">
            <div class="vhs-screen">${frame(v)}</div>
            <span class="vhs-label">▶ ${esc(v.title)}</span>
            <span class="vhs-knobs" aria-hidden="true"><i></i><i></i></span>
          </div>
          <div class="tapes">
            ${V.map(
              (f, i) => `<button class="tape-case" type="button" data-pick="${i}"
                                 style="--r:${rot(i + 1, 1.8)}deg" aria-pressed="${i === current}">
                <span class="tape-window"><img src="${esc(f.poster)}" alt="" loading="lazy"></span>
                <span class="tape-sticker">
                  <b>${esc(f.title)}</b>
                  <span>${esc(f.host)} · no. ${String(i + 1).padStart(2, "0")}</span>
                </span>
              </button>`
            ).join("")}
          </div>
        </div>`;
    }

    root.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-pick]");
      if (!pick) return;
      current = Number(pick.dataset.pick);
      render();
    });

    render();
  })();
})();
