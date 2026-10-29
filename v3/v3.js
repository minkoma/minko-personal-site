/* Version 3 — Paper Scrapbook.
   Warm paper, handwriting, tape, polaroids you can actually pick up. The hero
   keeps the same three registered layers, framed as a photograph on a page. */
(function () {
  "use strict";
  const D = window.MINKO;
  const M = window.MinkoMotion;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rot = (i, spread) => ((i * 37) % (spread * 2) - spread).toFixed(2);

  /* ----------------------------------------------------------------- render */
  $(".hello-text").textContent = D.profile.bio;
  $("[data-year]").textContent = new Date().getFullYear();

  $("[data-stats]").innerHTML = D.stats
    .map(
      (s, i) => `<li class="sticky" style="--r:${rot(i + 2, 4)}deg">
        <strong><span data-count="${s.value}" data-decimals="${s.decimals || 0}">0</span>${esc(s.suffix || "")}</strong>
        <span>${esc(s.label)}</span></li>`
    )
    .join("");

  const entries = D.education
    .map((e) => ({
      kind: "school",
      year: e.year,
      title: e.school,
      sub: e.degree,
      meta: e.period + " · " + e.place,
      body: [e.detail],
      photos: [e.photo]
    }))
    .concat(
      D.work.map((w) => ({
        kind: "work",
        year: w.year,
        title: w.company,
        sub: w.role,
        meta: w.period + " · " + w.place,
        body: w.points,
        photos: w.photos,
        tags: w.tags
      }))
    )
    .sort((a, b) => a.year - b.year);

  $("[data-timeline]").innerHTML = entries
    .map(
      (e, i) => `<article class="path-note note-${e.kind}" data-reveal="${i % 2 ? "left" : "right"}" style="--r:${rot(i, 2.4)}deg">
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
        <div class="note-photos">
          ${e.photos
            .map(
              (p, j) =>
                `<img src="${p}" alt="${esc(e.title)}" loading="lazy" style="--r:${rot(i + j, 4)}deg"
                      data-lightbox data-lightbox-group="path" data-caption="${esc(e.title)}">`
            )
            .join("")}
        </div>
      </article>`
    )
    .join("");

  $("[data-videos]").innerHTML = D.videos
    .map(
      (v, i) => `<article class="reel" style="--r:${rot(i, 3)}deg">
        <div class="reel-holes" aria-hidden="true"></div>
        <div class="reel-frame" data-embed="${v.embed}" data-cursor="Play">
          <img src="${v.poster}" alt="" loading="lazy">
          <span class="reel-play" aria-hidden="true">▶</span>
        </div>
        <div class="reel-meta">
          <h3>${esc(v.title)}</h3>
          <p>${esc(v.note)}</p>
          <a href="${v.source}" target="_blank" rel="noopener">watch on ${esc(v.host)} ↗</a>
        </div>
      </article>`
    )
    .join("");

  $("[data-album]").innerHTML =
    D.design
      .map(
        (d, i) => `<article class="deck" data-horizontal-card style="--r:${rot(i + 1, 3)}deg">
        <span class="tape tape-tl" aria-hidden="true"></span>
        <img src="${d.image}" alt="${esc(d.title)}" loading="lazy"
             data-lightbox data-lightbox-group="album" data-caption="${esc(d.title)} — ${esc(d.note)}">
        <div class="deck-copy">
          <span class="deck-kind">${esc(d.kind)}</span>
          <h3>${esc(d.title)}</h3>
          <p>${esc(d.note)}</p>
          <a class="button" href="${d.pdf}" target="_blank" rel="noopener" data-magnetic="0.2">open the pdf ↗</a>
        </div>
      </article>`
      )
      .join("") +
    `<article class="deck deck-end" data-horizontal-card>
       <h3>that’s the shelf!</h3>
       <p class="hand">want it all in one file?</p>
       <a class="button" href="../assets/design-portfolio.pdf" download data-magnetic="0.2">download everything ↓</a>
     </article>`;

  $("[data-interests]").innerHTML = D.interests
    .map(
      (it, i) => `<article class="scrap" style="--r:${rot(i, 6)}deg" data-scrap>
        <span class="tape tape-tl" aria-hidden="true"></span>
        <div class="scrap-photos">
          ${it.photos
            .slice(0, 3)
            .map(
              (p) =>
                `<img src="${p}" alt="${esc(it.title)}" loading="lazy"
                      data-lightbox data-lightbox-group="int${i}" data-caption="${esc(it.headline)}">`
            )
            .join("")}
        </div>
        <span class="scrap-emoji" aria-hidden="true">${it.emoji}</span>
        <h3>${esc(it.title)}</h3>
        <p class="scrap-head">${esc(it.headline)}</p>
        <p class="scrap-story">${esc(it.story)}</p>
      </article>`
    )
    .join("");

  $("[data-contact]").innerHTML = `
    <span class="tape tape-tl" aria-hidden="true"></span>
    <p class="hand">the fastest way to reach me</p>
    <a class="big-link" href="mailto:${D.profile.email}" data-cursor="Write" data-confetti>${esc(D.profile.email)}</a>
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

  /* ------------------------------------------------------------------ hero */
  const layers = M.buildHero($("[data-hero]"), D.hero);
  M.heroPointer($("[data-hero]"), layers, 0.8);

  document.querySelectorAll("[data-embed]").forEach((frame) => {
    frame.addEventListener("click", () => {
      if (frame.dataset.loaded) return;
      frame.dataset.loaded = "1";
      const iframe = document.createElement("iframe");
      iframe.src = frame.dataset.embed;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.title = "Embedded player";
      frame.appendChild(iframe);
      frame.classList.add("is-playing");
    });
  });

  /* -------------------------------------------------------------- behaviour */
  M.autoInit();
  M.cursor();
  M.sectionNav(".topnav");
  M.copyEmail("[data-copy]", D.profile.email);

  /* Pick up the scraps. Draggable keeps the paper metaphor literal. */
  if (window.Draggable && !M.touch) {
    Draggable.create("[data-scrap]", {
      type: "x,y",
      bounds: ".scatter",
      edgeResistance: 0.65,
      cursor: "grab",
      activeCursor: "grabbing",
      onPress() {
        gsap.to(this.target, { rotate: 0, scale: 1.04, zIndex: 50, duration: 0.3, boxShadow: "0 26px 60px rgba(80,55,30,.3)" });
      },
      onRelease() {
        gsap.to(this.target, { scale: 1, duration: 0.4, ease: "power2.out" });
      }
    });
  }

  /* Confetti on the two cheerful buttons. */
  const burst = (x, y) => {
    if (M.reduced) return;
    const host = document.createElement("div");
    host.className = "burst";
    host.style.cssText = `left:${x}px;top:${y}px`;
    document.body.appendChild(host);
    const colors = ["#c9a0ff", "#ffd166", "#8fd6c4", "#ff9fb2", "#8f6fe8"];
    for (let i = 0; i < 24; i++) {
      const bit = document.createElement("i");
      bit.style.background = colors[i % colors.length];
      host.appendChild(bit);
      gsap.fromTo(
        bit,
        { x: 0, y: 0, scale: 1, opacity: 1 },
        {
          x: (Math.random() - 0.5) * 240,
          y: (Math.random() - 0.9) * 220,
          rotate: Math.random() * 540,
          scale: 0.2,
          opacity: 0,
          duration: 0.9 + Math.random() * 0.5,
          ease: "power2.out"
        }
      );
    }
    setTimeout(() => host.remove(), 1600);
  };
  document.querySelectorAll("[data-confetti]").forEach((el) =>
    el.addEventListener("click", (e) => burst(e.clientX, e.clientY))
  );

  if (!M.reduced && window.gsap) {
    /* The dotted ribbon draws itself down the page. */
    const ribbon = $("[data-ribbon]");
    const len = ribbon.getTotalLength();
    gsap.set(ribbon, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(ribbon, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: { trigger: "main", start: "top top", end: "bottom bottom", scrub: 0.6 }
    });

    /* The photograph sways on its tape, then settles. */
    gsap.fromTo(
      "[data-polaroid]",
      { rotate: -3.4, y: -40, autoAlpha: 0, scale: 0.94 },
      { rotate: -1.2, y: 0, autoAlpha: 1, scale: 1, duration: 1.5, ease: "elastic.out(1,0.55)", delay: 0.2 }
    );
    gsap.to("[data-polaroid]", {
      rotate: -2.2,
      duration: 5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: 1.8
    });
    gsap.from(".scribble", { autoAlpha: 0, y: 14, rotate: 6, stagger: 0.18, duration: 0.9, delay: 0.9 });

    /* Hero exit: the page lifts, the lettering slides out from behind her. */
    gsap
      .timeline({
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 }
      })
      .to(layers.name, { yPercent: -14, xPercent: -6, autoAlpha: 0.15, ease: "none" }, 0)
      .to("[data-polaroid]", { yPercent: -12, rotate: 2.4, ease: "none" }, 0)
      .to(".scribble", { autoAlpha: 0, ease: "none" }, 0);

    /* Floating paper confetti in the hero, subtle. */
    const conf = $(".hero .confetti");
    for (let i = 0; i < 14; i++) {
      const bit = document.createElement("i");
      bit.style.cssText = `left:${Math.random() * 100}%;animation-delay:${(-Math.random() * 16).toFixed(1)}s;animation-duration:${(13 + Math.random() * 10).toFixed(1)}s`;
      conf.appendChild(bit);
    }
  }

  M.preloader();
})();
