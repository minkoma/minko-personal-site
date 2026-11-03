/* Reel lab — six ways to show vertical and horizontal films together.
   Scratch page; nothing here is wired into the live site.

   The data below is a REALISTIC MIX, not the current four films: six vertical
   reels, three landscape films and one 4:5 post, so each layout is judged at
   the volume Minko actually has rather than at four items where everything
   looks fine.

   Every tile is a real <video> with preload="none" and a poster. If the mp4
   is missing (nothing is self-hosted yet) the poster stays and the tile still
   demonstrates the layout; drop files at the `src` paths and the same page
   becomes a live preview. The stills are repurposed photos, so judge the
   SHAPE and the ARRANGEMENT here, not the framing of the picture. */

const REELS = [
  // ---------------------------------------------------------- vertical 9:16
  { id: "farmers", title: "UCSD Farmers’ Market", kind: "reel", ratio: "9/16",
    note: "A Wednesday ritual on campus.", len: "0:32", year: "2024",
    poster: "assets/aboutme/web/foodie3.jpg", src: "assets/film/farmers-market.mp4" },
  { id: "promo", title: "Student Storyteller promo", kind: "reel", ratio: "9/16",
    note: "Three cuts, one call to action.", len: "0:21", year: "2023",
    poster: "assets/experience/storyteller-reel.jpg", src: "assets/film/storyteller-promo.mp4" },
  { id: "convocation", title: "Convocation day", kind: "reel", ratio: "9/16",
    note: "Medill, purple, and a bouquet.", len: "0:28", year: "2025",
    poster: "assets/experience/nu-graduation-2.jpg", src: "assets/film/convocation.mp4" },
  { id: "firstweek", title: "First week at UCSD", kind: "reel", ratio: "9/16",
    note: "Move-in, sunsets, no plan.", len: "0:45", year: "2021",
    poster: "assets/experience/first-year-2.jpg", src: "assets/film/first-week.mp4" },
  { id: "ballet", title: "Back to the barre", kind: "reel", ratio: "9/16",
    note: "Rehearsal, shot on a phone.", len: "0:18", year: "2024",
    poster: "assets/aboutme/web/ballet.jpg", src: "assets/film/ballet.mp4" },
  { id: "daytrip", title: "One day, one city", kind: "reel", ratio: "9/16",
    note: "A travel diary in nine shots.", len: "0:38", year: "2023",
    poster: "assets/aboutme/web/travel2.jpg", src: "assets/film/day-trip.mp4" },

  // -------------------------------------------------------- landscape 16:9
  { id: "daywithme", title: "Spend a Day With Me", kind: "film", ratio: "16/9",
    note: "A day-in-the-life film for UC San Diego.", len: "3:12", year: "2023",
    poster: "assets/experience/storyteller-filming.jpg", src: "assets/film/spend-a-day.mp4" },
  { id: "tasteofhome", title: "Taste of Home", kind: "film", ratio: "16/9",
    note: "Food, memory, and belonging on campus.", len: "4:05", year: "2024",
    poster: "assets/aboutme/web/foodie2.jpg", src: "assets/film/taste-of-home.mp4" },
  { id: "medill", title: "Why Medill", kind: "film", ratio: "16/9",
    note: "An application film, cut in a weekend.", len: "2:10", year: "2025",
    poster: "assets/experience/nu-graduation-1.jpg", src: "assets/film/why-medill.mp4" },

  // --------------------------------------------------------------- post 4:5
  { id: "alumni", title: "New York Alumni Awards", kind: "post", ratio: "4/5",
    note: "Event coverage for the alumni community.", len: "1:04", year: "2024",
    poster: "assets/experience/ucsd-awards.jpg", src: "assets/film/alumni-awards.mp4" }
];

const reels = REELS.filter((v) => v.kind === "reel");
const films = REELS.filter((v) => v.kind !== "reel");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* One tile. `fit` decides what happens when the tile's shape and the film's
   shape disagree: cover crops, contain letterboxes. Which of the two a layout
   uses is the whole argument of that layout. */
