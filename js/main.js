/* Version 3 — Paper Scrapbook.
   Warm paper, handwriting, tape. The hero is a photograph that lands and
   develops, then the name drops in letter by letter and stays pokeable.
   "Bits of me" cards each hide a small animated surprise. */
(function () {
  "use strict";
  const D = window.MINKO;
  const M = window.MinkoMotion;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rot = (i, spread) => ((i * 37) % (spread * 2) - spread).toFixed(2);
  const motion = !M.reduced && !!window.gsap;
  const fx = $("[data-fx]");

  /* ================================================================ render */
  $(".hello-text").textContent = D.profile.bio;
  $("[data-year]").textContent = new Date().getFullYear();

  /* ------------------------------------------------------------- my path */
  const entries = D.education
    .map((e) => ({
      kind: "school",
      year: e.year,
      title: e.school,
      sub: e.degree,
      meta: e.period + " · " + e.place,
      place: e.place,
      body: [e.detail],
      /* A school can carry a set like a job does; `photo` is the single-image
         shorthand for one that only has the one. */
      photos: e.photos || [e.photo]
    }))
    .concat(
      D.work.map((w) => ({
        kind: "work",
        year: w.year,
        title: w.company,
        sub: w.role,
        meta: w.period + " · " + w.place,
        place: w.place,
        body: w.points,
        photos: w.photos,
        tags: w.tags
      }))
    )
    .sort((a, b) => a.year - b.year);

  $("[data-timeline]").innerHTML = entries
    .map(
      (e, i) => `<article class="step ${i % 2 ? "is-flip" : ""}">
        <div class="step-note note-${e.kind}" data-reveal="${i % 2 ? "left" : "right"}" style="--r:${rot(i, 1.6)}deg">
          <span class="pin" aria-hidden="true"></span>
          <div class="note-head">
            <span class="note-year">${esc(e.year)}</span>
            <span class="note-kind">${esc(e.kind)}</span>
          </div>
          <h3>${esc(e.title)}</h3>
          <p class="note-sub">${esc(e.sub)}</p>
          <p class="note-meta">${esc(e.meta)}</p>
          ${e.tags ? `<ul class="note-tags">${e.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
          <ul class="note-points">${e.body.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </div>
        <div class="step-photos count-${Math.min(e.photos.length, 3)}" data-step-photos>
          <span class="year-stamp" aria-hidden="true">${esc(e.year)}</span>
          ${e.photos
            .slice(0, 3)
            .map(
              (p, j) => `<figure class="snap snap-${j}" style="--r:${rot(i * 3 + j + 1, 5)}deg">
                <span class="tape ${j % 2 ? "tape-br" : "tape-tl"}" aria-hidden="true"></span>
                <img src="${p}" alt="${esc(e.title)}" loading="lazy">
              </figure>`
            )
            .join("")}
          <p class="step-place">${esc(e.place.toLowerCase())}</p>
        </div>
      </article>`
    )
    .join("");

  /* Each polaroid is sized by its photo's real shape, so a portrait phone shot
     stays portrait instead of being cropped to a uniform frame. The ratio is
     only knowable once the image has loaded, hence this rather than a number
     in the data: it keeps working when a photo is swapped for one of another
     shape. decode() also resolves for an already-cached image, where a load
     listener would never fire. */
  $$(".snap img").forEach((img) => {
    const fit = () => {
      if (img.naturalWidth && img.naturalHeight) {
        img.style.setProperty("--ar", `${img.naturalWidth} / ${img.naturalHeight}`);
      }
      sizeCluster(img.closest("[data-step-photos]"));
    };
    if (img.decode) img.decode().then(fit, fit);
    else img.addEventListener("load", fit);
  });

  /* Knowing each photo's shape is not enough to make a cluster of mixed shapes
     look deliberate. In equal columns a landscape photo comes out short and a
     portrait one tall, and the pair reads as an accident — which is why the
     clusters of three landscape photos always looked settled and the mixed
     ones did not.

     The fix is the standard justified-gallery rule, the one behind Flickr's
     justified-layout: in a row of photos, each photo's width is proportional
     to its aspect ratio, which makes every photo in the row the same height.
     Flickr's library solves it in pixels; CSS can express the same thing
     directly, because fr units distribute space in proportion. So the row
     becomes `grid-template-columns: <ar0>fr <ar1>fr` and the browser does the
     arithmetic, at every window width, with no measuring and no resize
     listener.

     With one correction the library does not need. Matching heights exactly
     means a 9:16 phone photo beside a 16:9 one gets 24% of the row, which is
     a sliver — too small to see what is in it. So the narrower frame has a
     floor of 34% of the row. Below that floor the two heights no longer match
     exactly, and that is the better trade: a 1.3x height stagger reads as
     hand-placed, a photo too small to read does not.

     The third frame is sized from the row's height rather than given a fixed
     share of the width, so it comes out consistently a little shorter than the
     pair above it whatever its shape. A fixed width share made a portrait
     third tower over the row and a landscape third look incidental.

     Two consequences worth knowing. The portrait photo goes on the left and
     the landscape on the right, because a tall frame on the outside edge makes
     the cluster lean away from the note. And the photo on the stamp side is
     the one dropped down the page. */
  function sizeCluster(group) {
    if (!group) return;
    const snaps = $$(".snap", group);
    if (snaps.length < 2) return;
    const ratios = snaps.map((s) => {
      const im = $("img", s);
      return im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 0;
    });
    if (ratios.slice(0, 2).some((r) => !r)) return;

    const portraitFirst = ratios[1] < ratios[0];
    const left = portraitFirst ? snaps[1] : snaps[0];
    const right = portraitFirst ? snaps[0] : snaps[1];
    const arLeft = portraitFirst ? ratios[1] : ratios[0];
    const arRight = portraitFirst ? ratios[0] : ratios[1];
    left.style.order = 1;
    right.style.order = 2;

    const FLOOR = 0.34; /* no frame narrower than a third of the row */
    let shareLeft = arLeft / (arLeft + arRight);
    shareLeft = Math.min(Math.max(shareLeft, FLOOR), 1 - FLOOR);
    group.style.gridTemplateColumns = `${shareLeft.toFixed(4)}fr ${(1 - shareLeft).toFixed(4)}fr`;

    /* The third frame, in units of the cluster's width: the row's height times
       the third photo's own ratio, at 72%, and never wider than 60% or
       narrower than 30% of the row. */
    if (ratios[2]) {
      const rowH = shareLeft / arLeft;
      const third = Math.min(Math.max(rowH * 0.72 * ratios[2], 0.3), 0.6);
      group.style.setProperty("--third-w", `${(third * 100).toFixed(1)}%`);
    }

    const flipped = group.closest(".step")?.classList.contains("is-flip");
    snaps.forEach((s) => s.classList.remove("is-drop", "is-lap"));
    right.classList.add("is-lap");
    (flipped ? left : right).classList.add("is-drop");
  }

  /* ---------------------------------------------------------------- film */
  /* Two labelled shelves: the long-form films on top, the vertical reels
     below. Everything is on screen on arrival. The layout before this put one
     film on a big screen and the other behind a tab, which meant the section
     showed one film while claiming two — a tab is for alternative views of one
     thing, not for separate pieces of work.

     No film is ever cropped: the tile carries the film's own aspect ratio, so
     a 9:16 reel gets a 9:16 frame and a 16:9 film gets a 16:9 one.

     Every film is a self-hosted MP4 in a real <video>. Nothing is embedded. */
  (() => {
    const root = $("[data-shelves]");
    if (!root) return;

    const ratio = (f) => (f.kind === "film" ? "16 / 9" : "9 / 16");
    const shape = (f) => (f.kind === "film" ? "16:9" : "9:16");

    /* preload="none" so a visitor who scrolls past pays for none of it: the six
       MP4s are 168 MB between them. The observer raises it to metadata only
       when a tile is near the viewport, which is what makes the poster and the
       duration appear without fetching the film. */
    const near = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.preload = "metadata";
            near.unobserve(e.target);
          }
        }),
      { rootMargin: "300px" }
    );

    const hoverable = matchMedia("(hover: hover)").matches;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

    function tile(f) {
      const el = document.createElement("figure");
      el.className = "tile tile--" + f.kind;
      el.style.setProperty("--ratio", ratio(f));
      el.innerHTML = `
        <div class="tile-media">
          <video src="${f.src}" poster="${f.poster}" preload="none" muted loop playsinline
                 aria-label="${esc(f.title)}"></video>
          <span class="tile-badge">${shape(f)} · ${esc(f.len)}</span>
          <button class="tile-play" type="button" aria-label="Watch ${esc(f.title)} with sound">▶</button>
        </div>
        <figcaption>
          <strong>${esc(f.title)}</strong>
          <span>${esc(f.note)}</span>
        </figcaption>`;

      const v = $("video", el);
      near.observe(v);

      /* A muted preview on hover is the cheapest way to show a tile is moving
         footage and not a still. Deliberately not autoplay-on-scroll: six
         looping videos while someone reads is noise. On touch there is no
         hover, so the button is the real control. */
      if (hoverable && !calm) {
        el.addEventListener("pointerenter", () => {
          if (v.controls) return;
          v.muted = true;
          v.play().catch(() => {});
        });
        el.addEventListener("pointerleave", () => {
          if (v.controls) return;
          v.pause();
          v.currentTime = 0;
        });
      }

      $(".tile-play", el).onclick = () => {
        v.muted = false;
        v.loop = false;
        v.controls = true;
        el.classList.add("is-playing");
        v.play().catch(() => {});
      };

      return el;
    }

    [
      { key: "film", label: "Films", sub: "the long-form work" },
      { key: "reel", label: "Reels", sub: "short vertical pieces" }
    ].forEach((g) => {
      const items = D.films.filter((f) => f.kind === g.key);
      if (!items.length) return;
      const shelf = document.createElement("div");
      shelf.className = "shelf shelf--" + g.label.toLowerCase();
      shelf.innerHTML = `<p class="shelf-label"><b>${g.label}</b><span>${items.length} · ${g.sub}</span></p>
                         <div class="shelf-row"></div>`;
      const row = $(".shelf-row", shelf);
      items.forEach((f) => row.append(tile(f)));
      root.append(shelf);
    });
  })();

  /* --------------------------------------------------------------- album */
  /* The deck reader: a shelf of decks on the left, one slide at a time on the
     right. Pages are prerendered WebP images (tools/prep_decks.py), so there
     is no PDF to download and no viewer library to load. */
  (() => {
    const list = $("[data-deck-list]");
    const stage = $("[data-deck-stage]");
    const pips = $("[data-deck-pips]");
    const count = $("[data-deck-count]");
    const pdfLink = $("[data-deck-pdf]");
    if (!list || !stage) return;

    const slide = (deck, n) => `${deck.slug}/p${String(n).padStart(2, "0")}.webp`;
    const src = (deck, n) => `assets/design-album/slides/${slide(deck, n)}`;

    let deckIndex = 0;
    let page = 1;

    /* The shelf. One button per deck, each a little paper card. */
    list.innerHTML = D.design
      .map(
        (d, i) => `<button class="shelf-item" type="button" role="tab" data-deck="${i}"
                           style="--r:${rot(i + 1, 1.4)}deg" aria-selected="false">
          <span class="shelf-thumb"><img src="${src(d, 1)}" alt="" loading="lazy" decoding="async"></span>
          <span class="shelf-copy">
            <span class="shelf-kind">${esc(d.kind)}</span>
            <strong>${esc(d.title)}</strong>
            <span class="shelf-meta">${d.pages} ${d.pages === 1 ? "page" : "pages"}</span>
          </span>
        </button>`
      )
      .join("");

    function showPage(n) {
      const deck = D.design[deckIndex];
      if (n < 1 || n > deck.pages) return;
      page = n;
      stage.querySelectorAll("[data-slide]").forEach((img, i) =>
        img.classList.toggle("is-on", i === n - 1)
      );
      pips.querySelectorAll("button").forEach((p, i) =>
        p.setAttribute("aria-current", String(i === n - 1))
      );
      count.textContent = `${deck.title} · ${n} of ${deck.pages}`;
      stage.querySelector("[data-deck-prev]").disabled = n === 1;
      stage.querySelector("[data-deck-next]").disabled = n === deck.pages;
    }

    function openDeck(i) {
      deckIndex = i;
      const deck = D.design[i];

      list.querySelectorAll("[data-deck]").forEach((b, n) =>
        b.setAttribute("aria-selected", String(n === i))
      );

      /* Slides stack in one frame and cross-fade, so paging never reflows the
         section. Only the first two load eagerly. */
      stage.innerHTML =
        deck.pages
          ? Array.from({ length: deck.pages }, (_, k) => {
              const n = k + 1;
              return `<img data-slide data-page="${n}" src="${src(deck, n)}"
                        alt="${esc(deck.title)}, slide ${n} of ${deck.pages}"
                        loading="${n <= 2 ? "eager" : "lazy"}" decoding="async"
                        data-lightbox data-lightbox-group="deck-${deck.slug}"
                        data-caption="${esc(deck.title)} — slide ${n} of ${deck.pages}">`;
            }).join("")
          : "";
      stage.insertAdjacentHTML(
        "beforeend",
        `<button class="reader-nav is-prev" type="button" data-deck-prev aria-label="Previous slide">‹</button>
         <button class="reader-nav is-next" type="button" data-deck-next aria-label="Next slide">›</button>
         <span class="reader-hint hand">click to enlarge</span>`
      );

      pips.innerHTML = Array.from({ length: deck.pages }, (_, k) => {
        const n = k + 1;
        return `<button type="button" data-pip="${n}" aria-label="Slide ${n}" aria-current="false">
                  <img src="${src(deck, n)}" alt="" loading="lazy" decoding="async">
                </button>`;
      }).join("");

      /* A slide that fails to arrive gets one retry past the cache, then a
         quiet label. Without this, one dropped request leaves Chrome's broken
         image icon and the whole alt sentence sprawled across the stage, and
         the failure stays cached until a hard reload. */
      stage.querySelectorAll("img").forEach(watch);
      pips.querySelectorAll("img").forEach(watch);

      pdfLink.href = deck.pdf;
      pdfLink.setAttribute("aria-label", `Open ${deck.title} as a PDF`);
      showPage(1);
    }

    function watch(img) {
      img.addEventListener("error", () => {
        if (!img.dataset.retried) {
          img.dataset.retried = "1";
          const url = new URL(img.src, location.href);
          url.searchParams.set("r", Date.now());
          img.src = url.pathname + url.search;
          return;
        }
        img.classList.add("is-missing");
        /* Drop the sentence; the frame itself carries a short note in CSS. */
        img.alt = "";
        img.removeAttribute("data-lightbox");
      });
    }

    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-deck]");
      if (btn) openDeck(Number(btn.dataset.deck));
    });

    pips.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pip]");
      if (btn) showPage(Number(btn.dataset.pip));
    });

    stage.addEventListener("click", (e) => {
      if (e.target.closest("[data-deck-prev]")) showPage(page - 1);
      if (e.target.closest("[data-deck-next]")) showPage(page + 1);
    });

    /* Arrow keys page the deck while the album is the section on screen. */
    document.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (document.querySelector(".lightbox.is-open")) return;
      const box = $("#design").getBoundingClientRect();
      if (box.top > innerHeight * 0.5 || box.bottom < innerHeight * 0.5) return;
      showPage(page + (e.key === "ArrowRight" ? 1 : -1));
    });

    openDeck(0);
  })();

  /* ---------------------------------------------------------- bits of me */
  /* Each card has its own photo arrangement and shapes, set in styles.css by key. */
  const SHAPES = {
    twins: ["circle", "circle", "heart"],
    ballet: ["arch", "circle", "arch"],
    travel: ["stamp", "stamp", "stamp", "stamp", "stamp"],
    cats: ["blob", "circle", "circle", "heart"],
    food: ["plate", "plate", "plate", "plate", "plate"],
    crafts: ["hoop", "stamp", "stamp", "circle"],
    forky: ["heart"],
    coffee: ["blob"],
    bear: ["cloud"]
  };
  const HINTS = {
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

  $("[data-interests]").innerHTML = D.interests
    .map(
      (it, i) => `<article class="bit bit-${it.key}" data-egg="${it.key}" tabindex="0" role="button"
                   aria-label="${esc(it.title)}. ${esc(HINTS[it.key] || "tap for a surprise")}" style="--r:${rot(i, 3)}deg">
        <span class="tape ${i % 2 ? "tape-br" : "tape-tl"}" aria-hidden="true"></span>
        <div class="gal gal-${it.key}">
          ${it.photos
            .map(
              (p, j) =>
                `<span class="ph ph-${j} sh-${(SHAPES[it.key] || [])[j] || "circle"}"><img src="${p}" alt="" loading="lazy"></span>`
            )
            .join("")}
        </div>
        <div class="bit-copy">
          <span class="bit-emoji" aria-hidden="true">${it.emoji}</span>
          <h3>${esc(it.title)}</h3>
          <p class="bit-head">${esc(it.headline)}</p>
          <p class="bit-story">${esc(it.story)}</p>
        </div>
        <span class="bit-tap" aria-hidden="true">${esc(HINTS[it.key] || "tap me")} ✨</span>
      </article>`
    )
    .join("");

  /* Background doodles for the fun pages. */
  const DOODLES = {
    star: '<path d="M20 3l4.6 10.3 11.2 1.1-8.4 7.5 2.5 11-9.9-5.8-9.9 5.8 2.5-11-8.4-7.5 11.2-1.1z"/>',
    heart: '<path d="M20 35C9 27 3 20 3 13a8 8 0 0 1 17-4 8 8 0 0 1 17 4c0 7-6 14-17 22z"/>',
    squiggle: '<path d="M2 22c5-12 9-12 12 0s7 12 12 0 7-12 12 0" fill="none"/>',
    spiral: '<path d="M20 20a3 3 0 1 1 3-3 7 7 0 1 1-7-7 11 11 0 1 1 11 11" fill="none"/>',
    flower: '<g><circle cx="20" cy="9" r="6"/><circle cx="31" cy="17" r="6"/><circle cx="27" cy="30" r="6"/><circle cx="13" cy="30" r="6"/><circle cx="9" cy="17" r="6"/><circle cx="20" cy="20" r="5" fill="#f2b544"/></g>',
    sparkle: '<path d="M20 2c2 12 6 16 18 18-12 2-16 6-18 18-2-12-6-16-18-18 12-2 16-6 18-18z"/>'
  };
  const doodleKinds = Object.keys(DOODLES);
  const doodleColors = ["#c9a0ff", "#f2b544", "#8fd6c4", "#ff9fb2", "#7c5cc4"];
  $("[data-doodles]").innerHTML = Array.from({ length: 22 }, (_, i) => {
    const kind = doodleKinds[i % doodleKinds.length];
    const c = doodleColors[(i * 3) % doodleColors.length];
    const filled = kind === "squiggle" || kind === "spiral" ? `stroke="${c}" stroke-width="3" stroke-linecap="round"` : `fill="${c}"`;
    const left = (i * 47) % 96;
    const top = (i * 29 + (i % 3) * 13) % 97;
    const size = 22 + ((i * 11) % 30);
    return `<svg class="doodle" viewBox="0 0 40 40" style="left:${left}%;top:${top}%;width:${size}px;--d:${(i % 5) * -1.3}s" ${filled}>${DOODLES[kind]}</svg>`;
  }).join("");

  /* ------------------------------------------------------------- contact */
  $("[data-contact]").innerHTML = `
    <span class="tape tape-tl" aria-hidden="true"></span>
    <p class="hand">the fastest way to reach me</p>
    <a class="big-link" href="mailto:${D.profile.email}" data-confetti>${esc(D.profile.email)}</a>
    <div class="contact-row">
      <button type="button" class="button" data-copy data-confetti>copy email</button>
      <a class="button" href="${D.profile.linkedin}" target="_blank" rel="noopener" data-magnetic="0.2">linkedin ↗</a>
      <a class="button" href="${D.profile.resume}" data-magnetic="0.2">résumé ↗</a>
    </div>
    <p class="contact-note">${esc(D.profile.location)} · ${esc(D.profile.languages)}</p>`;

  $("[data-skills]").innerHTML = D.skills
    .map(
      (s, i) =>
        `<div class="sticky small" style="--r:${rot(i + 5, 3)}deg"><h4>${esc(s.group)}</h4><p>${s.items.map(esc).join(" · ")}</p></div>`
    )
    .join("");

  /* ================================================================== hero */
  const stage = $("[data-hero]");
  const layers = M.buildHero(stage, D.hero);
  const [FW, FH] = D.hero.frame;
  const pct = (v, total) => (v / total) * 100 + "%";

  /* The name layer is rebuilt as positioned, separately animatable pieces.
     Nesting keeps each animation on its own element:
     .letter (position + scroll-out) > .hop (entrance + click) > .bob (idle) > img (jelly).

     With hero.splitLetters off there is one piece holding the whole wordmark,
     which is the same structure with a length of one, so the entrance, the
     idle bob, the poke and the scroll-out all still apply, to the word rather
     than to each letter. */
  layers.name.setAttribute("role", "img");
  layers.name.setAttribute("aria-label", D.profile.name);
  const pieces = D.hero.splitLetters && D.hero.letters
    ? D.hero.letters
    : [{ src: D.hero.name, box: D.hero.nameBox }];
  layers.name.innerHTML =
    `<div class="name-fit" data-name-fit>` +
    pieces
      .map((l, i) => {
        const [x0, y0, x1, y1] = l.box;
        const dx = l.nudge || 0;
        return `<span class="letter" data-letter="${i}" style="left:${pct(x0 + dx, FW)};top:${pct(y0, FH)};width:${pct(x1 - x0, FW)};height:${pct(y1 - y0, FH)}">
        <span class="hop"><span class="bob"><img src="${l.src}" alt="" draggable="false"></span></span>
      </span>`;
      })
      .join("") +
    `</div>`;

  /* The 16:9 stage is sized like background-size: cover, so on any viewport
     taller than 16:9 its sides are cropped. The wordmark in the artwork runs
     from 2.5% to 98% of the frame, which is narrower than that crop: at
     1440x900 the stage is 1600px wide and loses 80px a side, against the
     name's 40px margin, so the outer M and A were being cut off.

     The name is typography rather than part of the photograph, so it is scaled
     to fit the visible width instead of being cropped with the photo. It keeps
     its position on the stage, so it still passes behind her, and at exactly
     16:9 the scale is 1 and the artwork is reproduced as drawn. The scale
     lives on an inner element so it cannot collide with the GSAP transforms
     that drive the layer's parallax. */
  const nameFit = $("[data-name-fit]", layers.name);
  const nameSpan = (D.hero.nameBox[2] - D.hero.nameBox[0]) / FW;
  const NAME_MARGIN = 24;

  function fitName() {
    const stageWidth = stage.getBoundingClientRect().width;
    if (!stageWidth) return;
    const drawn = nameSpan * stageWidth;
    const room = window.innerWidth - NAME_MARGIN * 2;
    nameFit.style.scale = String(Math.min(1, room / drawn));
  }
  fitName();
  window.addEventListener("resize", fitName);

  /* Hotspots on her: the bouquet, and the rest of her. The cut-out layer itself
     ignores the pointer so the letters behind it stay clickable. */
  const spot = (cls, box) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "hotspot " + cls;
    el.style.cssText = `left:${pct(box[0], FW)};top:${pct(box[1], FH)};width:${pct(box[2] - box[0], FW)};height:${pct(box[3] - box[1], FH)}`;
    stage.appendChild(el);
    return el;
  };
  const bouquet = spot("hotspot-bouquet", [752, 40, 870, 136]);
  const body = spot("hotspot-body", [880, 300, 1240, 1050]);
  bouquet.setAttribute("aria-label", "Toss the bouquet");
  body.setAttribute("aria-label", "Say hi to Minko");

  /* =========================================================== fx helpers */
  const PALETTE = ["#c9a0ff", "#ffd166", "#8fd6c4", "#ff9fb2", "#8f6fe8"];

  function burst(x, y, opts) {
    if (!motion) return;
    const o = Object.assign({ count: 22, spread: 240, up: 0.9, chars: null, size: 1 }, opts);
    for (let i = 0; i < o.count; i++) {
      const bit = document.createElement("i");
      bit.className = "bit-confetti";
      if (o.chars) {
        bit.textContent = o.chars[i % o.chars.length];
        bit.classList.add("is-char");
        bit.style.color = PALETTE[i % PALETTE.length];
        bit.style.fontSize = 14 * o.size + Math.random() * 10 * o.size + "px";
      } else {
        bit.style.background = PALETTE[i % PALETTE.length];
      }
      bit.style.left = x + "px";
      bit.style.top = y + "px";
      fx.appendChild(bit);
      gsap.fromTo(
        bit,
        { x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 },
        {
          x: (Math.random() - 0.5) * o.spread,
          y: (Math.random() - o.up) * o.spread * 0.9,
          rotate: (Math.random() - 0.5) * 720,
          scale: 0.3,
          opacity: 0,
          duration: 0.9 + Math.random() * 0.6,
          ease: "power2.out",
          onComplete: () => bit.remove()
        }
      );
    }
  }

  function bubble(x, y, text) {
    const b = document.createElement("div");
    b.className = "speech";
    b.textContent = text;
    b.style.left = x + "px";
    b.style.top = y + "px";
    fx.appendChild(b);
    if (!motion) {
      setTimeout(() => b.remove(), 2200);
      return;
    }
    gsap
      .timeline({ onComplete: () => b.remove() })
      .fromTo(b, { scale: 0, rotate: -12, autoAlpha: 0 }, { scale: 1, rotate: -3, autoAlpha: 1, duration: 0.45, ease: "back.out(2.6)" })
      .to(b, { y: -18, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=1.6");
  }

  const centerOf = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  /* ====================================================== hero: letters */
  const letters = $$(".letter", layers.name);
  const poked = new Set();

  function jelly(img) {
    if (!motion || gsap.isTweening(img)) return;
    gsap
      .timeline()
      .to(img, { scaleX: 1.06, scaleY: 0.95, duration: 0.15, ease: "power2.out" })
      .to(img, { scaleX: 0.98, scaleY: 1.03, duration: 0.15 })
      .to(img, { scaleX: 1, scaleY: 1, duration: 0.5, ease: "power2.out" });
  }

  function hop(letter) {
    const h = $(".hop", letter);
    const [cx, cy] = centerOf(letter);
    burst(cx, cy, { count: 6, spread: 90, chars: ["✦"] });
    if (!motion) return;
    gsap
      .timeline()
      .to(h, { yPercent: -14, duration: 0.35, ease: "power2.out" })
      .to(h, { yPercent: 0, duration: 0.6, ease: "power2.inOut" })
      .set(h, { rotate: 0 });
  }

  letters.forEach((letter) => {
    const img = $("img", letter);
    letter.addEventListener("pointerenter", () => jelly(img));
    letter.addEventListener("click", () => {
      hop(letter);
      poked.add(letter.dataset.letter);
      if (poked.size === letters.length) {
        poked.clear();
        const [cx, cy] = centerOf(layers.name);
        setTimeout(() => {
          burst(cx, cy, { count: 60, spread: 520 });
          bubble(cx, cy - 40, "M-I-N-K-O M-A! you poked them all 🎉");
        }, 450);
      }
    });
  });

  bouquet.addEventListener("click", () => {
    const [cx, cy] = centerOf(bouquet);
    burst(cx, cy, { count: 26, spread: 300, chars: ["✿", "❀", "✦", "♥"], size: 1.3 });
    if (motion) gsap.fromTo(layers.subject, { rotate: 0 }, { rotate: 0.4, duration: 0.2, yoyo: true, repeat: 1, transformOrigin: "50% 90%" });
  });
  body.addEventListener("click", (e) => {
    bubble(e.clientX, e.clientY - 30, ["hi!! 👋", "thanks for stopping by!", "go wildcats 💜", "scroll down, there’s more ↓"][Math.floor(Math.random() * 4)]);
  });

  /* ==================================================== hero: entrance */
  const win = $("[data-window]");
  const develop = $(".develop");
  const subjectImg = $("img", layers.subject);
  let intro = null;

  if (motion) {
    intro = gsap.timeline({ paused: true });
    intro
      /* 1. The full-screen photo develops like an instant print: pale and soft,
         easing back from a slight zoom as the colour comes in. */
      .fromTo(develop, { opacity: 1 }, { opacity: 0, duration: 1.8, ease: "power1.inOut" }, 0)
      .fromTo(win, { filter: "saturate(0) brightness(1.5) blur(8px)", scale: 1.12 }, { filter: "saturate(1) brightness(1) blur(0px)", scale: 1, duration: 2.2, ease: "power2.out", clearProps: "filter" }, 0)
      /* 2. She pops up from the bench. */
      .fromTo(subjectImg, { yPercent: 3, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.4, ease: "power3.out" }, 0.8);

    /* 3. The letters drop in one by one, squash on landing, then settle. */
    letters.forEach((letter, i) => {
      const h = $(".hop", letter);
      const img = $("img", letter);
      const at = 1.3 + i * 0.09;
      intro
        .fromTo(h, { yPercent: 18, autoAlpha: 0, filter: "blur(6px)" }, { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1.1, ease: "power3.out", clearProps: "filter" }, at);
    });

    intro
    /* Tagline writes itself in, then the underline sweeps under it. */
    const tagChars = M.split($("[data-tagline]"), "chars");
    const tagLine = $(".tagline-line path");
    const tagLen = tagLine.getTotalLength();
    gsap.set(tagLine, { strokeDasharray: tagLen, strokeDashoffset: tagLen });
    intro
      .fromTo(tagChars, { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.025, ease: "power2.out" }, "-=0.3")
      .to(tagLine, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, "-=0.2")
      .fromTo(".scribble-3", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.3")
      .fromTo(".corner-sticker", { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, "<")
      .add(() => {
        /* Idle: every letter breathes on its own phase, so the name never sits dead still. */
        letters.forEach((letter, i) => {
          gsap.to($(".bob", letter), {
            yPercent: -1.5,
            duration: 3 + i * 0.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.17
          });
        });
        /* A wave runs through the letters every few seconds as a nudge to poke them. */

      });

    /* Scroll-out: the letters float away at different speeds while the photo pushes in. */
    const out = gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 }
    });
    letters.forEach((l, i) =>
      out.to(l, { yPercent: -(160 + ((i * 53) % 140)), xPercent: (i - 3) * 18, rotate: (i % 2 ? 1 : -1) * (20 + i * 4), autoAlpha: 0, ease: "none" }, 0)
    );
    out
      .to(layers.scene, { scale: 1.12, yPercent: 6, ease: "none" }, 0)
      .to(layers.subject, { yPercent: 5, ease: "none" }, 0)
      .to(".tagline", { yPercent: -120, autoAlpha: 0, ease: "none" }, 0)
      .to(".scribble, .corner-sticker", { autoAlpha: 0, ease: "none" }, 0);

    /* Floating paper confetti over the photo. */
    const conf = $(".hero .confetti");
    for (let i = 0; i < 16; i++) {
      const bit = document.createElement("i");
      bit.style.cssText = `left:${Math.random() * 100}%;animation-delay:${(-Math.random() * 16).toFixed(1)}s;animation-duration:${(13 + Math.random() * 10).toFixed(1)}s`;
      conf.appendChild(bit);
    }
  }

  /* ========================================================== easter eggs */
  const found = new Set();
  const counter = $("[data-egg-count] b");

  const EGGS = {
    /* Two copies of her twin photo appear: the second one 10 cm taller. */
    twins(card) {
      const src = $(".ph-0 img", card).src;
      const wrap = document.createElement("div");
      wrap.className = "egg-twins";
      wrap.innerHTML = `
        <figure><img src="${src}" alt=""><figcaption>me · older by 2 min</figcaption></figure>
        <figure class="taller"><img src="${src}" alt=""><figcaption>her · taller by 10 cm</figcaption></figure>`;
      fx.appendChild(wrap);
      if (!motion) return setTimeout(() => wrap.remove(), 2600);
      gsap
        .timeline({ onComplete: () => wrap.remove() })
        .from(wrap.children, { scale: 0, rotate: (i) => (i ? 14 : -14), duration: 0.6, stagger: 0.15, ease: "back.out(2.2)" })
        .to(wrap.querySelector(".taller img"), { scaleY: 1.12, transformOrigin: "50% 100%", duration: 0.5, ease: "back.out(3)" })
        .to(wrap.children, { y: 40, autoAlpha: 0, duration: 0.5, stagger: 0.08, ease: "power2.in" }, "+=1.7");
    },

    /* A tiny dancer leaps across the page with music notes trailing. */
    ballet() {
      const dancer = document.createElement("div");
      dancer.className = "egg-dancer";
      dancer.textContent = "🩰";
      fx.appendChild(dancer);
      if (!motion) return setTimeout(() => dancer.remove(), 1500);
      const W = window.innerWidth;
      const tl = gsap.timeline({ onComplete: () => dancer.remove() });
      tl.fromTo(dancer, { x: -80 }, { x: W + 80, duration: 3.6, ease: "none" }, 0);
      for (let i = 0; i < 4; i++) {
        tl.to(dancer, { y: -150, rotate: "+=180", duration: 0.45, ease: "power2.out" }, i * 0.9)
          .to(dancer, { y: 0, rotate: "+=180", duration: 0.45, ease: "power2.in" }, i * 0.9 + 0.45);
      }
      const notes = setInterval(() => {
        const r = dancer.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, { count: 2, spread: 120, up: 1.2, chars: ["♪", "♫", "♬"], size: 1.4 });
      }, 140);
      tl.add(() => clearInterval(notes));
    },

    /* A not-to-scale map with a plane flying the route and pins popping in. */
    travel() {
      const modal = document.createElement("div");
      modal.className = "egg-map";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-label", "A not-to-scale map of my travels");
      modal.innerHTML = `
        <div class="map-card">
          <span class="tape tape-tl" aria-hidden="true"></span>
          <button class="map-close" type="button" aria-label="Close">×</button>
          <p class="hand">my (very not-to-scale) map</p>
          <svg viewBox="0 0 800 420" class="map-svg" aria-hidden="true">
            <g class="land">
              <path d="M60 90C90 50 190 40 250 70c30 20 20 60-10 80-20 25-40 40-60 65-20-15-60-45-80-65C70 130 50 115 60 90z"/>
              <path d="M215 240c30-10 55 10 50 45-5 35-25 75-40 100-13-25-25-65-27-95-2-25 2-42 17-50z"/>
              <path d="M370 80c25-15 70-15 85 5 5 20-25 33-50 35-20 0-40-18-35-40z"/>
              <path d="M385 145c35-15 85-5 95 30 10 40-10 85-35 125-15 20-33 0-40-30-7-30-30-55-33-85-2-20 0-33 13-40z"/>
              <path d="M470 70c60-25 170-20 230 15 30 20 15 55-20 70-30 15-60 30-90 45-25-10-45-30-70-40-25-10-50-30-52-55-1-15-3-27 2-35z"/>
              <path d="M640 280c30-15 80-10 95 15 7 25-20 40-50 38-30-3-55-23-45-53z"/>
            </g>
            <path class="route" d="M140 110C230 40 330 60 400 95c45 25 20 105 20 125 55-60 140-110 190-90 40 15 50 70 80 170"/>
            <g class="pins"></g>
            <text class="plane" font-size="30">✈️</text>
          </svg>
          <span class="map-stamp">15+<small>countries</small></span>
          <p class="map-note">and always one more stamp to go. ask me where next!</p>
        </div>`;
      fx.appendChild(modal);
      document.documentElement.classList.add("is-locked");
      if (M.lenis) M.lenis.stop();
      const close = () => {
        document.documentElement.classList.remove("is-locked");
        if (M.lenis) M.lenis.start();
        document.removeEventListener("keydown", onKey);
        if (!motion) return modal.remove();
        gsap.to(modal, { autoAlpha: 0, duration: 0.3, onComplete: () => modal.remove() });
      };
      const onKey = (e) => e.key === "Escape" && close();
      document.addEventListener("keydown", onKey);
      modal.addEventListener("click", (e) => (e.target === modal || e.target.closest(".map-close")) && close());

      const route = modal.querySelector(".route");
      const plane = modal.querySelector(".plane");
      const pins = modal.querySelector(".pins");
      const len = route.getTotalLength();
      const stops = [0.02, 0.2, 0.36, 0.52, 0.68, 0.84, 0.99];
      const pinEls = stops.map((t) => {
        const p = route.getPointAtLength(t * len);
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", `translate(${p.x} ${p.y})`);
        g.innerHTML = '<g class="pin-inner"><path d="M0 0c-9-12-12-17-12-22a12 12 0 0 1 24 0c0 5-3 10-12 22z"/><circle cy="-22" r="4.5" fill="#fff"/></g>';
        pins.appendChild(g);
        return { t, el: g.firstChild, shown: false };
      });
      if (!motion) return;
      gsap.set(route, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set(pinEls.map((p) => p.el), { scale: 0, transformOrigin: "50% 100%" });
      gsap.from(modal.querySelector(".map-card"), { y: 60, rotate: -6, scale: 0.9, autoAlpha: 0, duration: 0.6, ease: "back.out(2)" });
      const state = { t: 0 };
      gsap.to(state, {
        t: 1,
        duration: 3.4,
        delay: 0.5,
        ease: "power1.inOut",
        onUpdate() {
          const d = state.t * len;
          route.style.strokeDashoffset = len - d;
          const a = route.getPointAtLength(Math.max(0, d - 1));
          const b = route.getPointAtLength(Math.min(len, d + 1));
          const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          plane.setAttribute("transform", `translate(${b.x} ${b.y}) rotate(${angle + 45}) translate(-15 10)`);
          pinEls.forEach((p) => {
            if (!p.shown && state.t >= p.t) {
              p.shown = true;
              gsap.to(p.el, { scale: 1, duration: 0.5, ease: "back.out(3)" });
            }
          });
        },
        onComplete() {
          gsap.fromTo(modal.querySelector(".map-stamp"), { scale: 2.4, rotate: -30, autoAlpha: 0 }, { scale: 1, rotate: -12, autoAlpha: 1, duration: 0.45, ease: "back.out(2.5)" });
        }
      });
    },

    /* The five foster kittens trot across the bottom of the screen, name tags on. */
    cats() {
      const names = ["Sequoia", "Michael", "Jane", "Jonathan Bailey", "Marsala"];
      const looks = ["🐈", "🐈‍⬛", "🐈", "🐈", "🐈‍⬛"];
      names.forEach((n, i) => {
        const k = document.createElement("div");
        k.className = "egg-kitten";
        k.style.bottom = 10 + (i % 2) * 22 + "px";
        k.innerHTML = `<span class="kitten-body">${looks[i]}</span><span class="kitten-name">${n}</span>`;
        fx.appendChild(k);
        if (!motion) return setTimeout(() => k.remove(), 2500);
        const dur = 6.2 + i * 0.6;
        gsap.fromTo(k, { x: window.innerWidth + 60 }, { x: -240, duration: dur, delay: i * 0.6, ease: "none", onComplete: () => k.remove() });
        gsap.to(k.querySelector(".kitten-body"), { y: -7, rotate: -5, duration: 0.17, yoyo: true, repeat: Math.ceil((dur + i * 0.6) / 0.17), ease: "sine.inOut" });
      });
    },

    /* It rains snacks. */
    food() {
      const snacks = ["🍜", "🥟", "🍣", "🍰", "🍤", "🍝", "🥘", "🍙", "🧋", "🍓", "🥐", "🍲"];
      for (let i = 0; i < 34; i++) {
        const s = document.createElement("span");
        s.className = "egg-snack";
        s.textContent = snacks[i % snacks.length];
        s.style.left = Math.random() * 96 + "vw";
        fx.appendChild(s);
        if (!motion) {
          setTimeout(() => s.remove(), 1200);
          continue;
        }
        gsap
          .timeline({ delay: Math.random() * 1.4, onComplete: () => s.remove() })
          .fromTo(s, { y: -80, rotate: (Math.random() - 0.5) * 90 }, { y: window.innerHeight - 70, rotate: (Math.random() - 0.5) * 360, duration: 1.3 + Math.random() * 0.7, ease: "bounce.out" })
          .to(s, { autoAlpha: 0, duration: 0.4 }, "+=0.5");
      }
    },

    /* A ball of yarn rolls across, unspooling a line behind it. */
    crafts() {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "egg-yarn");
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      let d = `M -40 ${H * 0.72}`;
      for (let x = 0; x <= W + 80; x += 160) d += ` Q ${x + 40} ${H * (0.55 + ((x / 160) % 2) * 0.3)} ${x + 80} ${H * 0.7}`;
      svg.innerHTML = `<path d="${d}" fill="none" stroke="#ff9fb2" stroke-width="5" stroke-linecap="round"/>`;
      fx.appendChild(svg);
      const ball = document.createElement("span");
      ball.className = "egg-ball";
      ball.textContent = "🧶";
      fx.appendChild(ball);
      const path = svg.querySelector("path");
      const len = path.getTotalLength();
      if (!motion) {
        return setTimeout(() => {
          svg.remove();
          ball.remove();
        }, 1500);
      }
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      const s = { t: 0 };
      gsap
        .timeline({ onComplete: () => (svg.remove(), ball.remove()) })
        .to(s, {
          t: 1,
          duration: 3,
          ease: "power1.inOut",
          onUpdate() {
            const p = path.getPointAtLength(s.t * len);
            path.style.strokeDashoffset = len * (1 - s.t);
            ball.style.transform = `translate(${p.x - 24}px, ${p.y - 30}px) rotate(${s.t * 1080}deg)`;
          }
        })
        .to([svg, ball], { autoAlpha: 0, duration: 0.5 });
    },

    /* Forky pops up from the bottom of the screen, wobbles, says his line. */
    forky() {
      const f = document.createElement("div");
      f.className = "egg-forky";
      f.innerHTML = `<span class="forky-body">🍴<i class="eye l"></i><i class="eye r"></i><i class="brow"></i></span><span class="forky-say">trash?!</span>`;
      fx.appendChild(f);
      if (!motion) return setTimeout(() => f.remove(), 2200);
      gsap
        .timeline({ onComplete: () => f.remove() })
        .fromTo(f, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: "back.out(2)" })
        .to(f.querySelector(".forky-body"), { rotate: 12, duration: 0.14, yoyo: true, repeat: 5, ease: "sine.inOut", transformOrigin: "50% 100%" })
        .fromTo(f.querySelector(".forky-say"), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(3)" }, "-=0.6")
        .to(f, { yPercent: 115, duration: 0.5, ease: "back.in(2)" }, "+=1.3");
    },

    /* A fresh latte appears at the tap, with steam and a latte-art heart. */
    coffee(card, x, y) {
      const c = document.createElement("div");
      c.className = "egg-coffee";
      c.style.left = x + "px";
      c.style.top = y + "px";
      c.innerHTML = `<span class="cup">☕</span>
        <svg viewBox="0 0 60 70" class="steam"><path d="M15 60c-8-10 8-18 0-28s8-18 0-28"/><path d="M30 60c-8-10 8-18 0-28s8-18 0-28"/><path d="M45 60c-8-10 8-18 0-28s8-18 0-28"/></svg>
        <span class="latte-heart">♥</span>`;
      fx.appendChild(c);
      if (!motion) return setTimeout(() => c.remove(), 2000);
      const steam = c.querySelectorAll(".steam path");
      gsap
        .timeline({ onComplete: () => c.remove() })
        .fromTo(c.querySelector(".cup"), { scale: 0, rotate: -40 }, { scale: 1, rotate: 0, duration: 0.5, ease: "back.out(2.5)" })
        .fromTo(steam, { strokeDasharray: 80, strokeDashoffset: 80, autoAlpha: 1 }, { strokeDashoffset: 0, duration: 0.9, stagger: 0.15, ease: "power1.out" })
        .fromTo(c.querySelector(".latte-heart"), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, y: -20, duration: 0.5, ease: "back.out(3)" }, "-=0.5")
        .to(c, { y: -40, autoAlpha: 0, duration: 0.6 }, "+=1.1");
    },

    /* The lights go down: stars, a moon, the bear, and a few floating z’s. */
    bear() {
      const n = document.createElement("div");
      n.className = "egg-night";
      n.innerHTML = `<span class="moon">🌙</span><span class="bear">🧸</span>` +
        Array.from({ length: 26 }, () => `<i class="star" style="left:${Math.random() * 100}%;top:${Math.random() * 70}%;animation-delay:${(Math.random() * 1.5).toFixed(2)}s">✦</i>`).join("") +
        `<span class="zz">z</span><span class="zz">z</span><span class="zz">Z</span><p class="night-note">goodnight, ShellieMay 💤</p>`;
      fx.appendChild(n);
      if (!motion) return setTimeout(() => n.remove(), 2500);
      gsap
        .timeline({ onComplete: () => n.remove() })
        .fromTo(n, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 })
        .fromTo(n.querySelector(".bear"), { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(2)" }, "<0.2")
        .fromTo(n.querySelectorAll(".zz"), { y: 0, x: 0, autoAlpha: 0 }, { y: -120, x: (i) => 30 + i * 20, autoAlpha: 1, duration: 1.6, stagger: 0.4, ease: "sine.out" }, "<0.3")
        .to(n.querySelectorAll(".zz"), { autoAlpha: 0, duration: 0.4 }, "-=0.3")
        .to(n, { autoAlpha: 0, duration: 0.7 }, "+=0.8");
    }
  };

  function playEgg(card, x, y) {
    const key = card.dataset.egg;
    const fn = EGGS[key];
    if (!fn) return;
    let [cx, cy] = x == null ? centerOf(card) : [x, y];
    /* Keyboard activation passes no pointer; keep effects anchored on screen. */
    cx = Math.min(Math.max(cx, 60), window.innerWidth - 60);
    cy = Math.min(Math.max(cy, 80), window.innerHeight - 60);
    fn(card, cx, cy);
    burst(cx, cy, { count: 14, spread: 180, chars: ["✦", "✿"] });
    if (motion) gsap.fromTo(card, { scale: 0.97 }, { scale: 1, duration: 0.5, ease: "elastic.out(1.2, 0.4)" });
    if (!found.has(key)) {
      found.add(key);
      counter.textContent = found.size;
      card.classList.add("is-found");
      if (motion) gsap.fromTo(counter.parentElement, { scale: 1.3, rotate: -6 }, { scale: 1, rotate: 0, duration: 0.6, ease: "elastic.out(1.2, 0.4)" });
      if (found.size === Object.keys(EGGS).length) {
        setTimeout(() => {
          burst(window.innerWidth / 2, window.innerHeight / 2, { count: 90, spread: 760 });
          bubble(window.innerWidth / 2, window.innerHeight / 2, "all 9 found! you know me pretty well now 💜");
        }, 900);
      }
    }
  }

  /* ============================================================ behaviour */
  /* YouTube answers an embed request that carries no usable referer with
     "Video player configuration error (153)". That happens when the page is
     opened straight off disk (file://), and the nocookie host is stricter about
     it than the main one. So: play through www.youtube.com with an explicit
     origin when we are on http(s), and send the viewer to YouTube itself when
     there is no origin to send. */
  const isYouTube = (src) => /(?:^|\.)youtube(?:-nocookie)?\.com\/embed\//.test(src);
  const hasOrigin = window.location.origin && window.location.origin !== "null";

  function playableSrc(src) {
    if (!isYouTube(src)) return src;
    const url = new URL(src);
    url.hostname = "www.youtube.com";
    url.searchParams.set("origin", window.location.origin);
    url.searchParams.set("widget_referrer", window.location.origin);
    return url.toString();
  }

  document.querySelectorAll("[data-embed]").forEach((frame) => {
    frame.addEventListener("click", () => {
      const src = frame.dataset.embed;
      if (isYouTube(src) && !hasOrigin) {
        const away = frame.parentElement && frame.parentElement.querySelector(".reel-meta a");
        window.open(away ? away.href : src, "_blank", "noopener");
        return;
      }
      if (frame.dataset.loaded) return;
      frame.dataset.loaded = "1";
      const iframe = document.createElement("iframe");
      iframe.src = playableSrc(src);
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.title = "Embedded player";
      frame.appendChild(iframe);
      frame.classList.add("is-playing");
    });
  });

  M.autoInit();
  M.copyEmail("[data-copy]", D.profile.email);

  /* Cards can be picked up and moved; a tap without a drag opens the surprise. */
  const cards = $$("[data-egg]");
  if (window.Draggable && !M.touch && !M.reduced) {
    Draggable.create(cards, {
      type: "x,y",
      bounds: ".beyond",
      edgeResistance: 0.65,
      minimumMovement: 6,
      zIndexBoost: true,
      onPress() {
        gsap.to(this.target, { rotate: 0, scale: 1.03, duration: 0.25 });
      },
      onRelease() {
        gsap.to(this.target, { scale: 1, duration: 0.4, ease: "power2.out" });
      },
      onClick(e) {
        playEgg(this.target, e.clientX, e.clientY);
      }
    });
  } else {
    cards.forEach((c) => c.addEventListener("click", (e) => playEgg(c, e.clientX, e.clientY)));
  }
  cards.forEach((c) =>
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        playEgg(c);
      }
    })
  );

  document.querySelectorAll("[data-confetti]").forEach((el) =>
    el.addEventListener("click", (e) => burst(e.clientX, e.clientY))
  );

  if (motion) {
    /* The dotted ribbon draws itself down the page. */
    const ribbon = $("[data-ribbon]");
    const len = ribbon.getTotalLength();
    gsap.set(ribbon, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(ribbon, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: { trigger: "main", start: "top top", end: "bottom bottom", scrub: 0.6 }
    });

    /* Path photos slap onto the page as each step arrives, then drift slightly
       at different speeds while you scroll past. */
    $$("[data-step-photos]").forEach((group) => {
      const snaps = $$(".snap", group);
      gsap.fromTo(
        snaps,
        { scale: 1.35, autoAlpha: 0, rotate: (i) => (i % 2 ? 14 : -14) },
        {
          scale: 1,
          autoAlpha: 1,
          rotate: (i, el) => parseFloat(el.style.getPropertyValue("--r")) || 0,
          duration: 0.75,
          stagger: 0.16,
          ease: "back.out(1.7)",
          scrollTrigger: { trigger: group, start: "top 78%", once: true }
        }
      );
      snaps.forEach((s, j) =>
        gsap.to(s, {
          y: () => -(12 + j * 13),
          ease: "none",
          scrollTrigger: { trigger: group, start: "top bottom", end: "bottom top", scrub: 1, invalidateOnRefresh: true }
        })
      );
      gsap.fromTo(group.querySelector(".year-stamp"), { scale: 0, rotate: -60 }, { scale: 1, rotate: -14, duration: 0.6, ease: "back.out(3)", scrollTrigger: { trigger: group, start: "top 70%", once: true } });
      snaps.forEach((s) => {
        s.addEventListener("pointerenter", () => gsap.to(s, { scale: 1.05, rotate: 0, zIndex: 5, duration: 0.35, ease: "power2.out" }));
        s.addEventListener("pointerleave", () =>
          gsap.to(s, { scale: 1, rotate: parseFloat(s.style.getPropertyValue("--r")) || 0, zIndex: "", duration: 0.5, ease: "power2.out" })
        );
      });
    });

    /* Fun-page cards pop in like stickers being slapped down. */
    gsap.fromTo(
      cards,
      { scale: 0.6, autoAlpha: 0, rotate: (i) => (i % 2 ? 10 : -10) },
      {
        scale: 1,
        autoAlpha: 1,
        rotate: (i, el) => parseFloat(el.style.getPropertyValue("--r")) || 0,
        duration: 0.7,
        stagger: { each: 0.07, from: "random" },
        ease: "back.out(1.8)",
        scrollTrigger: { trigger: ".scatter", start: "top 80%", once: true }
      }
    );

    /* Doodles drift slowly with the scroll. */
    $$(".doodle").forEach((d, i) =>
      gsap.to(d, {
        y: () => (i % 2 ? -1 : 1) * (60 + (i % 4) * 30),
        rotate: (i % 2 ? -1 : 1) * 90,
        ease: "none",
        scrollTrigger: { trigger: ".beyond", start: "top bottom", end: "bottom top", scrub: 1.2 }
      })
    );

    /* Cursor trail: small flowers and sparkles that fall away from the pointer. */
    if (!M.touch) {
      let lastX = 0;
      let lastY = 0;
      let lastT = 0;
      const marks = ["✿", "✦", "❀", "·"];
      window.addEventListener("pointermove", (e) => {
        const now = performance.now();
        const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
        if (dist < 34 || now - lastT < 45) return;
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = now;
        const s = document.createElement("i");
        s.className = "trail-mark";
        s.textContent = marks[(now | 0) % marks.length];
        s.style.left = e.clientX + "px";
        s.style.top = e.clientY + "px";
        s.style.color = PALETTE[(now | 0) % PALETTE.length];
        fx.appendChild(s);
        gsap.fromTo(s, { scale: 1, opacity: 0.9, rotate: 0 }, { y: 26, scale: 0.2, opacity: 0, rotate: 140, duration: 0.8, ease: "power1.in", onComplete: () => s.remove() });
      });
    }
  }

  M.preloader().then(() => intro && intro.play());
})();
