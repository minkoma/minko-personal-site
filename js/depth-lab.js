/* Depth gallery: a scroll-reactive 3D wall of photos.

   Built from the Codrops article by Houmahani Kane, "Building a Scroll-Reactive
   3D Gallery with Three.js, Velocity, and Mood-Based Backgrounds" (March 2026):
   https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/
   Its three ideas, kept intact here: depth (every photo on its own Z layer
   rather than a flat carousel), mood (every photo carries a palette that drives
   the background), motion (scroll SPEED is a reusable signal, separate from
   scroll position). The editorial colour chip is from the same article, which
   credits @thisislandscape for the idea.

   Differences from the article, all forced by this site rather than by taste:
   it uses Vite and a module per class; this is one file on a static page with
   three.js vendored locally, so the classes live here together. The palettes
   are not hand-authored per image either — tools/photo_moods.py reads them out
   of the photographs, because 23 hand-picked palettes would drift the moment a
   photo changed.

   Degrades on purpose: no WebGL, or prefers-reduced-motion, or ?static=1, and
   the page renders a plain scrollable grid of the same photos instead. */

import * as THREE from "../assets/vendor/three.module.min.js";

/* Two background registers. `light` is the default: near-white washed with a
   sweep through the site's own lilac/blush/sky family, which is what makes it
   look like the rest of the site rather than a separate dark demo. `?mood=dark`
   keeps the first version, where the field is a deep shade of the photograph.
   Both palettes are generated per photo by tools/photo_moods.py. */
const DARK_MODE = /(?:^|[?&])mood=dark(?:&|$)/.test(location.search);
const RAW = window.PHOTO_MOODS || [];
const MOODS = RAW.map((m) =>
  DARK_MODE ? m : Object.assign({}, m, m.light || {})
);
const D = window.MINKO;
const $ = (s, r = document) => r.querySelector(s);

/* Two hosts, one engine. On depth-lab.html the gallery owns the viewport and
   takes the wheel; inside the main page's "Bits of me" section it is pinned in
   a sticky box and driven by how far the page has scrolled THROUGH that
   section, so the page keeps its own scrolling and nothing is hijacked. */
const SECTION = document.querySelector("[data-depth-section]");
const EMBED = !!SECTION;

/* One of the ten picks, me-forky.jpg, belongs to a theme that was removed from
   the live board, so content.js no longer carries its words. Kept here rather
   than restored to content.js, because the board is deliberately six themes. */
const EXTRA = {
  forky: {
    title: "My kind of character",
    headline: "A soft spot for a very unusual toy.",
    story:
      "Forky is my favourite cartoon character. A little quirky and completely lovable — he always makes me smile."
  }
};

/* The bit a photo belongs to, by interest key. Used twice: for the title
   printed into the polaroid border, and for the text on the right. */
const bitFor = (key) => D.interests.find((b) => b.key === key) || EXTRA[key] || {};

/* ---------------------------------------------------------------- polaroid */
/* Each plane is a polaroid rather than a bare photograph: the photo is drawn
   into a white card with a wide bottom margin, and the bit's title is written
   in that margin in the site's handwriting. Done on a canvas and uploaded as
   one texture, because the alternative — a second quad for the frame plus DOM
   text tracked to a moving 3D plane — is three objects to keep in sync for the
   same pixels.

   Proportions are a real Polaroid 600 print: a thin even border with a bottom
   margin about four times as deep. */
const POLA = { pad: 0.045, bottom: 0.19, maxW: 1100 };

function polaroidCanvas(img, title) {
  const iw = Math.min(POLA.maxW, img.naturalWidth);
  const ih = Math.round(iw * (img.naturalHeight / img.naturalWidth));
  const pad = Math.round(iw * POLA.pad);
  const bottom = Math.round(iw * POLA.bottom);

  const c = document.createElement("canvas");
  c.width = iw + pad * 2;
  c.height = ih + pad + bottom;
  const g = c.getContext("2d");

  /* Not pure white: a print is warmer than the page, and #fff next to these
     photos reads as a hole rather than as paper. */
  g.fillStyle = "#fbf8f4";
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, pad, pad, iw, ih);

  if (title) {
    /* Caveat at the size the bottom margin allows, shrunk until it fits on one
       line. The font is already loaded by the caller; without that wait the
       canvas silently falls back to a serif. */
    g.fillStyle = "#3a3028";
    g.textAlign = "center";
    g.textBaseline = "middle";
    let size = Math.round(bottom * 0.52);
    do {
      g.font = `${size}px Caveat, cursive`;
      if (g.measureText(title).width <= iw * 0.92) break;
      size -= 2;
    } while (size > 12);
    g.fillText(title, c.width / 2, ih + pad + bottom * 0.52);
  }
  return c;
}

/* Tuning. Collected here because every one of these was arrived at by moving
   it and looking, and they are what someone would want to change next. */
/* These are the reference demo's own debug-panel values, copied across. The
   ones that are unit-free (blob radii and strength, noise, tilt, scale, the
   parallax amounts, velocity damping) transfer exactly. Two are tied to that
   demo's scroll scale rather than to anything absolute — Gap and Velocity Max —
   so they are applied and then checked by measurement; notes below each.

     Gallery      Gap 5.0 · Mood Offset 1.00
     Plane        Parallax X 0.16 · Parallax Y 0.08
     Gesture      Gesture Y 0.05
     Breath       Tilt 0.045 · Scale 0.030
     Background   Blob Radius 0.65 · Blob 2 Size 0.78 · Strength 0.90 · Noise 0.040
     Trail        Width 3.00 · Curves 1.85 · Opacity 0.51 · Particles on
     Scroll       Bounds on · Velocity Damping 0.12 · Velocity Max 1.5 */