function tile(v, { fit = "cover", shape = v.ratio, chrome = true } = {}) {
  return `<figure class="vt vt-${v.kind} fit-${fit}" style="--ar:${shape}" data-vt data-id="${v.id}">
    <div class="vt-media">
      <video class="vt-video" poster="${v.poster}" preload="none" muted loop playsinline
             aria-label="${esc(v.title)}">
        <source src="${v.src}" type="video/mp4">
      </video>
      <span class="vt-badge">${esc(v.ratio.replace("/", ":"))}</span>
      <span class="vt-len">${esc(v.len)}</span>
      <button class="vt-play" type="button" aria-label="Play ${esc(v.title)}">▶</button>
    </div>
    ${chrome ? `<figcaption><strong>${esc(v.title)}</strong><span>${esc(v.note)}</span></figcaption>` : ""}
  </figure>`;
}

/* ------------------------------------------------------------- 1. two tracks */
$("[data-opt-tracks]").innerHTML = `
  <div class="tracks" data-tracks>
    <div class="track-switch" role="tablist">
      <button role="tab" aria-selected="true" data-track="reel">Reels · ${reels.length}</button>
      <button role="tab" aria-selected="false" data-track="film">Films &amp; posts · ${films.length}</button>
    </div>
    <div class="track-pane is-on" data-pane="reel">
      <div class="reel-grid">${reels.map((v) => tile(v)).join("")}</div>
    </div>
    <div class="track-pane" data-pane="film">
      <div class="film-grid">${films.map((v) => tile(v, { shape: v.ratio })).join("")}</div>
    </div>
  </div>`;

$$("[data-tracks] .track-switch button").forEach((b) => {
  b.onclick = () => {
    const root = b.closest("[data-tracks]");
    $$(".track-switch button", root).forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    $$(".track-pane", root).forEach((p) => p.classList.toggle("is-on", p.dataset.pane === b.dataset.track));
  };
});

/* ------------------------------------------------------------- 2. ratio wall */
/* True masonry needs each tile to span as many 4px grid rows as it actually
   occupies, and that depends on the rendered column width, which CSS cannot
   know. Computing the span from the ratio alone leaves a gap under every tall
   tile. So the span is measured after layout and remeasured on resize. Native
   CSS masonry would remove all of this, but it still ships in one browser. */
$("[data-opt-wall]").innerHTML = `
  <div class="wall" data-wall>${REELS.map((v) => `<div class="wall-cell">${tile(v)}</div>`).join("")}</div>`;

const ROW = 4;
const GAP = 16;
function layoutWall() {
  $$("[data-wall] .wall-cell").forEach((cell) => {
    const h = cell.firstElementChild.getBoundingClientRect().height;
    cell.style.setProperty("--span", String(Math.ceil((h + GAP) / ROW)));
  });
}
layoutWall();
new ResizeObserver(layoutWall).observe($("[data-wall]"));
/* Captions reflow once the webfont arrives, which changes every tile height. */
document.fonts?.ready.then(layoutWall);

/* ------------------------------------------------------- 3. feature + rail */
$("[data-opt-feature]").innerHTML = `
  <div class="feature" data-feature>
    <div class="feature-screen">
      ${tile(films[0], { fit: "contain", chrome: false })}
      <div class="feature-meta">
        <p class="feature-kicker">now showing</p>
        <h3>${esc(films[0].title)}</h3>
        <p>${esc(films[0].note)}</p>
        <p class="feature-sub">${esc(films[0].len)} · ${esc(films[0].year)}</p>
      </div>
    </div>
    <p class="rail-label">and ${reels.length} reels</p>
    <div class="rail">${reels.concat(films.slice(1)).map((v) => tile(v, { shape: "9/16" })).join("")}</div>
  </div>`;

