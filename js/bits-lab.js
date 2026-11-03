/* Bits lab — six ways to present the "Bits of me" photos.
   Scratch page. Nothing here is loaded by index.html. */
(() => {
  const D = window.MINKO;
  const BITS = D.interests;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* Short labels, so the calmer options can carry a word instead of a story. */
  const LABEL = {
    twins: "twin sister",
    ballet: "ballet",
    travel: "15+ countries",
    cats: "foster kittens",
    food: "cooking & eating",
    crafts: "yarn & ink",
    forky: "forky",
    coffee: "home lattes",
    bear: "shelliemay"
  };
  const HINT = {
    twins: "tap to see double",
    ballet: "tap for a pirouette",
    travel: "tap to open the map",
    cats: "tap to let them out",
    food: "tap if you’re hungry",
    crafts: "tap to unspool",
    forky: "tap to say hi",
    coffee: "tap for a fresh cup",
    bear: "tap for bedtime"
  };

  /* Every option reads the photo's real shape at runtime and writes it to
     --ar, the same trick the live timeline uses. decode() rather than a load
     listener, because a cached image never fires load. */
  function trueRatio(img) {
    const apply = () => {
      if (!img.naturalWidth) return;
      const box = img.closest("[data-ar]") || img.parentElement;
      box.style.setProperty("--ar", img.naturalWidth / img.naturalHeight);
    };
    if (img.complete && img.naturalWidth) apply();
    else img.decode().then(apply).catch(() => img.addEventListener("load", apply, { once: true }));
  }
  const measure = (root) => root.querySelectorAll("img").forEach(trueRatio);

  const rot = (i, amt = 3) => (((i * 37) % 100) / 100 - 0.5) * 2 * amt;

  /* ------------------------------------------------------------------ 1. deck
     One polaroid per bit, the rest of the photos stacked behind it. Only the
     top photo is ever visible, so nine bits show nine pictures, not thirty. */
  function deck() {
    $("[data-deck]").innerHTML = BITS.map(
      (b, i) => `
      <article class="dk" style="--r:${rot(i, 2.4).toFixed(2)}deg">
        <button class="dk-stack" type="button" aria-label="${esc(b.title)} — next photo">
          ${b.photos
            .map(
              (p, j) => `<span class="dk-card" data-ar style="--j:${j};--rr:${rot(i + j * 5, 5).toFixed(
                2
              )}deg" ${j ? "" : 'data-top="1"'}>
                 <img src="${p}" alt="" loading="lazy">
               </span>`
            )
            .join("")}
          ${b.photos.length > 1 ? `<span class="dk-count">1/${b.photos.length}</span>` : ""}
        </button>
        <div class="dk-copy">
          <span class="dk-emoji">${b.emoji}</span>
          <h3>${esc(b.title)}</h3>
          <p class="hand">${esc(b.headline)}</p>
        </div>
      </article>`
    ).join("");

    $("[data-deck]")
      .querySelectorAll(".dk-stack")
      .forEach((stack) => {
        const cards = [...stack.querySelectorAll(".dk-card")];
        const count = stack.querySelector(".dk-count");
        let at = 0;
        stack.addEventListener("click", () => {
          if (cards.length < 2) return;
          at = (at + 1) % cards.length;
          cards.forEach((c, k) => {
            const order = (k - at + cards.length) % cards.length;
            c.style.setProperty("--j", order);
            c.toggleAttribute("data-top", order === 0);
          });
          if (count) count.textContent = `${at + 1}/${cards.length}`;
        });
      });
    measure($("[data-deck]"));
  }

  /* ----------------------------------------------------------------- 2. bento
     Plain soft rectangles at three sizes. No masks, no rotation, no tape. The
     title sits on the photo; the story only appears on hover. */
  function bento() {
    const SPAN = { twins: 6, travel: 6, food: 5, cats: 4, ballet: 3, crafts: 4, forky: 3, coffee: 3, bear: 3 };
    $("[data-bento]").innerHTML = BITS.map(
      (b) => `
      <article class="bn bn-${b.key}" style="--span:${SPAN[b.key] || 3}">
        <div class="bn-media">
          ${b.photos
            .slice(0, 3)
            .map((p, j) => `<img src="${p}" alt="" loading="lazy" class="${j ? "" : "is-on"}">`)
            .join("")}
          ${b.photos.length > 1 ? `<span class="bn-chip">${b.photos.length} photos</span>` : ""}
        </div>
        <div class="bn-text">
          <h3><span>${b.emoji}</span> ${esc(b.title)}</h3>
          <p>${esc(b.story)}</p>
        </div>
      </article>`
    ).join("");

    /* The extra photos cycle while the pointer is on the tile, which keeps the
       resting state quiet and still shows there is more than one. */
    $("[data-bento]")
      .querySelectorAll(".bn")
      .forEach((tile) => {
        const imgs = [...tile.querySelectorAll("img")];
        let at = 0;
        let timer = null;
        if (imgs.length < 2) return;
        tile.addEventListener("mouseenter", () => {
          timer = setInterval(() => {
            imgs[at].classList.remove("is-on");
            at = (at + 1) % imgs.length;
            imgs[at].classList.add("is-on");
          }, 1100);
        });
        tile.addEventListener("mouseleave", () => {
          clearInterval(timer);
          imgs.forEach((im, k) => im.classList.toggle("is-on", k === 0));
          at = 0;
        });
      });
  }

  /* --------------------------------------------------------------- 3. sticker
     One flat sheet instead of nine cards. Each photo is its own sticker at its
     own shape, in a masonry column flow, with a handwritten label. */
  function stickers() {
    const all = [];
    BITS.forEach((b) => {
      b.photos.forEach((p, j) => all.push({ src: p, bit: b, first: j === 0 }));
    });
    /* Deal them out so two photos of the same bit rarely sit next to each other. */
    const spread = [];
    const byBit = BITS.map((b) => all.filter((x) => x.bit === b));
    let more = true;
    for (let round = 0; more; round++) {
      more = false;
      byBit.forEach((list) => {
        if (list[round]) {
          spread.push(list[round]);
          more = true;
        }
      });
    }
    $("[data-stickers]").innerHTML = spread
      .map(
        (x, i) => `
      <figure class="st" style="--r:${rot(i, 3.4).toFixed(2)}deg" data-ar>
        <img src="${x.src}" alt="" loading="lazy">
        ${x.first ? `<figcaption><span>${x.bit.emoji}</span> ${esc(LABEL[x.bit.key] || x.bit.title)}</figcaption>` : ""}
      </figure>`
      )
      .join("");
    measure($("[data-stickers]"));
  }

  /* ----------------------------------------------------------------- 4. strip
     One row per bit: a short title block, then every photo of that bit at one
     shared height and its own natural width. Drag or scroll the row. */
  function strips() {
    $("[data-strips]").innerHTML = BITS.map(
      (b) => `
      <section class="sp">
        <div class="sp-head">
          <span class="sp-emoji">${b.emoji}</span>
          <h3>${esc(b.title)}</h3>
          <p class="hand">${esc(b.headline)}</p>
          <p class="sp-story">${esc(b.story)}</p>
        </div>
        <div class="sp-rail" tabindex="0" aria-label="${esc(b.title)} photos">
          ${b.photos
            .map((p) => `<span class="sp-shot" data-ar><img src="${p}" alt="" loading="lazy"></span>`)
            .join("")}
        </div>
      </section>`
    ).join("");
    measure($("[data-strips]"));
  }

  /* ------------------------------------------------------------------ 5. list
     Nine lines of type. Nothing shows until you point at a line, then its
     photos follow the cursor. The quietest option by a long way. */
  function list() {
    const wrap = $("[data-list]");
    wrap.innerHTML = `
      <ul class="ls-rows">
        ${BITS.map(
          (b, i) => `
          <li class="ls-row" data-key="${b.key}">
            <span class="ls-n">0${i + 1}</span>
            <span class="ls-title">${esc(b.title)}</span>
            <span class="ls-label">${esc(LABEL[b.key] || "")}</span>
            <span class="ls-emoji">${b.emoji}</span>
          </li>`
        ).join("")}
      </ul>
      <div class="ls-float" data-float aria-hidden="true"></div>`;

    const float = $("[data-float]", wrap);
    const panes = {};
    BITS.forEach((b) => {
      const d = document.createElement("div");
      d.className = "ls-pane";
      d.innerHTML = b.photos
        .slice(0, 3)
        .map(
          (p, j) =>
            `<span class="ls-shot" data-ar style="--r:${rot(j * 7, 6).toFixed(2)}deg;--k:${j}"><img src="${p}" alt="" loading="lazy"></span>`
        )
        .join("");
      float.append(d);
      panes[b.key] = d;
    });
    measure(float);

    let raf = null;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    const tick = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      float.style.transform = `translate3d(${x}px,${y}px,0)`;
      raf = requestAnimationFrame(tick);
    };
    wrap.addEventListener("pointermove", (e) => {
      const r = wrap.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!raf) {
        x = tx;
        y = ty;
        tick();
      }
    });
    wrap.querySelectorAll(".ls-row").forEach((row) => {
      const show = () => {
        Object.values(panes).forEach((p) => p.classList.remove("is-on"));
        panes[row.dataset.key].classList.add("is-on");
        float.classList.add("is-on");
      };
      row.addEventListener("pointerenter", show);
      row.addEventListener("focus", show);
    });
    wrap.addEventListener("pointerleave", () => {
      float.classList.remove("is-on");
      cancelAnimationFrame(raf);
      raf = null;
    });
  }

  /* -------------------------------------------------------------- 6. pinboard
     Nine small covers on a board. One opens at a time into a wide panel that
     holds the full photo set, the story, and room for the critter. */
  function board() {
    const wrap = $("[data-board]");
    wrap.innerHTML = `
      <div class="bd-grid">
        ${BITS.map(
          (b, i) => `
          <button class="bd-pin" type="button" data-key="${b.key}" style="--r:${rot(i, 3).toFixed(2)}deg">
            <span class="bd-tack" aria-hidden="true"></span>
            <span class="bd-cover" data-ar><img src="${b.photos[0]}" alt="" loading="lazy"></span>
            <span class="bd-name"><i>${b.emoji}</i> ${esc(LABEL[b.key] || b.title)}</span>
          </button>`
        ).join("")}
      </div>
      <div class="bd-open" data-open hidden></div>`;

    const open = $("[data-open]", wrap);
    const draw = (b) => {
      open.hidden = false;
      open.innerHTML = `
        <button class="bd-close" type="button" aria-label="close">×</button>
        <div class="bd-open-copy">
          <span class="bd-emoji">${b.emoji}</span>
          <h3>${esc(b.title)}</h3>
          <p class="hand">${esc(b.headline)}</p>
          <p>${esc(b.story)}</p>
          <p class="bd-egg">${esc(HINT[b.key] || "tap for a surprise")} ✨ <i>(the critter lives here)</i></p>
        </div>
        <div class="bd-open-shots">
          ${b.photos
            .map((p) => `<span class="bd-shot" data-ar><img src="${p}" alt="" loading="lazy"></span>`)
            .join("")}
        </div>`;
      measure(open);
      $(".bd-close", open).addEventListener("click", () => {
        open.hidden = true;
        wrap.querySelectorAll(".bd-pin").forEach((p) => p.classList.remove("is-on"));
      });
    };
    wrap.querySelectorAll(".bd-pin").forEach((pin) => {
      pin.addEventListener("click", () => {
        const was = pin.classList.contains("is-on");
        wrap.querySelectorAll(".bd-pin").forEach((p) => p.classList.remove("is-on"));
        if (was) {
          open.hidden = true;
          return;
        }
        pin.classList.add("is-on");
        draw(BITS.find((b) => b.key === pin.dataset.key));
      });
    });
    measure(wrap);
  }

  deck();
  bento();
  stickers();
  strips();
  list();
  board();
})();