const CFG = {
  planeGap: 5.0,
  planeHeight: 2.05,
  cameraStartZ: 4.2,
  /* Unchanged from the previous pass: the demo's panel exposes no scroll-speed
     control, and these are what made the pacing readable. */
  /* Sensitivity. 0.0016 was one notch of a trackpad flick per photo and read as
     sluggish; 0.0030 covers a plane per gesture. Smoothing is raised with it so
     the faster travel still arrives rather than snapping. */
  scrollSmoothing: 0.055,
  scrollToWorld: 0.0045,
  firstOffset: 4.6,
  lastOffset: 3.0,

  /* Mood Offset 1.00: the background takes its palette from one plane ahead of
     the one being looked at, so the colour arrives slightly before the photo
     does rather than lagging behind it. */
  moodOffset: 1.0,

  fadeInFar: 34.0,
  fadeInNear: 18.0,
  /* The fade-out window, in world units of distance in front of the camera. A
     plane holds full opacity until it is holdNear away and is gone by
     fadeOutEnd. Both were pulled in (4.3/1.7 before) so a photo stays solid
     until it is nearly past the camera instead of dissolving while it is still
     the thing being read. Both are on the D panel's Fade group. */
  holdNear: 2.6,
  fadeOutEnd: 0.75,

  velocityDamping: 0.12,
  /* Velocity Max 1.5 is the panel's figure and is kept as the clamp, but it is
     in that demo's scroll units, not world units. Here the per-frame world
     delta peaks around 0.06, so 1.5 never clips and, more importantly, dividing
     by it to drive the breath produced about 0.03 — the tilt and the pulse were
     mathematically present and invisible. velocityRef is the measured peak, and
     it is what the breath and the background lift are normalised against. */
  velocityMax: 1.5,
  velocityRef: 0.06,
  velocityStop: 0.0006,

  parallaxX: 0.16,
  parallaxY: 0.08,
  gestureY: 0.05,
  breathTilt: 0.045,
  breathScale: 0.03,

  blobRadius: 0.65,
  blob2Size: 0.78,
  blobStrength: 0.9,
  noise: 0.04,

  trail: {
    /* Off. The ribbon read as a pale cylinder hanging in the middle of the
       gallery, competing with the photo being looked at. The code and the panel
       switch stay, so it can be turned back on from the Trail group. */
    enabled: false,
    width: 3.0,
    curves: 1.85,
    opacity: 0.51,
    particles: true
  },

  /* The panel's four switches. Each is the reference's own default: textures
     on, scroll bounded, direction not inverted, and the two readouts off. */
  useTextures: true,
  useBounds: true,
  invertScroll: false,
  debugVelocity: false,
  showFps: false,

  /* Lane positions, world units either side of centre. Pulled in from the old
     ±1.55 spread: at the wide setting the near planes ran off the edge of a
     laptop screen and the one being read sat under the story text. These keep
     the stagger but hold every photo inside the frame. */
  lanes: [-0.95, 0.82, -0.44, 0.98, -0.8, 0.5, -0.25, 0.88],
  tilt: [0.04, -0.035, 0.025, -0.05, 0.015, -0.03]
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
/* 0 at edge0, 1 at edge1, eased at both ends. Used for the opacity ramps and
   for the background blend: a linear blend between two palettes changes fastest
   exactly where the eye is already busy, at the moment a photo passes. */
const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/* ---------------------------------------------------------------- fallback */
/* A plain grid of the same photos, used when the 3D scene must not or cannot
   run. It is the finished state, not a blank page: the site's rule is that any
   effect degrades to readable content. */
function renderFallback(reason) {
  const host = $("[data-depth]");
  host.classList.add("is-flat");
  host.innerHTML =
    `<p class="depth-fallback-note">${reason}</p><div class="depth-flat">` +
    MOODS.map(
      (m) =>
        `<figure style="--ar:${m.ar};--bg:${m.background}">
           <img src="${m.src}" alt="" loading="lazy">
         </figure>`
    ).join("") +
    "</div>";
}

/* ------------------------------------------------------------- background */
/* A full-screen quad in its own orthographic scene, drawn before the photos.
   scene.background cannot hold a shader, and a plane parented to the camera
   would be affected by the camera's own drift, so it gets its own pass. */
class Background {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.uniforms = {
      uBgColor: { value: new THREE.Color("#efe6d8") },
      uBlob1Color: { value: new THREE.Color("#d9c3a5") },
      uBlob2Color: { value: new THREE.Color("#b9a68c") },
      uTime: { value: 0 },
      uVelocity: { value: 0 },
      uAspect: { value: 1 },
      uBlobRadius: { value: CFG.blobRadius },
      /* "Blob 2 Size" is a multiplier on the first radius in the panel, not a
         second absolute radius. */
      uBlobRadius2: { value: CFG.blobRadius * CFG.blob2Size },
      uBlobStrength: { value: CFG.blobStrength },
      uNoiseStrength: { value: CFG.noise }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      /* Deliberately minimal, which the article argues for: one flat colour,
         two soft blobs, a lift on fast scroll, and film grain. Richer versions
         (top/mid/bottom bands, extra accents) were harder to reason about and
         did not read on screen. */
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform vec3 uBgColor, uBlob1Color, uBlob2Color;
        uniform float uTime, uVelocity, uAspect;
        uniform float uBlobRadius, uBlobRadius2, uBlobStrength, uNoiseStrength;

        float random(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          // correct for viewport shape so the blobs stay round
          vec2 uv = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);

          vec2 c1 = vec2(sin(uTime * 0.11) * 0.30 - 0.22, cos(uTime * 0.09) * 0.16 + 0.10);
          vec2 c2 = vec2(cos(uTime * 0.07) * 0.34 + 0.26, sin(uTime * 0.12) * 0.18 - 0.12);

          float b1 = smoothstep(uBlobRadius, 0.0, distance(uv, c1));
          float b2 = smoothstep(uBlobRadius2, 0.0, distance(uv, c2));

          vec3 color = uBgColor;
          // soften each blob toward the background so neither reads as a disc
          color = mix(color, mix(uBlob1Color, uBgColor, 0.35), b1 * uBlobStrength);
          color = mix(color, mix(uBlob2Color, uBgColor, 0.35), b2 * uBlobStrength);

          color += abs(uVelocity) * 0.10;

          float grain = random(vUv * vec2(1387.13, 947.91)) - 0.5;
          color += grain * uNoiseStrength;

          gl_FragColor = vec4(color, 1.0);
        }`,
      depthTest: false,
      depthWrite: false
    });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

    this.cur = { bg: new THREE.Color(), b1: new THREE.Color(), b2: new THREE.Color() };
    this.nxt = { bg: new THREE.Color(), b1: new THREE.Color(), b2: new THREE.Color() };
  }

  /* Blend between the palette of the photo behind us and the one ahead. The
     blend fraction is where the camera sits between the two, so the background
     never cuts. */
  setMood(i, blend) {
    const off = Math.round(CFG.moodOffset);
    const a = MOODS[clamp(i + off - 1, 0, MOODS.length - 1)];
    const b = MOODS[clamp(i + off, 0, MOODS.length - 1)];
    this.uniforms.uBgColor.value
      .copy(this.cur.bg.set(a.background))
      .lerp(this.nxt.bg.set(b.background), blend);
    this.uniforms.uBlob1Color.value
      .copy(this.cur.b1.set(a.blob1))
      .lerp(this.nxt.b1.set(b.blob1), blend);
    this.uniforms.uBlob2Color.value
      .copy(this.cur.b2.set(a.blob2))
      .lerp(this.nxt.b2.set(b.blob2), blend);
  }
}

/* ---------------------------------------------------------------- gallery */
class Gallery {
  constructor(scene) {
    this.items = MOODS.map((m, i) => {
      /* The card's shape is the polaroid's, not the photo's: the frame adds
         9% of the photo width across and a deep bottom margin. Computed here so
         the geometry is right on frame one and does not jump when the real
         texture arrives. */
      const outerAr = (1 + POLA.pad * 2) / (1 / m.ar + POLA.pad + POLA.bottom);
      const h = CFG.planeHeight;
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(h * outerAr, h, 1, 1),
        /* opacity 0 to start: every plane fades up from the dark as it comes
           into range, so none of them pops into existence. */
        new THREE.MeshBasicMaterial({
          color: "#fbf8f4",
          transparent: true,
          opacity: 0,
          depthWrite: false
        })
      );
      const x = CFG.lanes[i % CFG.lanes.length];
      const y = (i % 3 - 1) * 0.22;
      mesh.position.set(x, y, -i * CFG.planeGap);
      mesh.userData = { x, y, i, tilt: CFG.tilt[i % CFG.tilt.length], tex: null };
      scene.add(mesh);
      return mesh;
    });

    this.build();
  }

  /* Load each photograph, draw its polaroid, upload it. Deliberately after the
     font: document.fonts.ready settles once Caveat is usable, and a canvas
     drawn before that gets a serif fallback baked into the texture with no
     error anywhere. */
  async build() {
    try {
      await document.fonts.ready;
    } catch (e) {
      /* no font API: the title still draws, in whatever cursive exists */
    }
    MOODS.forEach((m, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const tex = new THREE.CanvasTexture(polaroidCanvas(img, bitFor(m.key).title));
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.anisotropy = 4;
        const mesh = this.items[i];
        mesh.userData.tex = tex;
        if (CFG.useTextures) {
          mesh.material.map = tex;
          mesh.material.color.set("#ffffff");
          mesh.material.needsUpdate = true;
        }
      };
      img.src = m.src;
    });
  }

  /* Textures off leaves the planes as flat cards in each photo's own mood
     colour, which is how the reference's "Use Textures" switch reads: it shows
     the composition and the depth ramp without the pictures. */
  setTextures(on) {
    this.items.forEach((m, i) => {
      /* userData.tex is null until that photo's polaroid has been drawn, so
         this has to cope with being flipped during loading. */
      m.material.map = on ? m.userData.tex : null;
      m.material.color.set(on && m.userData.tex ? "#ffffff" : MOODS[i].blob1 || "#8d7f9b");
      m.material.needsUpdate = true;
    });
  }

  /* Gap changes every plane's depth, so the scroll bounds have to be
     recomputed from the new range by the caller. */
  setGap() {
    this.items.forEach((m, i) => (m.position.z = -i * CFG.planeGap));
  }

  get depthRange() {
    return {
      nearestZ: 0,
      deepestZ: -(this.items.length - 1) * CFG.planeGap
    };
  }

  /* Three layers of micro-motion, each from a different signal: where the
     pointer is (parallax), which way the scroll is going (drift), and how fast
     it is going (breath). */
  update(pointer, drift, vel, cameraZ) {
    const n = this.items.length;
    /* Which plane is the one actually being looked at. It is NOT floor(scroll
       position): by the time the camera reaches a plane's own depth that plane
       has already faded out, so the photograph being read is one or two ahead.
       Taking the most opaque plane makes the label agree with the picture
       whatever the fade distances are set to. */
    let best = -1;
    let bestOpacity = -1;
    this.items.forEach((m) => {
      const { x, y, i, tilt } = m.userData;

      /* Distance in front of the camera. Negative means it is behind us. */
      const dist = cameraZ - m.position.z;
      const fadeIn = smoothstep(CFG.fadeInFar, CFG.fadeInNear, dist);
      const fadeOut = smoothstep(CFG.fadeOutEnd, CFG.holdNear, dist);
      m.material.opacity = Math.min(fadeIn, fadeOut);
      if (m.material.opacity > bestOpacity) {
        bestOpacity = m.material.opacity;
        best = i;
      }
      /* Skip the draw entirely once it is invisible. With 23 planes this is
         most of them at any moment. */
      m.visible = m.material.opacity > 0.004;
      if (!m.visible) return;

      const depthFactor = 0.35 + (i / n) * 0.65;
      m.position.x = x + pointer.x * CFG.parallaxX * depthFactor;
      m.position.y =
        y + pointer.y * CFG.parallaxY * depthFactor + drift * CFG.gestureY;
      m.rotation.z = tilt + pointer.x * 0.02;
      m.rotation.x = pointer.y * CFG.breathTilt * vel;
      m.rotation.y = -pointer.x * CFG.breathTilt * 0.6 * vel;
      m.scale.setScalar(1 + CFG.breathScale * vel);
    });
    this.frontIndex = best;
  }
}


/* ------------------------------------------------------------------ trail */
/* The wind-through-the-gallery ribbon from the article, with the panel's own
   numbers: Width 3.00, Curves 1.85, Opacity 0.51, Particles on.

   Three parts, as the article describes them. A path driven by scroll progress,
   oscillating left/right and up/down and always sitting a fixed distance ahead
   of the camera. A centripetal Catmull-Rom spline through those points, which
   is the curve type that survives sharp turns without looping. And a tube
   rebuilt every frame, fat at the head and tapering toward the tail.

   TubeGeometry takes one radius for the whole length, so it cannot taper; the
   tube here is a hand-built ring-per-sample geometry whose vertex buffer is
   allocated once and only rewritten each frame. Rebuilding the geometry object
   itself at 60fps would churn GPU buffers for no reason. */
const TRAIL_SAMPLES = 72;   // points along the curve
const TRAIL_SIDES = 8;      // vertices per ring
const TRAIL_AHEAD = 7.5;    // how far in front of the camera the head sits
const TRAIL_LENGTH = 34;    // world depth from head to tail
const TRAIL_V_CYCLES = 1.1;
const TRAIL_SWING = 1.5;    // how far the path wanders sideways, world units
/* "Width 3.00" is the tube's thickness, not the path's amplitude: it sits next
   to "Curves" in the panel, which is the control for the wandering. At 3.00
   this gives a head radius of 0.12, which reads as a ribbon rather than the
   thread the first attempt drew. */
const TRAIL_R_HEAD = () => 0.04 * CFG.trail.width;
const TRAIL_R_TAIL = 0.004;

class Trail {
  constructor(scene) {
    this.pts = [];
    for (let i = 0; i < TRAIL_SAMPLES; i++) this.pts.push(new THREE.Vector3());

    const verts = TRAIL_SAMPLES * TRAIL_SIDES;
    this.pos = new Float32Array(verts * 3);
    this.alpha = new Float32Array(verts);

    const idx = [];
    for (let i = 0; i < TRAIL_SAMPLES - 1; i++) {
      for (let j = 0; j < TRAIL_SIDES; j++) {
        const a = i * TRAIL_SIDES + j;
        const b = i * TRAIL_SIDES + ((j + 1) % TRAIL_SIDES);
        const c = a + TRAIL_SIDES;
        const d = b + TRAIL_SIDES;
        idx.push(a, c, b, b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1));
    geo.setIndex(idx);
    this.geo = geo;

    /* Per-vertex alpha so the tail dissolves instead of ending. A plain
       material cannot do that, hence the two-line shader. */
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color("#ffffff") },
        uOpacity: { value: CFG.trail.opacity }
      },
      vertexShader: `
        attribute float aAlpha;
        varying float vA;
        void main() {
          vA = aAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vA;
        void main() { gl_FragColor = vec4(uColor, vA * uOpacity); }`,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    if (CFG.trail.particles) {
      const n = 34;
      this.pPos = new Float32Array(n * 3);
      this.pSeed = new Float32Array(n);
      for (let i = 0; i < n; i++) this.pSeed[i] = Math.random();
      const pg = new THREE.BufferGeometry();
      pg.setAttribute("position", new THREE.BufferAttribute(this.pPos, 3));
      this.points = new THREE.Points(
        pg,
        new THREE.PointsMaterial({
          size: 0.045,
          color: "#ffffff",
          transparent: true,
          opacity: CFG.trail.opacity * 0.9,
          depthWrite: false,
          sizeAttenuation: true
        })
      );
      this.points.frustumCulled = false;
      scene.add(this.points);
    }
  }

  setColor(hex) {
    this.mat.uniforms.uColor.value.set(hex);
    if (this.points) this.points.material.color.set(hex);
    this.color = hex;
  }

  /* Width and Particles change the geometry, so the panel rebuilds the whole
     ribbon rather than trying to resize it in place; this frees the GPU
     buffers first. */
  destroy(scene) {
    scene.remove(this.mesh);
    this.geo.dispose();
    this.mat.dispose();
    if (this.points) {
      scene.remove(this.points);
      this.points.geometry.dispose();
      this.points.material.dispose();
    }
  }

  update(cameraZ, progress, time) {
    const head = cameraZ - TRAIL_AHEAD;
    for (let i = 0; i < TRAIL_SAMPLES; i++) {
      const t = i / (TRAIL_SAMPLES - 1);           // 0 head, 1 tail
      const z = head - t * TRAIL_LENGTH;
      /* phase advances with scroll so the ribbon appears to stream past
         rather than sit still in front of the camera */
      const ph = (progress + t) * Math.PI * 2 * CFG.trail.curves;
      this.pts[i].set(
        Math.sin(ph) * TRAIL_SWING,
        Math.sin(ph * TRAIL_V_CYCLES + time * 0.25) * 0.55,
        z
      );
    }

    const curve = new THREE.CatmullRomCurve3(this.pts, false, "centripetal");
    const samples = curve.getSpacedPoints(TRAIL_SAMPLES - 1);

    const up = new THREE.Vector3(0, 1, 0);
    const tan = new THREE.Vector3();
    const nrm = new THREE.Vector3();
    const bin = new THREE.Vector3();

    for (let i = 0; i < TRAIL_SAMPLES; i++) {
      const t = i / (TRAIL_SAMPLES - 1);
      const p = samples[i];
      const q = samples[Math.min(i + 1, TRAIL_SAMPLES - 1)];
      tan.subVectors(q, p);
      if (tan.lengthSq() < 1e-8) tan.set(0, 0, -1);
      tan.normalize();
      nrm.crossVectors(up, tan).normalize();
      if (!isFinite(nrm.x)) nrm.set(1, 0, 0);
      bin.crossVectors(tan, nrm).normalize();

      // power curve rather than linear: a linear taper reads as a cone
      const rHead = TRAIL_R_HEAD();
      const r = rHead + (TRAIL_R_TAIL - rHead) * Math.pow(t, 1.5);
      const a = (1 - t) * (1 - t);

      for (let j = 0; j < TRAIL_SIDES; j++) {
        const ang = (j / TRAIL_SIDES) * Math.PI * 2;
        const k = (i * TRAIL_SIDES + j) * 3;
        this.pos[k] = p.x + (nrm.x * Math.cos(ang) + bin.x * Math.sin(ang)) * r;
        this.pos[k + 1] = p.y + (nrm.y * Math.cos(ang) + bin.y * Math.sin(ang)) * r;
        this.pos[k + 2] = p.z + (nrm.z * Math.cos(ang) + bin.z * Math.sin(ang)) * r;
        this.alpha[i * TRAIL_SIDES + j] = a;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;

    if (this.points) {
      const h = samples[0];
      for (let i = 0; i < this.pSeed.length; i++) {
        const sd = this.pSeed[i];
        const sp = time * (0.4 + sd) + sd * 100;
        this.pPos[i * 3] = h.x + Math.sin(sp) * 0.3 * (0.4 + sd);
        this.pPos[i * 3 + 1] = h.y + Math.cos(sp * 1.3) * 0.26 * (0.4 + sd);
        this.pPos[i * 3 + 2] = h.z + Math.sin(sp * 0.7) * 0.5;
      }
      this.points.geometry.attributes.position.needsUpdate = true;
    }
  }
}

/* ----------------------------------------------------------------- scroll */
/* Position and speed are different things and are kept apart: raw wheel input
   is messy, so it accumulates into a target, the current value chases it, and
   velocity is the per-frame difference of the SMOOTHED value. */
class Scroll {
  constructor(range) {
    this.target = 0;
    this.current = 0;
    this.prev = 0;
    this.velocity = 0;
    this.drift = 0;
    this.driftTarget = 0;
    this.min = this.fromZ(range.nearestZ + CFG.firstOffset);
    this.max = this.fromZ(range.deepestZ + CFG.lastOffset);
    /* Start AT the near bound rather than at 0, or the first clamp snaps the
       camera forward on frame one and the page opens with a jolt. */
    this.target = this.current = this.prev = this.min;

    if (EMBED) {
      /* The section is made tall enough that one screen of page scroll moves
         the camera about one plane; see bitsDepthHeight(). */
      SECTION.style.height = Math.max(3, MOODS.length) * 72 + "vh";
      addEventListener("scroll", () => this.fromSection(), { passive: true });
      addEventListener("resize", () => this.fromSection());
      this.fromSection();
      return;
    }

    addEventListener("wheel", (e) => this.push(e.deltaY), { passive: true });
    let touchY = 0;
    addEventListener("touchstart", (e) => (touchY = e.touches[0].clientY), { passive: true });
    addEventListener(
      "touchmove",
      (e) => {
        const y = e.touches[0].clientY;
        this.push((touchY - y) * 2.4);
        touchY = y;
      },
      { passive: true }
    );
    addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") this.push(260);
      if (e.key === "ArrowUp" || e.key === "PageUp") this.push(-260);
    });
  }

  /* Embedded: position comes from the page, not from gestures. Progress is how
     far the section has travelled past the top of the viewport, which is
     exactly the range over which the sticky child is pinned. */
  fromSection() {
    const r = SECTION.getBoundingClientRect();
    const travel = Math.max(1, r.height - innerHeight);
    const p = clamp(-r.top / travel, 0, 1);
    this.target = this.min + (this.max - this.min) * p;
    /* Drift is the gesture signal the planes lean with; with no wheel event to
       read, take it from the direction the page is moving. */
    this.driftTarget = clamp((this.target - this.current) * 6, -1, 1);

    /* Pinning is done here rather than with position:sticky, because sticky is
       dead inside this page: both body and .beyond are overflow:hidden (the
       ribbon and the doodles bleed out of them), and an overflow ancestor makes
       the nearest scrollport a box that never scrolls, so the stage just sits
       at the top of the section. These two classes reproduce it. */
    SECTION.classList.toggle("is-pinned", r.top <= 0 && r.bottom >= innerHeight);
    SECTION.classList.toggle("is-past", r.bottom < innerHeight);
  }

  fromZ(z) {
    /* Inverse of the camera equation: camera.position.z = cameraStartZ - scroll */
    return CFG.cameraStartZ - z;
  }

  push(delta) {
    this.target += delta * CFG.scrollToWorld * (CFG.invertScroll ? -1 : 1);
    this.driftTarget = clamp(delta / 220, -1, 1);
  }

  /* Called when Gap changes: the near and far stops are derived from the
     gallery's depth, so they move with it. */
  setRange(range) {
    this.min = this.fromZ(range.nearestZ + CFG.firstOffset);
    this.max = this.fromZ(range.deepestZ + CFG.lastOffset);
  }

  update() {
    /* Clamp BOTH values. Clamping only the target lets the smoothing overshoot
       and the camera drifts briefly past the last photo. Bounds off is the
       panel's "Use Bounds" switch: the camera is then free to run past either
       end, which is how you see where the planes actually stop. */
    if (CFG.useBounds) {
      this.target = clamp(this.target, this.min, this.max);
      this.current = clamp(lerp(this.current, this.target, CFG.scrollSmoothing), this.min, this.max);
    } else {
      this.current = lerp(this.current, this.target, CFG.scrollSmoothing);
    }

    const raw = this.current - this.prev;
    this.prev = this.current;
    this.velocity = clamp(
      lerp(this.velocity, raw, CFG.velocityDamping),
      -CFG.velocityMax,
      CFG.velocityMax
    );
    if (Math.abs(this.velocity) < CFG.velocityStop) this.velocity = 0;

    this.driftTarget *= 0.88;
    this.drift = lerp(this.drift, this.driftTarget, 0.08);
    return this.current;
  }
}

/* ------------------------------------------------------------------ engine */
class Engine {
  constructor(host) {
    this.host = host;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.z = CFG.cameraStartZ;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.autoClear = false;
    host.appendChild(this.renderer.domElement);

    this.bg = new Background();
    this.gallery = new Gallery(this.scene);
    if (!CFG.useTextures) this.gallery.setTextures(false);
    this.scroll = new Scroll(this.gallery.depthRange);
    this.trail = CFG.trail.enabled ? new Trail(this.scene) : null;
    this.accent = "#ffffff";

    this.pointer = { x: 0, y: 0 };
    this.pointerTarget = { x: 0, y: 0 };
    addEventListener("pointermove", (e) => {
      const r = this.host.getBoundingClientRect();
      this.pointerTarget.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      this.pointerTarget.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    });

    /* Clicking a polaroid fires that bit's easter egg. The eggs live in
       main.js, bound to the hidden [data-egg] cards, so this forwards a click
       to the card rather than duplicating any of that logic. */
    this.ray = new THREE.Raycaster();
    host.addEventListener("click", (e) => this.pick(e));

    this.label = {
      line: $("[data-line]"),
      story: $("[data-story]"),
      index: $("[data-index]"),
      total: $("[data-total]")
    };
    this.label.total.textContent = String(MOODS.length);
    this.shown = -1;
    this.bar = $("[data-vel]");

    this.resize();
    addEventListener("resize", () => this.resize());
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  resize() {
    /* Embedded, the stage is a sticky box inside a section, so its own box is
       the size to render at; standalone it is the window. */
    const w = EMBED ? this.host.clientWidth : innerWidth;
    const h = EMBED ? this.host.clientHeight : innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.bg.uniforms.uAspect.value = w / h;
  }

  /* --------------------------------------------------- panel apply hooks */
  /* Everything the debug panel can change falls into one of three kinds: a
     uniform write, a reposition, or a rebuild. These are the second and third;
     the uniform writes the panel does itself. */
  applyGap() {
    this.gallery.setGap();
    this.scroll.setRange(this.gallery.depthRange);
  }

  applyBackground() {
    const u = this.bg.uniforms;
    u.uBlobRadius.value = CFG.blobRadius;
    u.uBlobRadius2.value = CFG.blobRadius * CFG.blob2Size;
    u.uBlobStrength.value = CFG.blobStrength;
    u.uNoiseStrength.value = CFG.noise;
  }

  rebuildTrail() {
    if (this.trail) {
      this.trail.destroy(this.scene);
      this.trail = null;
    }
    if (CFG.trail.enabled) {
      this.trail = new Trail(this.scene);
      this.trail.setColor(this.accent);
    }
  }

  /* Which polaroid is under the cursor, if any. Only visible planes are
     tested: the invisible ones are still in the scene and would otherwise
     catch clicks aimed at nothing. */
  pick(e) {
    const r = this.host.getBoundingClientRect();
    this.ray.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -(((e.clientY - r.top) / r.height) * 2 - 1)
      ),
      this.camera
    );
    const hit = this.ray.intersectObjects(this.gallery.items.filter((m) => m.visible))[0];
    if (!hit) return;
    const key = MOODS[hit.object.userData.i].key;
    if (window.bitsPlayEgg) {
      window.bitsPlayEgg(key, e.clientX, e.clientY);
      return;
    }
    const card = document.querySelector(`[data-egg="${key}"]`);
    if (card) card.click();
  }

  frame() {
    const z = this.scroll.update();
    this.camera.position.z = CFG.cameraStartZ - z;

    this.pointer.x = lerp(this.pointer.x, this.pointerTarget.x, 0.06);
    this.pointer.y = lerp(this.pointer.y, this.pointerTarget.y, 0.06);

    const vel = Math.min(1, Math.abs(this.scroll.velocity) / CFG.velocityRef);
    this.gallery.update(this.pointer, this.scroll.drift, vel, this.camera.position.z);

    /* Which photo are we in front of, and how far between it and the next?
       One value drives the background, the label and the counter, which is what
       keeps them from disagreeing. */
    const pos = (CFG.cameraStartZ - this.camera.position.z) / CFG.planeGap;
    const slot = Math.max(0, Math.floor(pos));
    this.bg.setMood(slot, smoothstep(0, 1, pos - slot));
    const i = this.gallery.frontIndex >= 0 ? this.gallery.frontIndex : slot;
    const now = this.clock.getElapsedTime();
    this.bg.uniforms.uTime.value = now;
    this.bg.uniforms.uVelocity.value = vel;

    if (this.trail) {
      const span = Math.max(1, this.scroll.max - this.scroll.min);
      this.trail.update(
        this.camera.position.z,
        (this.scroll.current - this.scroll.min) / span,
        now
      );
    }

    if (i !== this.shown) {
      this.shown = i;
      const m = MOODS[clamp(i, 0, MOODS.length - 1)];
      /* The title is printed in the polaroid's own border now, so the text on
         the right is the headline and the story only. */
      const bit = bitFor(m.key);
      this.label.line.textContent = bit.headline || "";
      this.label.story.textContent = bit.story || "";
      this.label.index.textContent = String(i + 1).padStart(2, "0");

      if (this.trail) this.trail.setColor(m.accent || m.blob1);
      this.accent = m.accent || m.blob1 || "#ffffff";
    }
    if (this.bar) this.bar.style.setProperty("--v", vel.toFixed(3));
    if (this.debug) this.debug.tick(this.scroll.velocity, now);

    this.renderer.clear();
    this.renderer.render(this.bg.scene, this.bg.camera);
    this.renderer.render(this.scene, this.camera);
  }
}

/* ------------------------------------------------------------------- debug */
/* The reference demo's own panel, same groups and same controls, opened with
   D. It is built from this spec rather than from lil-gui: eighteen controls do
   not justify a dependency, and the three apply kinds (uniform write,
   reposition, rebuild) are explicit this way.

   `get`/`set` keep each row pointed at the live CFG value, so a row never
   holds its own copy that can drift from the thing being rendered. */
const DEBUG_SPEC = (eng) => {
  const bg = () => eng.applyBackground();
  const trail = () => eng.rebuildTrail();
  return [
    ["Gallery", [
      { k: "Gap", min: 1, max: 12, step: 0.1,
        get: () => CFG.planeGap, set: (v) => { CFG.planeGap = v; eng.applyGap(); } },
      { k: "Use Textures", bool: true,
        get: () => CFG.useTextures,
        set: (v) => { CFG.useTextures = v; eng.gallery.setTextures(v); } },
      { k: "Mood Offset", min: 0, max: 4, step: 1,
        get: () => CFG.moodOffset, set: (v) => (CFG.moodOffset = v) }
    ]],
    ["Plane Parallax", [
      { k: "Parallax X", min: 0, max: 1, step: 0.01,
        get: () => CFG.parallaxX, set: (v) => (CFG.parallaxX = v) },
      { k: "Parallax Y", min: 0, max: 1, step: 0.01,
        get: () => CFG.parallaxY, set: (v) => (CFG.parallaxY = v) }
    ]],
    ["Gesture Parallax", [
      { k: "Gesture Y", min: 0, max: 0.5, step: 0.01,
        get: () => CFG.gestureY, set: (v) => (CFG.gestureY = v) }
    ]],
    ["Plane Breath", [
      { k: "Breath Tilt", min: 0, max: 0.3, step: 0.005,
        get: () => CFG.breathTilt, set: (v) => (CFG.breathTilt = v) },
      { k: "Breath Scale", min: 0, max: 0.2, step: 0.005,
        get: () => CFG.breathScale, set: (v) => (CFG.breathScale = v) }
    ]],
    ["Background", [
      { k: "Blob Radius", min: 0.1, max: 1.5, step: 0.01,
        get: () => CFG.blobRadius, set: (v) => { CFG.blobRadius = v; bg(); } },
      { k: "Blob 2 Size", min: 0.1, max: 2, step: 0.01,
        get: () => CFG.blob2Size, set: (v) => { CFG.blob2Size = v; bg(); } },
      { k: "Blob Strength", min: 0, max: 2, step: 0.01,
        get: () => CFG.blobStrength, set: (v) => { CFG.blobStrength = v; bg(); } },
      { k: "Noise", min: 0, max: 0.2, step: 0.005,
        get: () => CFG.noise, set: (v) => { CFG.noise = v; bg(); } }
    ]],
    ["Trail", [
      { k: "Enabled", bool: true,
        get: () => CFG.trail.enabled, set: (v) => { CFG.trail.enabled = v; trail(); } },
      { k: "Width", min: 0.5, max: 8, step: 0.05,
        get: () => CFG.trail.width, set: (v) => (CFG.trail.width = v) },
      { k: "Curves", min: 0.2, max: 5, step: 0.05,
        get: () => CFG.trail.curves, set: (v) => (CFG.trail.curves = v) },
      { k: "Opacity", min: 0, max: 1, step: 0.01,
        get: () => CFG.trail.opacity,
        set: (v) => {
          CFG.trail.opacity = v;
          if (eng.trail) {
            eng.trail.mat.uniforms.uOpacity.value = v;
            if (eng.trail.points) eng.trail.points.material.opacity = v * 0.9;
          }
        } },
      { k: "Particles", bool: true,
        get: () => CFG.trail.particles, set: (v) => { CFG.trail.particles = v; trail(); } }
    ]],
    ["Fade", [
      { k: "Hold Near", min: 0.5, max: 8, step: 0.1,
        get: () => CFG.holdNear, set: (v) => (CFG.holdNear = v) },
      { k: "Fade Out End", min: 0.1, max: 4, step: 0.05,
        get: () => CFG.fadeOutEnd, set: (v) => (CFG.fadeOutEnd = v) },
      { k: "Fade In Near", min: 4, max: 30, step: 0.5,
        get: () => CFG.fadeInNear, set: (v) => (CFG.fadeInNear = v) },
      { k: "Fade In Far", min: 10, max: 60, step: 1,
        get: () => CFG.fadeInFar, set: (v) => (CFG.fadeInFar = v) }
    ]],
    ["Scroll", [
      { k: "Scroll Speed", min: 0.0005, max: 0.012, step: 0.0005,
        get: () => CFG.scrollToWorld, set: (v) => (CFG.scrollToWorld = v) },
      { k: "Smoothing", min: 0.01, max: 0.2, step: 0.005,
        get: () => CFG.scrollSmoothing, set: (v) => (CFG.scrollSmoothing = v) },
      { k: "Use Bounds", bool: true,
        get: () => CFG.useBounds, set: (v) => (CFG.useBounds = v) },
      { k: "Invert Scroll", bool: true,
        get: () => CFG.invertScroll, set: (v) => (CFG.invertScroll = v) },
      { k: "Debug Velocity", bool: true,
        get: () => CFG.debugVelocity, set: (v) => (CFG.debugVelocity = v) },
      { k: "Velocity Damping", min: 0.01, max: 1, step: 0.01,
        get: () => CFG.velocityDamping, set: (v) => (CFG.velocityDamping = v) },
      { k: "Velocity Max", min: 0.1, max: 4, step: 0.1,
        get: () => CFG.velocityMax, set: (v) => (CFG.velocityMax = v) }
    ]],
    ["Engine", [
      { k: "Show FPS", bool: true,
        get: () => CFG.showFps, set: (v) => (CFG.showFps = v) }
    ]]
  ];
};

/* Decimals to show for a row: enough to see the step move. Scroll Speed steps
   by 0.0005, which three decimals cannot render. */
const dbgFmt = (v, step) => Number(v).toFixed(step < 0.001 ? 4 : step < 0.01 ? 3 : 2);

class Debug {
  constructor(eng) {
    this.eng = eng;
    this.open = false;
    this.frames = 0;
    this.since = 0;
    /* Numbered before the markup is built: row() consumes this counter. */
    this.i = 0;

    const el = document.createElement("aside");
    el.className = "dbg";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      `<p class="dbg-head">Debug<button class="dbg-x" type="button" aria-label="close">×</button></p>` +
      DEBUG_SPEC(eng)
        .map(
          ([group, rows]) =>
            `<section><h4>${group}</h4>${rows
              .map((r, j) => this.row(group, r, j))
              .join("")}</section>`
        )
        .join("") +
      `<p class="dbg-read"><span>fps</span><b data-dbg-fps>—</b></p>` +
      `<p class="dbg-read"><span>velocity</span><b data-dbg-vel>0.0000</b></p>`;
    document.body.appendChild(el);
    this.el = el;
    this.fpsOut = el.querySelector("[data-dbg-fps]");
    this.velOut = el.querySelector("[data-dbg-vel]");

    /* One listener on the panel rather than one per control: the row index
       into the flat spec is carried on the input. */
    this.rows = DEBUG_SPEC(eng).flatMap(([, rows]) => rows);
    el.addEventListener("input", (e) => {
      const i = e.target.dataset.i;
      if (i === undefined) return;
      const r = this.rows[i];
      const v = r.bool ? e.target.checked : parseFloat(e.target.value);
      r.set(v);
      const out = e.target.parentElement.querySelector(".dbg-val");
      if (out) out.textContent = dbgFmt(v, r.step);
    });
    el.querySelector(".dbg-x").addEventListener("click", () => this.toggle(false));

    addEventListener("keydown", (e) => {
      if (e.key === "d" || e.key === "D") this.toggle(!this.open);
      if (e.key === "Escape" && this.open) this.toggle(false);
    });

    /* The on-screen hint is gone, so there is nothing to retitle here. */
  }

  /* `this.i` numbers the rows in the same order as the flat `rows` array the
     input handler reads, which is why the markup is generated in one pass. */
  row(group, r) {
    const i = this.i++;
    if (r.bool) {
      return `<label class="dbg-row dbg-bool">
        <input type="checkbox" data-i="${i}"${r.get() ? " checked" : ""}>
        <span>${r.k}</span></label>`;
    }
    const v = r.get();
    return `<label class="dbg-row">
      <span>${r.k}</span>
      <input type="range" data-i="${i}" min="${r.min}" max="${r.max}" step="${r.step}" value="${v}">
      <b class="dbg-val">${dbgFmt(v, r.step)}</b></label>`;
  }

  toggle(on) {
    this.open = on;
    this.el.classList.toggle("is-open", on);
    this.el.setAttribute("aria-hidden", String(!on));
  }

  tick(velocity, now) {
    this.frames++;
    if (now - this.since >= 0.5) {
      if (CFG.showFps) this.fpsOut.textContent = Math.round(this.frames / (now - this.since));
      this.frames = 0;
      this.since = now;
    }
    if (CFG.debugVelocity) this.velOut.textContent = velocity.toFixed(4);
    this.el.classList.toggle("show-fps", CFG.showFps);
    this.el.classList.toggle("show-vel", CFG.debugVelocity);
  }
}

/* -------------------------------------------------------------------- boot */
(() => {
  const host = $("[data-depth]");
  if (!host || !MOODS.length) return;

  const staticMode = /(?:^|[?&])static=1(?:&|$)/.test(location.search);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add(DARK_MODE ? "mood-dark" : "mood-light");
  if (staticMode || reduced) {
    renderFallback(
      reduced
        ? "Reduced motion is on, so the 3D scene is replaced by the same photos as a plain grid."
        : "Static mode (?static=1): the 3D scene is replaced by the same photos as a plain grid."
    );
    return;
  }

  let gl = null;
  try {
    gl = document.createElement("canvas").getContext("webgl2") ||
         document.createElement("canvas").getContext("webgl");
  } catch (e) {
    gl = null;
  }
  if (!gl) {
    renderFallback("This browser reports no WebGL, so here are the same photos as a plain grid.");
    return;
  }

  try {
    const eng = new Engine(host);
    eng.debug = new Debug(eng);
    document.documentElement.classList.add("depth-live");
    document.documentElement.classList.add(DARK_MODE ? "mood-dark" : "mood-light");
  } catch (err) {
    console.error(err);
    renderFallback("The 3D scene failed to start (" + err.message + ").");
  }
})();