/* ----------------------------------------------------------- 4. phone shelf */
$("[data-opt-shelf]").innerHTML = `
  <div class="shelf">
    <div class="shelf-row">
      ${reels.slice(0, 4).map((v) => `<div class="phone">
        <span class="phone-notch" aria-hidden="true"></span>
        ${tile(v, { shape: "9/16", chrome: false })}
        <p class="phone-label">${esc(v.title)}</p>
      </div>`).join("")}
    </div>
    <div class="shelf-plank" aria-hidden="true"></div>
    <div class="shelf-row shelf-row-tv">
      ${films.slice(0, 2).map((v) => `<div class="tvset">
        ${tile(v, { fit: "contain", chrome: false })}
        <span class="tv-stand" aria-hidden="true"></span>
        <p class="phone-label">${esc(v.title)}</p>
      </div>`).join("")}
    </div>
    <div class="shelf-plank" aria-hidden="true"></div>
  </div>`;

/* ------------------------------------------------------------- 5. snap feed */
$("[data-opt-feed]").innerHTML = `
  <div class="feed" data-feed>
    ${REELS.map((v, i) => `<article class="feed-slide">
      <div class="feed-stage">${tile(v, { fit: "contain", chrome: false })}</div>
      <div class="feed-side">
        <p class="feed-index">${String(i + 1).padStart(2, "0")} / ${REELS.length}</p>
        <h3>${esc(v.title)}</h3>
        <p>${esc(v.note)}</p>
        <p class="feed-sub">${esc(v.ratio.replace("/", ":"))} · ${esc(v.len)} · ${esc(v.year)}</p>
      </div>
    </article>`).join("")}
  </div>`;

/* ------------------------------------------------------- 6. contact sheet */
$("[data-opt-sheet2]").innerHTML = `
  <div class="sheet2">
    <div class="sheet2-grid">
      ${REELS.map((v, i) => `<figure class="cell" data-vt data-id="${v.id}">
        <span class="cell-no">${String(i + 1).padStart(2, "0")}</span>
        <div class="cell-media" style="--ar:${v.ratio}">
          <video class="vt-video" poster="${v.poster}" preload="none" muted loop playsinline
                 aria-label="${esc(v.title)}">
            <source src="${v.src}" type="video/mp4">
          </video>
          <button class="vt-play" type="button" aria-label="Play ${esc(v.title)}">▶</button>
        </div>
        <figcaption><strong>${esc(v.title)}</strong><span>${esc(v.ratio.replace("/", ":"))} · ${esc(v.len)}</span></figcaption>
      </figure>`).join("")}
    </div>
  </div>`;

/* ----------------------------------------------------------------- playback */
/* preload="none" plus play-on-intersection is the pattern the research agrees
   on for a page carrying a dozen clips: nothing is fetched until a tile is on
   screen, and a tile that scrolls away is paused so only a few decoders are
   ever live. Hover starts a muted preview on a pointer device; the play button
   is what makes it work on touch and from the keyboard. */
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hoverable = matchMedia("(hover: hover)").matches;

const io = new IntersectionObserver(
  (rows) => rows.forEach((r) => {
    const v = r.target.querySelector("video");
    if (!v) return;
    if (r.isIntersecting) {
      if (v.preload === "none") v.preload = "metadata";
      if (!hoverable && !reduced) v.play().catch(() => {});
    } else {
      v.pause();
    }
  }),
  { rootMargin: "100px" }
);

$$("[data-vt]").forEach((t) => {
  io.observe(t);
  const v = t.querySelector("video");
  const btn = t.querySelector(".vt-play");
  const start = () => { v.muted = true; v.play().catch(() => {}); };
  if (hoverable && !reduced) {
    t.addEventListener("pointerenter", start);
    t.addEventListener("pointerleave", () => { v.pause(); v.currentTime = 0; });
  }
  btn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (v.paused) { v.muted = false; v.controls = true; v.play().catch(() => {}); }
    else { v.pause(); }
  });
  /* A missing mp4 must not look like a broken tile: mark it so the poster
     reads as the intended still rather than a failed load. */
  v.addEventListener("error", () => t.classList.add("is-stillonly"), true);
});
