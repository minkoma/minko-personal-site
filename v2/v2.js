/* Version 2 — Kinetic Noir.
   Dark, typographic, cinematic. The hero is pinned and handed off to the first
   statement; experience is a pushable horizontal rail; film is a coverflow. */
(function () {
  "use strict";
  const D = window.MINKO;
  const M = window.MinkoMotion;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ----------------------------------------------------------------- render */
  $("[data-hero-role]").textContent = D.profile.lede;
  $("[data-hero-place]").textContent = D.profile.location;
  $(".statement").textContent = D.profile.bio;
  $("[data-year]").textContent = new Date().getFullYear();

  $("[data-stats]").innerHTML = D.stats
    .map(
      (s) => `<li>
        <strong><span data-count="${s.value}" data-decimals="${s.decimals || 0}">0</span>${esc(s.suffix || "")}</strong>
        <span>${esc(s.label)}</span></li>`
    )
    .join("");

  /* One rail holds both schools and jobs, newest first. */
  const timeline = D.work
    .map((w) => ({
      kind: "Work",
      year: w.year,
      title: w.company,
      sub: w.role,
      meta: w.period + " · " + w.place,
      body: w.points,
      tags: w.tags,
      photo: w.photos[0]
    }))
    .concat(
      D.education.map((e) => ({
        kind: "Education",
        year: e.year,
        title: e.school,
        sub: e.degree,
        meta: e.period + " · " + e.place,
        body: [e.detail],
        tags: [],
        photo: e.photo
      }))
    );

  $("[data-timeline]").innerHTML = timeline
    .map(
      (t, i) => `<article class="rail-card" data-horizontal-card data-tilt data-tilt-max="6">
        <div class="rail-photo">
          <img src="${t.photo}" alt="${esc(t.title)}" loading="lazy"
               data-lightbox data-lightbox-group="rail" data-caption="${esc(t.title)}">
          <span class="rail-year">${esc(t.year)}</span>
          <span class="rail-kind">${esc(t.kind)}</span>
        </div>
        <h3>${esc(t.title)}</h3>
        <p class="rail-sub">${esc(t.sub)}</p>
        <p class="rail-meta">${esc(t.meta)}</p>
        ${t.tags.length ? `<ul class="rail-tags">${t.tags.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        <ul class="rail-points">${t.body.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <span class="rail-index">${String(i + 1).padStart(2, "0")}</span>
      </article>`
    )
    .join("");

  $("[data-videos]").innerHTML = D.videos
    .map(
      (v) => `<div class="swiper-slide">
        <article class="film-card">
          <div class="film-frame" data-embed="${v.embed}" data-cursor="Play">
            <img src="${v.poster}" alt="" loading="lazy">
            <span class="film-play" aria-hidden="true">▶</span>
          </div>
          <div class="film-meta">
            <h3>${esc(v.title)}</h3>
            <p>${esc(v.note)}</p>
            <a href="${v.source}" target="_blank" rel="noopener">${esc(v.host)} ↗</a>
          </div>
        </article>
      </div>`
    )
    .join("");

  $("[data-album]").innerHTML = D.design
    .map(
      (d, i) => `<article class="spread" data-stack-card>
        <div class="spread-art">
          <img src="${d.image}" alt="${esc(d.title)}" loading="lazy"
               data-lightbox data-lightbox-group="album" data-caption="${esc(d.title)} — ${esc(d.note)}">
        </div>
        <div class="spread-copy">
          <span class="spread-index">${String(i + 1).padStart(2, "0")} / ${D.design.length}</span>
          <h3>${esc(d.title)}</h3>
          <p>${esc(d.note)}</p>
          <div class="spread-actions">
            <a class="pill" href="${d.pdf}" target="_blank" rel="noopener" data-magnetic="0.2">Open PDF ↗</a>
            <a class="pill ghost" href="${d.pdf}" download>Download ↓</a>
          </div>
        </div>
      </article>`
    )
    .join("");

  /* Flatten the interests into one long pushable strip of photographs. */
  const shots = [];
  D.interests.forEach((it) =>
    it.photos.forEach((p, j) => shots.push({ src: p, it, first: j === 0 }))
  );
  $("[data-interests]").innerHTML = shots
    .map(
      (s, i) => `<figure class="shot ${s.first ? "is-lead" : ""}" style="--r:${(i % 5) - 2}deg">
        <img src="${s.src}" alt="${esc(s.it.title)}" loading="lazy"
             data-lightbox data-lightbox-group="shots" data-caption="${esc(s.it.headline)}">
        ${s.first ? `<figcaption><span aria-hidden="true">${s.it.emoji}</span> ${esc(s.it.title)}<em>${esc(s.it.story)}</em></figcaption>` : ""}
      </figure>`
    )
    .join("");

  $("[data-contact]").innerHTML = `
    <a class="big-link" href="mailto:${D.profile.email}" data-cursor="Write">${esc(D.profile.email)}</a>
    <div class="contact-row">
      <button type="button" class="pill" data-copy>Copy email</button>
      <a class="pill" href="${D.profile.linkedin}" target="_blank" rel="noopener" data-magnetic="0.2">LinkedIn ↗</a>
      <a class="pill" href="${D.profile.resume}" data-magnetic="0.2">Résumé ↗</a>
      <a class="pill ghost" href="tel:${D.profile.phone.replace(/[^0-9+]/g, "")}">${esc(D.profile.phone)}</a>
    </div>`;

  $("[data-skills]").innerHTML = D.skills
    .map((s) => `<div><h4>${esc(s.group)}</h4><p>${s.items.map(esc).join(" · ")}</p></div>`)
    .join("");

  /* ------------------------------------------------------------------ hero */
  const layers = M.buildHero($("[data-hero]"), D.hero);
  M.heroPointer($("[data-hero]"), layers, 1.4);

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
  M.cursor({ trail: true });
  M.sectionNav(".topnav");
  M.copyEmail("[data-copy]", D.profile.email);
  $("[data-scroll-cue]").addEventListener("click", () => M.scrollTo("#statement"));

  if (window.Swiper) {
    new Swiper(".film-swiper", {
      effect: "coverflow",
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: "auto",
      loop: D.videos.length > 2,
      coverflowEffect: { rotate: 28, stretch: 0, depth: 180, modifier: 1, slideShadows: false },
      keyboard: { enabled: true },
      pagination: { el: ".swiper-pagination", clickable: true },
      navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
    });
  }

  if (!M.reduced && window.gsap) {
    /* Pinned hero: the frame shrinks into a card as the first statement
       arrives, so the photograph becomes a corner element rather than
       disappearing. */
    gsap
      .timeline({
        scrollTrigger: { trigger: ".hero", start: "top top", end: "+=120%", scrub: 0.9, pin: true, anticipatePin: 1 }
      })
      .to(layers.name, { yPercent: -22, autoAlpha: 0, ease: "none" }, 0)
      .to("[data-hero-wrap]", { scale: 0.62, borderRadius: 24, ease: "none" }, 0)
      .to(".hero-tint", { opacity: 0.82, ease: "none" }, 0)
      .to(".hero-foot, .hero-ticker", { autoAlpha: 0, ease: "none" }, 0);

    const intro = gsap.timeline({ delay: 0.1 });
    intro
      .from(layers.scene.firstElementChild, { scale: 1.18, duration: 1.8, ease: "power3.out" }, 0)
      .from(layers.name.firstElementChild, { autoAlpha: 0, yPercent: 14, filter: "blur(18px)", duration: 1.4, ease: "power3.out" }, 0.2)
      .from(layers.subject.firstElementChild, { yPercent: 10, autoAlpha: 0, duration: 1.3, ease: "power3.out" }, 0.35)
      .from(".hero-foot > *", { y: 24, autoAlpha: 0, stagger: 0.1, duration: 0.9 }, 0.8);

    /* Section headings skew with scroll velocity — the kinetic signature. */
    const skewables = gsap.utils.toArray("h2, .statement");
    const skewSet = gsap.quickSetter(skewables, "skewY", "deg");
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-5, 5, self.getVelocity() / -320);
        skewSet(v);
        gsap.to(skewables, { skewY: 0, duration: 0.7, ease: "power3", overwrite: true });
      }
    });
  }

  /* Preloader counts to 100 so the dark opening has a beat of its own. */
  const count = $("[data-preloader-count]");
  if (count && !M.reduced) {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: 100,
      duration: 0.9,
      ease: "power1.inOut",
      onUpdate: () => (count.textContent = String(Math.round(obj.v)).padStart(2, "0"))
    });
  }
  M.preloader();
})();
