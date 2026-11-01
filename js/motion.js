/* Shared motion primitives for every version of the site.
   Each primitive is opt-in through a data attribute, so a layout chooses its
   behaviour in markup and no version carries another version's effects.

   Depends on: gsap, ScrollTrigger, (optional) Draggable, Lenis.
   Everything degrades to static, readable content when prefers-reduced-motion
   is set or when JavaScript is unavailable. */
(function (global) {
  "use strict";

  /* `?static=1` renders everything in its finished state with no motion. Used
     for screenshots and visual QA, and it doubles as a plain-page fallback. */
  const staticMode = /(?:^|[?&])static=1(?:&|$)/.test(global.location.search);
  /* `?flat=1` additionally collapses the full-height hero, so one tall
     screenshot can show the whole page at once. */
  if (/(?:^|[?&])flat=1(?:&|$)/.test(global.location.search))
    document.documentElement.classList.add("is-flat");
  const reduced = global.matchMedia("(prefers-reduced-motion: reduce)").matches || staticMode;
  const touch = global.matchMedia("(hover: none)").matches;
  const hasGsap = typeof global.gsap !== "undefined";
  /* `?fast=1` runs every GSAP animation 40× faster. QA only: headless browsers
     throttle animation frames, so this lets a screenshot catch the end state
     of an intro without changing what a real visitor sees. */
  if (hasGsap && /(?:^|[?&])fast=1(?:&|$)/.test(global.location.search)) gsap.globalTimeline.timeScale(40);
  if (hasGsap && global.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (hasGsap && global.Draggable) gsap.registerPlugin(Draggable);

  const M = {
    reduced,
    touch,
    lenis: null,
    /* ---------------------------------------------------------------- scroll */
    smoothScroll(opts) {
      if (reduced || typeof global.Lenis === "undefined") return null;
      const lenis = new global.Lenis(
        Object.assign({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 }, opts)
      );
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      M.lenis = lenis;
      document.documentElement.classList.add("has-smooth-scroll");
      return lenis;
    },

    scrollTo(target) {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      if (M.lenis) M.lenis.scrollTo(el, { offset: 0, duration: 1.2 });
      else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    },

    /* ------------------------------------------------------------ split text */
    split(el, mode) {
      if (el.dataset.splitReady === "true") return el.querySelectorAll(".sp-unit");
      const label = el.textContent;
      el.setAttribute("aria-label", label.trim());
      const pieces = mode === "chars" ? Array.from(label) : label.split(/(\s+)/);
      el.textContent = "";
      pieces.forEach((piece) => {
        if (!piece.trim()) {
          el.appendChild(document.createTextNode(piece === "" ? " " : piece));
          return;
        }
        const mask = document.createElement("span");
        mask.className = "sp-mask";
        mask.setAttribute("aria-hidden", "true");
        const unit = document.createElement("span");
        unit.className = "sp-unit";
        unit.textContent = piece;
        mask.appendChild(unit);
        el.appendChild(mask);
        if (mode !== "chars") el.appendChild(document.createTextNode(" "));
      });
      el.dataset.splitReady = "true";
      return el.querySelectorAll(".sp-unit");
    },

    splitReveals(scope) {
      const nodes = (scope || document).querySelectorAll("[data-split]");
      if (!hasGsap || reduced) {
        nodes.forEach((n) => (n.style.opacity = 1));
        return;
      }
      nodes.forEach((el) => {
        const units = M.split(el, el.dataset.split === "chars" ? "chars" : "words");
        gsap.fromTo(
          units,
          { yPercent: 115, autoAlpha: 0, rotate: el.dataset.split === "chars" ? 6 : 2 },
          {
            yPercent: 0,
            autoAlpha: 1,
            rotate: 0,
            duration: 1,
            ease: "power4.out",
            stagger: el.dataset.split === "chars" ? 0.028 : 0.055,
            scrollTrigger: { trigger: el, start: "top 86%", once: true }
          }
        );
      });
    },

    /* --------------------------------------------------------------- reveals */
    reveals(scope) {
      const nodes = (scope || document).querySelectorAll("[data-reveal]");
      if (!hasGsap || reduced) {
        nodes.forEach((n) => n.classList.add("is-in"));
        return;
      }
      nodes.forEach((el) => {
        const kids = el.querySelectorAll("[data-reveal-item]");
        const targets = kids.length ? kids : [el];
        const dir = el.dataset.reveal || "up";
        const from = { autoAlpha: 0, filter: "blur(10px)" };
        if (dir === "up") from.y = 44;
        if (dir === "down") from.y = -44;
        if (dir === "left") from.x = 60;
        if (dir === "right") from.x = -60;
        if (dir === "scale") from.scale = 0.92;
        gsap.fromTo(targets, from, {
          autoAlpha: 1,
          filter: "blur(0px)",
          x: 0,
          y: 0,
          scale: 1,
          duration: 1.05,
          ease: "power4.out",
          stagger: 0.085,
          scrollTrigger: { trigger: el, start: "top 86%", once: true }
        });
      });
    },

    /* -------------------------------------------------------------- parallax */
    parallax(scope) {
      if (!hasGsap || reduced) return;
      (scope || document).querySelectorAll("[data-parallax]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || -0.15;
        const trigger = el.closest("[data-parallax-scene]") || el.parentElement;
        gsap.fromTo(
          el,
          { y: () => -global.innerHeight * speed * 0.5 },
          {
            y: () => global.innerHeight * speed * 0.5,
            ease: "none",
            scrollTrigger: {
              trigger,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
              invalidateOnRefresh: true
            }
          }
        );
      });
    },

    /* ----------------------------------------------------------------- hero */
    /* Builds the three registered layers of the supplied artwork:
       scene (the lake with the lettering painted out), the name, and the
       cut-out subject. They share one 16:9 stage so they stay in register at
       any viewport size, which is what lets the name pass behind her. */
    buildHero(stage, hero) {
      const [fw, fh] = hero.frame;
      const pct = (box) => ({
        left: (box[0] / fw) * 100 + "%",
        top: (box[1] / fh) * 100 + "%",
        width: ((box[2] - box[0]) / fw) * 100 + "%",
        height: ((box[3] - box[1]) / fh) * 100 + "%"
      });

      stage.innerHTML = `
        <div class="hero-layer hero-scene" data-hero-scene>
          <img src="${hero.scene}" alt="Lake Michigan shoreline with the Chicago skyline" fetchpriority="high" width="${fw}" height="${fh}">
        </div>
        <div class="hero-layer hero-name" data-hero-name>
          <img src="${hero.name}" alt="Minko Ma" width="${hero.nameBox[2] - hero.nameBox[0]}" height="${hero.nameBox[3] - hero.nameBox[1]}">
        </div>
        <div class="hero-layer hero-subject" data-hero-subject>
          <img src="${hero.subject}" alt="Minko Ma in her Northwestern graduation gown, holding a bouquet" fetchpriority="high" width="${fw}" height="${fh}">
        </div>`;

      const nameEl = stage.querySelector(".hero-name img");
      Object.assign(nameEl.style, pct(hero.nameBox), { position: "absolute" });
      return {
        scene: stage.querySelector("[data-hero-scene]"),
        name: stage.querySelector("[data-hero-name]"),
        subject: stage.querySelector("[data-hero-subject]")
      };
    },

    /* Mouse-driven depth. Only the name and the subject move relative to the
       scene, which reads as real depth without exposing the repainted areas. */
    heroPointer(stage, layers, strength) {
      if (reduced || touch || !hasGsap) return;
      const s = strength || 1;
      const set = {
        scene: gsap.quickTo(layers.scene, "x", { duration: 0.9, ease: "power3" }),
        sceneY: gsap.quickTo(layers.scene, "y", { duration: 0.9, ease: "power3" }),
        name: gsap.quickTo(layers.name, "x", { duration: 0.7, ease: "power3" }),
        nameY: gsap.quickTo(layers.name, "y", { duration: 0.7, ease: "power3" }),
        subj: gsap.quickTo(layers.subject, "x", { duration: 0.5, ease: "power3" }),
        subjY: gsap.quickTo(layers.subject, "y", { duration: 0.5, ease: "power3" })
      };
      global.addEventListener("pointermove", (e) => {
        const nx = (e.clientX / global.innerWidth - 0.5) * 2;
        const ny = (e.clientY / global.innerHeight - 0.5) * 2;
        set.scene(-nx * 10 * s);
        set.sceneY(-ny * 6 * s);
        set.name(nx * 20 * s);
        set.nameY(ny * 12 * s);
        set.subj(nx * 34 * s);
        set.subjY(ny * 18 * s);
      });
    },

    /* --------------------------------------------------------------- counters */
    counters(scope) {
      (scope || document).querySelectorAll("[data-count]").forEach((el) => {
        const to = parseFloat(el.dataset.count);
        const dec = parseInt(el.dataset.decimals || "0", 10);
        if (!hasGsap || reduced) {
          el.textContent = to.toFixed(dec);
          return;
        }
        const obj = { v: 0 };
        gsap.to(obj, {
          v: to,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => (el.textContent = obj.v.toFixed(dec)),
          scrollTrigger: { trigger: el, start: "top 90%", once: true }
        });
      });
    },

    /* --------------------------------------------------------------- marquee */
    marquee(scope) {
      (scope || document).querySelectorAll("[data-marquee]").forEach((el) => {
        const track = el.firstElementChild;
        if (!track) return;
        track.innerHTML += track.innerHTML;
        if (!hasGsap || reduced) return;
        const speed = parseFloat(el.dataset.marquee) || 28;
        const tween = gsap.to(track, {
          xPercent: -50,
          duration: speed,
          ease: "none",
          repeat: -1
        });
        if (el.dataset.marqueeScroll === "true" && global.ScrollTrigger) {
          ScrollTrigger.create({
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              tween.timeScale(1 + Math.min(Math.abs(self.getVelocity() / 900), 4) * (self.direction));
            },
            onLeave: () => tween.timeScale(1),
            onLeaveBack: () => tween.timeScale(1)
          });
        }
      });
    },

    /* --------------------------------------------- pinned horizontal gallery */
    horizontal(scope) {
      if (!hasGsap) return;
      (scope || document).querySelectorAll("[data-horizontal]").forEach((section) => {
        const track = section.querySelector("[data-horizontal-track]");
        if (!track) return;
        const fill = section.querySelector("[data-horizontal-progress]");
        if (reduced || global.innerWidth < 760) {
          section.classList.add("is-native-scroll");
          return;
        }
        const distance = () => track.scrollWidth - global.innerWidth + 80;
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + distance(),
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (fill) fill.style.transform = "scaleX(" + self.progress + ")";
            }
          }
        });
        /* Cards lift and straighten as they reach the middle of the screen. */
        track.querySelectorAll("[data-horizontal-card]").forEach((card) => {
          gsap.fromTo(
            card,
            { scale: 0.9, rotate: parseFloat(card.dataset.tilt || 0) },
            {
              scale: 1,
              rotate: 0,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                containerAnimation: tween,
                start: "left right",
                end: "center center",
                scrub: true
              }
            }
          );
        });
      });
    },

    /* ----------------------------------------------------------- sticky stack */
    stack(scope) {
      if (!hasGsap || reduced) return;
      (scope || document).querySelectorAll("[data-stack]").forEach((stackEl) => {
        const cards = gsap.utils.toArray(stackEl.querySelectorAll("[data-stack-card]"));
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          gsap.to(card, {
            scale: 0.93 + i * 0.012,
            yPercent: -4,
            autoAlpha: 0.55,
            filter: "blur(3px)",
            ease: "none",
            scrollTrigger: {
              trigger: next,
              start: "top 80%",
              end: "top 22%",
              scrub: true,
              invalidateOnRefresh: true
            }
          });
        });
      });
    },

    /* ------------------------------------------------- scrubbed pinned scenes */
    scenes(scope) {
      if (!hasGsap || reduced) return;
      (scope || document).querySelectorAll("[data-scene]").forEach((scene) => {
        const media = scene.querySelector("[data-scene-media]");
        const copy = scene.querySelectorAll("[data-scene-copy]");
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scene,
            start: "top top",
            end: "+=" + (scene.dataset.scene || "130%"),
            scrub: 1.1,
            pin: true,
            anticipatePin: 1
          }
        });
        if (media) tl.fromTo(media, { scale: 1.12 }, { scale: 1, ease: "none" }, 0);
        if (copy.length)
          tl.fromTo(
            copy,
            { autoAlpha: 0, y: 48 },
            { autoAlpha: 1, y: 0, stagger: 0.18, ease: "none" },
            0.1
          );
      });
    },

    /* ----------------------------------------- word-by-word scroll highlight */
    highlight(scope) {
      if (!hasGsap) return;
      (scope || document).querySelectorAll("[data-highlight]").forEach((el) => {
        const units = M.split(el, "words");
        if (reduced) {
          gsap.set(units, { opacity: 1 });
          return;
        }
        gsap.fromTo(
          units,
          { opacity: 0.16 },
          {
            opacity: 1,
            stagger: 0.4,
            ease: "none",
            scrollTrigger: { trigger: el, start: el.dataset.hlStart || "top 78%", end: el.dataset.hlEnd || "bottom 45%", scrub: true }
          }
        );
      });
    },

    /* --------------------------------------------------------------- cursor */
    cursor(opts) {
      if (touch || reduced) return;
      const el = document.createElement("div");
      el.className = "cursor";
      el.innerHTML = '<span class="cursor-dot"></span><span class="cursor-ring"></span><span class="cursor-label"></span>';
      document.body.appendChild(el);
      document.documentElement.classList.add("has-cursor");
      const dot = el.querySelector(".cursor-dot");
      const ring = el.querySelector(".cursor-ring");
      const label = el.querySelector(".cursor-label");
      const toDotX = gsap.quickTo(dot, "x", { duration: 0.08 });
      const toDotY = gsap.quickTo(dot, "y", { duration: 0.08 });
      const toRingX = gsap.quickTo(ring, "x", { duration: 0.42, ease: "power3" });
      const toRingY = gsap.quickTo(ring, "y", { duration: 0.42, ease: "power3" });
      const toLabX = gsap.quickTo(label, "x", { duration: 0.3, ease: "power3" });
      const toLabY = gsap.quickTo(label, "y", { duration: 0.3, ease: "power3" });
      global.addEventListener("pointermove", (e) => {
        toDotX(e.clientX);
        toDotY(e.clientY);
        toRingX(e.clientX);
        toRingY(e.clientY);
        toLabX(e.clientX);
        toLabY(e.clientY);
      });
      document.addEventListener("pointerover", (e) => {
        const target = e.target.closest("[data-cursor]");
        if (target) {
          el.classList.add("is-active");
          label.textContent = target.dataset.cursor || "";
          el.classList.toggle("has-label", Boolean(target.dataset.cursor));
        } else if (e.target.closest("a, button")) {
          el.classList.add("is-link");
        }
      });
      document.addEventListener("pointerout", (e) => {
        if (e.target.closest("[data-cursor]")) {
          el.classList.remove("is-active", "has-label");
          label.textContent = "";
        }
        if (e.target.closest("a, button")) el.classList.remove("is-link");
      });
      if (opts && opts.trail) M.trail();
    },

    trail() {
      if (touch || reduced) return;
      const canvas = document.createElement("canvas");
      canvas.className = "trail-canvas";
      document.body.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      let pts = [];
      const size = () => {
        canvas.width = global.innerWidth;
        canvas.height = global.innerHeight;
      };
      size();
      global.addEventListener("resize", size);
      global.addEventListener("pointermove", (e) => pts.push({ x: e.clientX, y: e.clientY, life: 1 }));
      (function frame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pts = pts.filter((p) => (p.life -= 0.03) > 0).slice(-40);
        ctx.lineCap = "round";
        for (let i = 1; i < pts.length; i++) {
          ctx.beginPath();
          ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
          ctx.lineTo(pts[i].x, pts[i].y);
          ctx.strokeStyle = "rgba(124,96,196," + pts[i].life * 0.5 + ")";
          ctx.lineWidth = pts[i].life * 11;
          ctx.stroke();
        }
        requestAnimationFrame(frame);
      })();
    },

    magnetic(scope) {
      if (touch || reduced || !hasGsap) return;
      (scope || document).querySelectorAll("[data-magnetic]").forEach((el) => {
        const pull = parseFloat(el.dataset.magnetic) || 0.3;
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          gsap.to(el, {
            x: (e.clientX - (r.left + r.width / 2)) * pull,
            y: (e.clientY - (r.top + r.height / 2)) * pull,
            duration: 0.4,
            ease: "power3.out"
          });
        });
        el.addEventListener("pointerleave", () =>
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" })
        );
      });
    },

    tilt(scope) {
      if (touch || reduced || !hasGsap) return;
      (scope || document).querySelectorAll("[data-tilt]").forEach((el) => {
        const max = parseFloat(el.dataset.tiltMax) || 9;
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          gsap.to(el, {
            rotateY: ((e.clientX - r.left) / r.width - 0.5) * max * 2,
            rotateX: -((e.clientY - r.top) / r.height - 0.5) * max * 2,
            transformPerspective: 900,
            duration: 0.4,
            ease: "power2.out"
          });
        });
        el.addEventListener("pointerleave", () =>
          gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.7, ease: "power3.out" })
        );
      });
    },

    /* ------------------------------------------------------------- progress */
    progress(selector) {
      const bar = document.querySelector(selector || "[data-progress]");
      if (!bar) return;
      const update = () => {
        const max = document.documentElement.scrollHeight - global.innerHeight;
        bar.style.transform = "scaleX(" + (max > 0 ? global.scrollY / max : 0) + ")";
      };
      global.addEventListener("scroll", update, { passive: true });
      update();
    },

    /* --------------------------------------------------------------- nav dots */
    sectionNav(navSelector) {
      const links = document.querySelectorAll(navSelector + " a[href^='#']");
      if (!links.length) return;
      links.forEach((link) =>
        link.addEventListener("click", (e) => {
          const target = document.querySelector(link.getAttribute("href"));
          if (!target) return;
          e.preventDefault();
          M.scrollTo(target);
        })
      );
      const byId = {};
      links.forEach((l) => (byId[l.getAttribute("href").slice(1)] = l));
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            const link = byId[entry.target.id];
            if (link && entry.isIntersecting) {
              links.forEach((l) => l.classList.remove("is-current"));
              link.classList.add("is-current");
            }
          }),
        { rootMargin: "-45% 0px -45% 0px" }
      );
      Object.keys(byId).forEach((id) => {
        const section = document.getElementById(id);
        if (section) io.observe(section);
      });
    },

    /* ------------------------------------------------------------- lightbox */
    lightbox() {
      const box = document.createElement("div");
      box.className = "lightbox";
      box.setAttribute("aria-hidden", "true");
      box.innerHTML =
        '<button class="lightbox-close" aria-label="Close">×</button>' +
        '<button class="lightbox-prev" aria-label="Previous">‹</button>' +
        '<figure><img alt=""><figcaption></figcaption></figure>' +
        '<button class="lightbox-next" aria-label="Next">›</button>';
      document.body.appendChild(box);
      const img = box.querySelector("img");
      const cap = box.querySelector("figcaption");
      let group = [];
      let index = 0;

      const show = (i) => {
        index = (i + group.length) % group.length;
        const node = group[index];
        img.src = node.dataset.full || node.currentSrc || node.src;
        cap.textContent = node.dataset.caption || node.alt || "";
      };
      const open = (node) => {
        const scopeSel = node.dataset.lightboxGroup;
        group = scopeSel
          ? Array.from(document.querySelectorAll("[data-lightbox-group='" + scopeSel + "']"))
          : [node];
        show(group.indexOf(node));
        box.classList.add("is-open");
        box.setAttribute("aria-hidden", "false");
        document.documentElement.classList.add("is-locked");
        if (M.lenis) M.lenis.stop();
      };
      const close = () => {
        box.classList.remove("is-open");
        box.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove("is-locked");
        if (M.lenis) M.lenis.start();
      };

      document.addEventListener("click", (e) => {
        const node = e.target.closest("[data-lightbox]");
        if (node) {
          e.preventDefault();
          open(node);
        }
      });
      box.querySelector(".lightbox-close").addEventListener("click", close);
      box.querySelector(".lightbox-next").addEventListener("click", () => show(index + 1));
      box.querySelector(".lightbox-prev").addEventListener("click", () => show(index - 1));
      box.addEventListener("click", (e) => {
        if (e.target === box) close();
      });
      document.addEventListener("keydown", (e) => {
        if (!box.classList.contains("is-open")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowRight") show(index + 1);
        if (e.key === "ArrowLeft") show(index - 1);
      });
    },

    /* ---------------------------------------------------------- draggable row */
    draggableRow(scope) {
      if (!hasGsap || !global.Draggable) return;
      (scope || document).querySelectorAll("[data-drag-row]").forEach((row) => {
        const track = row.querySelector("[data-drag-track]");
        if (!track) return;
        const bounds = () => ({ minX: Math.min(0, row.offsetWidth - track.scrollWidth - 24), maxX: 0 });
        Draggable.create(track, {
          type: "x",
          inertia: false,
          edgeResistance: 0.9,
          bounds: bounds(),
          cursor: "grab",
          activeCursor: "grabbing",
          onDragStart: () => row.classList.add("is-dragging"),
          onDragEnd: () => row.classList.remove("is-dragging")
        });
        global.addEventListener("resize", () => {
          Draggable.get(track).applyBounds(bounds());
        });
      });
    },

    /* --------------------------------------------------------------- toolbox */
    copyEmail(selector, email) {
      document.querySelectorAll(selector).forEach((btn) =>
        btn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(email);
            const old = btn.textContent;
            btn.textContent = "Copied";
            setTimeout(() => (btn.textContent = old), 1800);
          } catch (err) {
            global.location.href = "mailto:" + email;
          }
        })
      );
    },

    preloader(selector) {
      const loader = document.querySelector(selector || "[data-preloader]");
      if (!loader) return Promise.resolve();
      if (!hasGsap || reduced) {
        loader.remove();
        return Promise.resolve();
      }
      const bar = loader.querySelector("[data-preloader-bar]");
      return new Promise((resolve) => {
        const tl = gsap.timeline({
          onComplete: () => {
            loader.remove();
            ScrollTrigger.refresh();
            resolve();
          }
        });
        if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power2.inOut" });
        tl.to(loader, { autoAlpha: 0, duration: 0.6, ease: "power2.out" }, "+=0.1");
      });
    },

    refreshOnLoad() {
      if (!hasGsap || !global.ScrollTrigger) return;
      global.addEventListener("load", () => ScrollTrigger.refresh());
      document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
    },

    /* Runs every primitive a page declared through data attributes. */
    autoInit(opts) {
      const o = opts || {};
      if (o.smooth !== false) M.smoothScroll(o.lenis);
      M.reveals();
      M.splitReveals();
      M.parallax();
      M.counters();
      M.marquee();
      M.horizontal();
      M.stack();
      M.scenes();
      M.highlight();
      M.magnetic();
      M.tilt();
      M.draggableRow();
      M.progress();
      M.lightbox();
      M.refreshOnLoad();
    }
  };

  global.MinkoMotion = M;
})(window);
