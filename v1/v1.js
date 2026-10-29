/* Version 1 — Lakeside Editorial.
   Renders every section from data/minko.js, then wires the motion layer. */
(function () {
  "use strict";
  const D = window.MINKO;
  const M = window.MinkoMotion;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ----------------------------------------------------------------- render */
  $("[data-hero-lede]").textContent = D.profile.lede;
  $("[data-highlight]").textContent = D.profile.bio;
  $("[data-year]").textContent = new Date().getFullYear();

  $("[data-stats]").innerHTML = D.stats
    .map(
      (s) => `<li data-reveal-item>
        <strong><span data-count="${s.value}" data-decimals="${s.decimals || 0}">0</span>${esc(s.suffix || "")}</strong>
        <span>${esc(s.label)}</span>
      </li>`
    )
    .join("");

  $("[data-journey]").innerHTML = D.education
    .map(
      (e, i) => `<article class="edu" data-reveal="${i % 2 ? "left" : "right"}">
        <div class="edu-photo" data-parallax="${i % 2 ? -0.12 : 0.12}">
          <img src="${e.photo}" alt="${esc(e.school)}" loading="lazy"
               data-lightbox data-lightbox-group="edu" data-caption="${esc(e.school)}">
          <span class="edu-year">${esc(e.year)}</span>
        </div>
        <div class="edu-copy">
          <h3>${esc(e.school)}</h3>
          <p class="edu-degree">${esc(e.degree)}</p>
          <p class="edu-meta">${esc(e.period)} · ${esc(e.place)}</p>
          <p class="edu-detail">${esc(e.detail)}</p>
        </div>
      </article>`
    )
    .join("");

  $("[data-work]").innerHTML = D.work
    .map(
      (w, i) => `<article class="job" data-stack-card data-tilt data-tilt-max="4">
        <div class="job-body">
          <p class="job-period">${esc(w.period)} · ${esc(w.place)}</p>
          <h3>${esc(w.company)}</h3>
          <p class="job-sub">${esc(w.sub)}</p>
          <p class="job-role">${esc(w.role)}</p>
          <ul class="job-tags">${w.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          <ul class="job-points">${w.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </div>
        <div class="job-photos">
          ${w.photos
            .map(
              (p) =>
                `<img src="${p}" alt="${esc(w.company)}" loading="lazy" data-lightbox data-lightbox-group="job${i}" data-caption="${esc(w.company)}">`
            )
            .join("")}
        </div>
      </article>`
    )
    .join("");

  $("[data-skills]").innerHTML = D.skills
    .map(
      (s) => `<div class="skill" data-reveal-item>
        <h4>${esc(s.group)}</h4>
        <p>${s.items.map(esc).join(" · ")}</p>
      </div>`
    )
    .join("");

  $("[data-videos]").innerHTML = D.videos
    .map(
      (v) => `<article class="film-card" data-reveal-item data-tilt data-tilt-max="6">
        <div class="film-frame" data-embed="${v.embed}" data-cursor="Play">
          <img src="${v.poster}" alt="" loading="lazy">
          <button type="button" class="film-play" aria-label="Play ${esc(v.title)}">▶</button>
        </div>
        <div class="film-meta">
          <h3>${esc(v.title)}</h3>
          <p>${esc(v.note)}</p>
          <a href="${v.source}" target="_blank" rel="noopener">Open on ${esc(v.host)} ↗</a>
        </div>
      </article>`
    )
    .join("");

  $("[data-album]").innerHTML =
    D.design
      .map(
        (d, i) => `<article class="album-card" data-horizontal-card data-tilt data-tilt-max="7" data-tilt-start="${i % 2 ? 3 : -3}">
        <div class="album-art">
          <img src="${d.image}" alt="${esc(d.title)}" loading="lazy" data-lightbox data-lightbox-group="album" data-caption="${esc(d.title)} — ${esc(d.note)}">
          <span class="album-kind">${esc(d.kind)}</span>
        </div>
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.note)}</p>
        <a class="pill" href="${d.pdf}" target="_blank" rel="noopener" data-magnetic="0.2">Open PDF ↗</a>
      </article>`
      )
      .join("") +
    `<article class="album-card album-end" data-horizontal-card>
       <h3>Want the whole deck?</h3>
       <p>Every project above is a PDF you can open or download.</p>
       <a class="pill" href="../assets/design-portfolio.pdf" download data-magnetic="0.2">Download portfolio ↓</a>
     </article>`;

  $("[data-interests]").innerHTML = D.interests
    .map(
      (it, i) => `<article class="card ${it.photos.length > 2 ? "card-wide" : ""}" data-reveal="scale">
        <div class="card-photos">
          ${it.photos
            .map(
              (p, j) =>
                `<img src="${p}" alt="${esc(it.title)}" loading="lazy" style="--j:${j}"
                      data-lightbox data-lightbox-group="int${i}" data-caption="${esc(it.headline)}">`
            )
            .join("")}
        </div>
        <div class="card-copy">
          <span class="card-emoji" aria-hidden="true">${it.emoji}</span>
          <h3>${esc(it.title)}</h3>
          <p class="card-headline">${esc(it.headline)}</p>
          <p class="card-story">${esc(it.story)}</p>
        </div>
      </article>`
    )
    .join("");

  $("[data-contact]").innerHTML = `
    <a class="big-link" href="mailto:${D.profile.email}" data-magnetic="0.25" data-cursor="Email">${esc(D.profile.email)}</a>
    <div class="small-links">
      <button type="button" class="pill" data-copy>Copy email</button>
      <a class="pill" href="${D.profile.linkedin}" target="_blank" rel="noopener" data-magnetic="0.2">LinkedIn ↗</a>
      <a class="pill" href="${D.profile.resume}" data-magnetic="0.2">Résumé ↗</a>
    </div>
    <p class="contact-note">${esc(D.profile.location)} · ${esc(D.profile.languages)}</p>`;

  /* ------------------------------------------------------------------ hero */
  const layers = M.buildHero($("[data-hero]"), D.hero);
  M.heroPointer($("[data-hero]"), layers, 1);

  /* Falling petals: cheap ambient life behind the lettering. */
  const petals = $(".hero-petals");
  if (!M.reduced) {
    for (let i = 0; i < 16; i++) {
      const p = document.createElement("i");
      p.style.cssText = `left:${Math.random() * 100}%;animation-delay:${(-Math.random() * 18).toFixed(2)}s;animation-duration:${(12 + Math.random() * 14).toFixed(1)}s;transform:scale(${(0.5 + Math.random()).toFixed(2)})`;
      petals.appendChild(p);
    }
  }

  /* ------------------------------------------------------------ click videos */
  document.querySelectorAll("[data-embed]").forEach((frame) => {
    frame.addEventListener("click", () => {
      if (frame.dataset.loaded) return;
      frame.dataset.loaded = "1";
      const iframe = document.createElement("iframe");
      iframe.src = frame.dataset.embed;
      iframe.loading = "lazy";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.title = "Embedded player";
      frame.appendChild(iframe);
      frame.classList.add("is-playing");
    });
  });

  /* -------------------------------------------------------------- behaviour */
  M.autoInit();
  M.cursor();
  M.sectionNav(".dots");
  M.copyEmail("[data-copy]", D.profile.email);
  $("[data-scroll-cue]").addEventListener("click", () => M.scrollTo("#intro"));

  if (!M.reduced && window.gsap) {
    /* Hero exit: the scene pushes back, the lettering lifts away faster than
       she does, so the depth order stays legible the whole way out. */
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8, pin: false }
    });
    tl.to(layers.scene, { scale: 1.14, ease: "none" }, 0)
      .to(layers.name, { yPercent: -16, scale: 1.06, autoAlpha: 0.1, ease: "none" }, 0)
      .to(layers.subject, { yPercent: 7, scale: 1.04, ease: "none" }, 0)
      .to(".hero-copy", { y: -90, autoAlpha: 0, ease: "none" }, 0)
      .to(".hero-cue", { autoAlpha: 0, ease: "none" }, 0);

    /* Entrance: name first, then she rises into place in front of it.
       These target the inner images, not the layer wrappers, so they never
       fight the scrubbed timeline above for the same properties. */
    const intro = gsap.timeline({ delay: 0.15 });
    intro
      .from(layers.name.firstElementChild, { autoAlpha: 0, scale: 1.1, y: -40, duration: 1.3, ease: "power3.out" })
      .from(layers.subject.firstElementChild, { y: 70, autoAlpha: 0, duration: 1.2, ease: "power3.out" }, 0.25)
      .from(".hero-copy > *", { y: 30, autoAlpha: 0, duration: 1, stagger: 0.12, ease: "power3.out" }, 0.6)
      .from(".hero-cue", { autoAlpha: 0, duration: 0.8 }, 0.9);

    /* Album cards start slightly rotated, straightening as they centre. */
    document.querySelectorAll("[data-tilt-start]").forEach((el) => {
      el.dataset.tilt = el.dataset.tiltStart;
    });
  }

  M.preloader();
})();
