/* Bits lab, round 2 — six overlapping photo piles for "Bits of me".
   Every option here obeys the same three rules:
     1. all 27 photos visible at rest, no click, no hover needed to see them;
     2. every photo keeps its own shape (--ar read from the file at runtime);
     3. mixed sizes and a tilt, so nothing is square or level.
   Scratch page; index.html does not load this. */
(() => {
  const D = window.MINKO;

  /* The set shown on this page, trimmed on Minko's instruction: Forky, the
     latte and the travel stamps are out, and the food bit keeps only the dish
     at the bottom of the old plate cluster (土豆丝 + 水煮牛肉). Six bits, 16
     photos, which fills a three-column board in two clean rows.
     js/content.js is untouched — this filter is local to the lab. */
  const DROP = ["forky", "coffee", "travel"];
  const KEEP_ONE = { food: "assets/aboutme/web/foodie5.jpg" };
  const BITS = D.interests
    .filter((b) => !DROP.includes(b.key))
    .map((b) => (KEEP_ONE[b.key] ? { ...b, photos: [KEEP_ONE[b.key]] } : b));

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* A stable pseudo-random, so a reload does not reshuffle the page and the
     same photo always gets the same tilt. */
  const rnd = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const jitter = (n, amt) => (rnd(n) - 0.5) * 2 * amt;

  /* ------------------------------------------------------------------ engine
     A pile is laid out in units of its own width, so it survives any column
     size. Boxes come in two flavours: width-driven (w given, height follows
     the photo's ratio) and height-driven (h given, width follows). The second
     is what makes a fanned row line up along one edge.

     The cluster's own height cannot be known until the photos report their
     ratios, so the engine sets aspect-ratio on the cluster afterwards and
     positions each frame as a percentage of that box. */
  function layOut(cluster, boxes, hOf) {
    const frames = [...cluster.children];
    const ratios = frames.map((f) => Number(f.dataset.r) || 0.8);

    let maxY = 0;
    const placed = boxes.map((b, i) => {
      const r = ratios[i];
      const w = b.w != null ? b.w : b.h * r;
      maxY = Math.max(maxY, b.y + hOf(w, r));
      return { ...b, w };
    });
    const total = maxY + 0.01;
    cluster.style.aspectRatio = `1 / ${total.toFixed(4)}`;
    placed.forEach((p, i) => {
      const f = frames[i];
      f.style.left = (p.x * 100).toFixed(3) + "%";
      f.style.top = ((p.y / total) * 100).toFixed(3) + "%";
      f.style.width = (p.w * 100).toFixed(3) + "%";
      f.style.zIndex = p.z != null ? p.z : i + 1;
      f.style.rotate = (p.rot || 0).toFixed(2) + "deg";
      if (p.sp != null) f.style.setProperty("--sp", p.sp.toFixed(3));
    });
  }

  /* Read the real shape of every photo, then run the layout. decode() rather
     than a load listener: a cached image never fires load. */
  function measureThen(cluster, run) {
    const imgs = [...cluster.querySelectorAll("img")];
    let left = imgs.length;
    const done = () => {
      if (--left === 0) run();
    };
    imgs.forEach((img) => {
      const take = () => {
        if (img.naturalWidth) {
          const r = img.naturalWidth / img.naturalHeight;
          img.closest(".pf").dataset.r = r;
          img.closest(".pf").style.setProperty("--ar", r);
        }
        done();
      };
      if (img.complete && img.naturalWidth) take();
      else
        img
          .decode()
          .then(take)
          .catch(() => img.addEventListener("load", take, { once: true }));
    });
    if (!imgs.length) run();
  }

  const frame = (src, i, cap) => `
    <figure class="pf" data-i="${i}">
      <img src="${src}" alt="" loading="lazy">
      ${cap ? `<figcaption>${esc(cap)}</figcaption>` : ""}
    </figure>`;

  /* One card per bit: the pile, then the words. Identical shell in all six
     options so only the pile arrangement is being compared. */
  function cards(host, cls, layout, opts = {}) {
    const el = $(host);
    el.innerHTML = BITS.map(
      (b, bi) => `
      <article class="bc ${opts.flat ? "" : "is-tilted"}" style="--r:${jitter(bi * 3 + 1, 1.5).toFixed(2)}deg">
        ${opts.tape ? `<span class="bc-tape" aria-hidden="true"></span>` : ""}
        <div class="pile ${cls}" data-bit="${b.key}">
          ${b.photos.map((p, j) => frame(p, j, "")).join("")}
        </div>
        <div class="bc-copy">
          <span class="bc-emoji">${b.emoji}</span>
          <h3>${esc(b.title)}</h3>
          <p class="hand">${esc(b.headline)}</p>
          <p class="bc-story">${esc(b.story)}</p>
        </div>
      </article>`
    ).join("");

    el.querySelectorAll(".pile").forEach((pile, bi) => {
      const n = pile.children.length;
      const run = () => {
        /* The white border is 6px either side and 7px below, drawn in pixels,
           so a frame is always a little taller than the photo's ratio implies.
           Layouts that stack rows have to know that or the bottom row lands on
           the caption. hOf returns a frame's full height as a fraction of the
           pile's width. */
        const W = pile.clientWidth || 1;
        const PAD_X = 12;
        const PAD_Y = 13;
        const hOf = (w, r) => (Math.max(w * W - PAD_X, 1) / r + PAD_Y) / W;
        layOut(pile, layout(n, bi, pile, hOf), hOf);
      };
      measureThen(pile, run);
      /* The layout is in fractions of the pile's width, but the border is in
         pixels, so a resize does change the arithmetic. */
      new ResizeObserver(() => run()).observe(pile);
    });
  }

  /* ========================================================= 1 · path pile
     The exact mechanic from "My path so far", generalised past three photos:
     a loose two-column pile, every other photo dropped so no two tops are
     level, each row overlapping the one above by a fixed sliver at the frame
     edge rather than a fraction of the picture. */
  function pathLayout(n, bi, pile, hOf) {
    const ratios = [...pile.children].map((f) => Number(f.dataset.r) || 0.8);
    const colTop = [0.0, 0.1];
    const out = [];
    for (let i = 0; i < n; i++) {
      const col = i % 2;
      const w = i % 3 === 2 ? 0.46 : 0.53;
      const h = hOf(w, ratios[i]);
      const y = colTop[col];
      out.push({
        x: col ? 1 - w - 0.01 : 0.01,
        y,
        w,
        rot: jitter(bi * 7 + i, 3.2),
        z: i + 1
      });
      /* -0.035 of the pile width is the overlap: a fixed sliver at the edge,
         which is what keeps a face from being covered. */
      colTop[col] = y + h - 0.035;
    }
    return out;
  }

  /* ========================================================== 2 · fan pile
     One shared photo height, so the pile reads as a hand of prints laid along
     a line. Each photo overlaps its neighbour by about a third, which is
     enough for every picture to be legible at rest. The row tilts as a whole
     and the hover spreads it. */
  function fanLayout(n, bi, pile, hOf) {
    const ratios = [...pile.children].map((f) => Number(f.dataset.r) || 0.8);
    const H = n <= 2 ? 0.6 : n === 3 ? 0.52 : 0.46;
    const widths = ratios.map((r) => H * r);
    const overlap = 0.34;
    let span = widths.reduce((a, w, i) => a + (i ? w * (1 - overlap) : w), 0);
    const scale = span > 1 ? 1 / span : 1;
    let x = 0;
    const out = [];
    for (let i = 0; i < n; i++) {
      const w = widths[i] * scale;
      out.push({
        x,
        y: 0.04 + Math.abs(i - (n - 1) / 2) * 0.03,
        w,
        rot: (i - (n - 1) / 2) * 4 + jitter(bi + i, 1.4),
        sp: n > 1 ? i / (n - 1) : 0.5,
        z: i + 1
      });
      x += w * (1 - overlap);
    }
    return out;
  }

  /* ======================================================= 3 · anchor pile
     One photo big, the rest small and tucked onto its corners so they break
     its edge. The size difference does the work: the eye lands on the hero
     and then finds the others. */
  function anchorLayout(n, bi, pile, hOf) {
    const ratios = [...pile.children].map((f) => Number(f.dataset.r) || 0.8);
    const out = [];
    const heroW = n === 1 ? 0.78 : n === 2 ? 0.66 : 0.62;
    out.push({ x: 0.02, y: 0.06, w: heroW, rot: jitter(bi, 2.6), z: 1 });
    const heroH = hOf(heroW, ratios[0]);
    const spots = [
      { x: 0.56, y: 0.0 },
      { x: 0.62, y: heroH * 0.52 },
      { x: 0.3, y: heroH * 0.82 },
      { x: 0.02, y: heroH * 0.95 }
    ];
    for (let i = 1; i < n; i++) {
      const s = spots[(i - 1) % spots.length];
      out.push({
        x: Math.min(s.x, 0.62) + jitter(bi * 5 + i, 0.03),
        y: s.y + jitter(bi * 11 + i, 0.03),
        w: 0.34 - (i % 2) * 0.05,
        rot: jitter(bi * 13 + i, 6),
        z: i + 2
      });
    }
    return out;
  }

  /* ======================================================= 4 · tossed pile
     Nothing aligned to anything. Positions, sizes and angles all come from
     the hash, inside a box tuned so the photos overlap by roughly a quarter.
     The messiest option, and the one that most looks like prints on a table. */
  function tossLayout(n, bi, pile, hOf) {
    const ratios = [...pile.children].map((f) => Number(f.dataset.r) || 0.8);
    const out = [];
    let yCursor = 0.02;
    for (let i = 0; i < n; i++) {
      const w = 0.4 + rnd(bi * 17 + i) * 0.22;
      const h = hOf(w, ratios[i]);
      const x = Math.min(0.98 - w, rnd(bi * 23 + i * 3) * (1 - w) * 1.05);
      out.push({ x, y: yCursor, w, rot: jitter(bi * 29 + i, 8), z: i + 1 });
      yCursor += h * (i % 2 ? 0.46 : 0.62);
    }
    return out;
  }

  /* ====================================================== 5 · zigzag column
     Photos fall down one column, alternating left and right, each sitting on
     the shoulder of the one above. Narrow and tall, so this is the option
     that works in a three- or four-column board. */
  function zigLayout(n, bi, pile, hOf) {
    const ratios = [...pile.children].map((f) => Number(f.dataset.r) || 0.8);
    const out = [];
    let y = 0.02;
    for (let i = 0; i < n; i++) {
      const w = i % 2 ? 0.56 : 0.64;
      const h = hOf(w, ratios[i]);
      out.push({
        x: i % 2 ? 1 - w - 0.01 : 0.01,
        y,
        w,
        rot: (i % 2 ? 3 : -3) + jitter(bi * 31 + i, 1.8),
        z: i + 1
      });
      y += h * 0.72;
    }
    return out;
  }

  /* ===================================================== 6 · cascade streak
     A diagonal: each photo a step right and a step down from the last, corner
     over corner. Wide and short, so a bit reads as one streak across the
     page and the row of bits reads as a rhythm. */
  function cascadeLayout(n, bi, pile, hOf) {
    const ratios = [...pile.children].map((f) => Number(f.dataset.r) || 0.8);
    const out = [];
    const stepX = n > 3 ? 0.9 / n : 0.26;
    let y = 0.02;
    for (let i = 0; i < n; i++) {
      const w = i % 2 ? 0.34 : 0.4;
      const h = hOf(w, ratios[i]);
      out.push({ x: i * stepX, y, w, rot: jitter(bi * 37 + i, 5), z: i + 1 });
      y += h * 0.2;
    }
    return out;
  }

  /* ====================================================== 0 · what you have
     The live board, rendered from the same markup and the same styles.css
     rules index.html uses, so it sits on this page as a true baseline rather
     than from memory. Shapes and hint text copied from js/main.js. */
  function current() {
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
      bear: "tap for bedtime"
    };
    const rotOld = (i, a) => (((i * 37) % 100) / 100 - 0.5) * 2 * a;

    $("[data-o0]").innerHTML = BITS.map(
      (it, i) => `
      <article class="bit bit-${it.key}" style="--r:${rotOld(i, 3)}deg">
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
    ).join("");
  }

  current();
  cards("[data-o1]", "pl-path", pathLayout, { tape: true });
  cards("[data-o2]", "pl-fan", fanLayout, { tape: true });
  cards("[data-o3]", "pl-anchor", anchorLayout);
  cards("[data-o4]", "pl-toss", tossLayout);
  cards("[data-o5]", "pl-zig", zigLayout, { tape: true });
  cards("[data-o6]", "pl-cascade", cascadeLayout);
})();
