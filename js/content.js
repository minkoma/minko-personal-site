/* Single source of truth for every layout. Edit here, all three versions update.
   Résumé content is authoritative; the three index files only present it. */
window.MINKO = {
  profile: {
    name: "Minko Ma",
    legalName: "Yitian (Minko) Ma",
    tagline: "Marketer, storyteller, endlessly curious.",
    lede: "I turn human insight and data into brand stories that connect.",
    bio: "A marketer, storyteller, and endlessly curious thinker. Blending data, strategy, creativity, and a little heart to help brands connect with people in ways that matter.",
    location: "Evanston, IL · San Diego, CA",
    email: "hello.minkoma@gmail.com",
    linkedin: "https://www.linkedin.com/in/minkoma",
    resume: "resume.html",
    languages: "Bilingual in Mandarin and English"
  },

  /* The ending section: a live clock in Minko's own timezone plus what she is
     open to. Everything here is hers to edit.

     `zone` and `place` must agree — the clock is California time because that
     is where she is, not where she studies.

     `asleep` is a plain hour window in `zone`, 24-hour, start inclusive and
     end exclusive — so [2, 10] means the status reads "asleep" from 2:00am
     until 9:59am and "awake" the rest of the day. Change the two numbers and
     the status row follows; nothing else needs touching.

     `openTo` is split on purpose: `commitment` is the shape of the work and
     `fields` are the kinds of work. They are two different questions, and the
     panel styles them differently rather than colouring them at random. */
  now: {
    zone: "America/Los_Angeles",
    place: "San Diego, CA",
    /* Rendered after `place` in the "where" row, separated by a dot. */
    relocate: "Happy to relocate for the right opportunity",
    asleep: [2, 10],
    /* An optional third state for the small hours: still up, but not someone
       you should expect a reply from. Set to null to switch it off. */
    winding: [23, 2],
    awakeLine: "probably awake — expect a quick reply",
    windingLine: "still up, but winding down",
    asleepLine: "asleep right now — I'll reply in the morning",
    openTo: {
      commitment: "Full-time",
      lead: "roles in",
      fields: ["Digital Marketing", "Content & Social", "Data Analytics", "Brand Strategy", "Consumer Insights"]
    }
  },

  /* Hero layer geometry. Boxes stay in 1920x1080 units whatever resolution the
     images actually carry, because they are only ever turned into percentages
     and main.js positions the hotspots in the same space. Measured from the
     6000x3375 artwork by tools/prep_hero.py, which prints these values.

     The name is real vector, built by tools/build_name.py from the Canva SVG
     export's seven glyph outlines. That export has the text straight, because
     Canva bakes its curve effect into a raster layer rather than the paths, so
     build_name.py reapplies the arch; --rise is the one knob. Re-run it with
     --letters after any change and paste the geometry it prints. */
  hero: {
    frame: [1920, 1080],
    scene: "assets/hero/scene.webp",
    sceneFallback: "assets/hero/scene.jpg",
    scenePlaceholder: "assets/hero/scene-small.jpg",
    name: "assets/hero/name.svg",
    subject: "assets/hero/subject.webp",
    subjectFallback: "assets/hero/subject.png",
    nameBox: [287.2, 145.4, 1640.4, 376.6],
    subjectBox: [758.1, 43.2, 1254.1, 1056.6],
    splitLetters: true,
    letters: [
      { src: "assets/hero/name-01.svg", box: [287.2, 188.9, 517.9, 371.3] },
      { src: "assets/hero/name-02.svg", box: [516.3, 170.8, 612.2, 329.9] },
      { src: "assets/hero/name-03.svg", box: [625.8, 146.6, 781.2, 315.8] },
      { src: "assets/hero/name-04.svg", box: [814.0, 145.9, 986.3, 300.4] },
      { src: "assets/hero/name-05.svg", box: [1002.6, 145.4, 1151.9, 304.5] },
      { src: "assets/hero/name-06.svg", box: [1241.7, 157.3, 1458.0, 332.8] },
      { src: "assets/hero/name-07.svg", box: [1460.2, 205.5, 1640.4, 376.6] }
    ]
  },

  stats: [
    { value: 3.98, suffix: "/4.0", label: "Graduate GPA", decimals: 2 },
    { value: 1.39, suffix: "M", label: "Loyalty members analysed", decimals: 2 },
    { value: 150, suffix: "K+", label: "Views & impressions earned" },
    { value: 15, suffix: "+", label: "Countries visited" }
  ],

  education: [
    {
      school: "Northwestern University",
      place: "Evanston, IL",
      degree: "M.S. Integrated Marketing Communications",
      period: "Sep 2025 – Dec 2026 (expected)",
      detail: "Current GPA 3.98 / 4.0",
      /* Coursework is grouped where there is enough of it to group; a group
         with no `group` label renders as one unlabelled run of chips. */
      coursework: [
        {
          group: "Core marketing & IMC",
          items: ["Consumer Insight", "Marketing Research", "Marketing Strategy", "Financial Accounting",
                  "IMC Strategic Process", "Marketing Technology", "Marketing Metrics"]
        },
        {
          group: "Brand strategy",
          items: ["Brand Management Foundations", "Digital Marketing Activation", "Shopper Marketing",
                  "Consumer Psychology & Brand Narrative", "Customer Value Innovation"]
        },
        {
          group: "Data & analytics",
          items: ["Data Science Foundations", "Data Management and Visualization", "Data Storytelling"]
        },
        {
          group: "Media strategy",
          items: ["Media Foundations", "Media Marketplaces"]
        }
      ],
      involvement: ["Cause Marketing Initiatives (CMI) — Marketing Consultant, Big Brothers Big Sisters (BBBS)"],
      photos: [
        "assets/experience/nu-graduation-1.jpg",
        "assets/experience/nu-graduation-2.jpg",
        "assets/experience/nu-graduation-3.jpg"
      ],
      photo: "assets/experience/northwestern.jpg",
      photoScale: 0.93,
      year: "2025–2026"
    },
    {
      school: "University of California, San Diego",
      place: "La Jolla, CA",
      /* An array renders one line per item, which keeps the two UCSD majors
         from wrapping mid-title. */
      degree: ["B.A. Communication", "B.A. International Studies — International Business"],
      period: "Sep 2021 – Jun 2024",
      detail: "Cumulative GPA 3.81 / 4.0 · Provost Honors Recipient",
      coursework: [
        {
          items: ["Product Marketing & Management", "Applied Market Research", "Global Business Strategy",
                  "Advertising Studies: Cultural Production", "Principles of Data Science",
                  "Business & Organizational Leadership", "Financial Accounting", "Practice of Social Research"]
        }
      ],
      involvement: ["Women in Business (WIB)", "Undergraduate Communication Society (UCS)"],
      photoTilt: [-2.5, 3, -1.5],
      photoScale: 0.9,
      photos: [
        "assets/experience/first-year-1.jpg",
        "assets/experience/first-year-2.jpg",
        "assets/experience/first-year-halloween.jpg"
      ],
      photo: "assets/experience/ucsd-graduation.jpg",
      year: "2021–2024"
    }
  ],

  work: [
    {
      company: "Bagel Brands",
      sub: "Einstein Bros. Bagels · Bruegger’s Bagels · Noah’s New York Bagels",
      role: "Graduate Marketing Consultant",
      period: "Jun 2026 – Sep 2026",
      place: "Evanston, IL",
      year: "2026",
      photos: ["assets/experience/bagel.jpg", "assets/experience/bagel2.jpg"],
      tags: ["Loyalty & CRM", "Segmentation", "Growth strategy"],
      points: [
        "Analysed loyalty transaction and RFM segmentation data across 1.39M registered loyalty members, consolidating 11 Paytronix segments into 4 strategic decision groups and uncovering a structural incentive misalignment that shaped a “Reinvigorating the Next Wave of Growth” strategy.",
        "Benchmarked menu architecture and competitive positioning across 11 QSR brands, analysed 1,100+ Google reviews for recurring guest-experience friction, and synthesised primary survey research into growth recommendations.",
        "Translated loyalty, segmentation, and customer research into activation strategies spanning loyalty redesign, menu innovation, and campus activation, presented to the CMO and executive leadership."
      ]
    },
    {
      company: "Asian Egg Bank & Hanabusa IVF",
      sub: "Largest Asian egg donor bank in the U.S.",
      role: "Marketing Associate",
      period: "Apr 2024 – Aug 2025",
      place: "San Diego, CA",
      year: "2024–2025",
      photos: [
        "assets/experience/Asian Egg Bank.jpg",
        "assets/experience/Asian Egg Bank Team.jpg",
        "assets/experience/hanabusa-halloween.jpg"
      ],
      tags: ["Social content", "Paid social", "SEO", "Marketing automation"],
      points: [
        "Created and managed cross-platform content for Instagram, TikTok, and Facebook with Canva, CapCut, and Adobe Creative Suite, generating 50K+ impressions and a 23% lift in followers and engagement.",
        "Planned and executed integrated campaigns, including paid social, lifting inbound leads 15% through sharper creative and targeting.",
        "Ran SEO and website optimisation that improved keyword rankings and drove an 18% increase in organic traffic and donor applications, with Keap automation behind donor campaigns and email.",
        "Analysed social and ad performance to refine content strategy against the numbers rather than instinct."
      ]
    },
    {
      company: "UC San Diego Annual Giving & Alumni Engagement",
      sub: "Student Storyteller",
      role: "UCSD Student Storyteller",
      period: "Oct 2022 – Jun 2024",
      place: "La Jolla, CA",
      year: "2022–2024",
      /* Two optional per-entry overrides for the photo cluster, both honoured
         by js/main.js. `photoTilt` replaces the generated rotation, in degrees,
         one per photo in the order below: the group shot on the right leans
         right rather than left. `photoBias` is the share of the top row given
         to the left frame — the left photo here is itself a strip of three
         stills, so it earns more width than the matched-height rule gives it. */
      /* Tilts in the reference: the wide base leans one way, the tall strip and
         the upright above lean the other. */
      photoTilt: [-1.5, 4, -2.5],
      photoShift: -24,
      photos: [
        "assets/experience/storyteller-filming.jpg",
        "assets/experience/storyteller-reel.jpg",
        "assets/experience/ucsd-team.jpg",
        "assets/experience/storyteller-sixth.jpg",
        "assets/experience/alumni-awards-event.jpg",
        "assets/experience/ucsd-awards.jpg"
      ],
      tags: ["Video production", "Brand storytelling", "Community growth"],
      points: [
        "Produced video content that gave alumni, students, parents, and supporters an inside look at campus life and the impact of giving, collectively earning 100K+ views.",
        "Worked across the whole production chain: scripting, storyboarding, filming, editing, peer review, and publishing.",
        "Developed fundraising initiatives qualifying and soliciting special-gift prospects in the $1,000–$25,000 range; contributed to UCSD’s 2023 Day of Caring, a campaign that raised $1,593,858.",
        "Managed the school’s official Instagram on Sprout Social, driving 15% follower growth and tuning the posting strategy from performance data."
      ]
    }
  ],

  skills: [
    { group: "Video", items: ["CapCut", "Final Cut Pro", "Premiere Pro", "iMovie", "Vimeo"] },
    { group: "Design", items: ["Canva", "Photoshop", "Figma"] },
    { group: "Web & commerce", items: ["WordPress", "Wix", "Shopify", "GitHub"] },
    { group: "Paid & lifecycle", items: ["Meta Ads", "Google Ads", "SEO/SEM (SEMrush)", "HubSpot", "Keap"] },
    { group: "Analytics", items: ["Google Analytics", "Sprout Social", "Tableau", "Brandwatch", "Later", "Excel"] }
  ],

  /* Films, in the order they appear. `kind: "film"` is landscape and plays on
     the big screen; `kind: "reel"` is vertical and lives in the rail below it.
     The first film is the one loaded on arrival.

     Everything with a `src` is self-hosted MP4 built by tools/prep_films.py
     from the masters in ~/Movies/minko-portfolio-masters, which stay out of
     the repo. Every `poster` on those is a real frame of its own film, pulled
     from the encoded file — not a photo standing in for one. Nothing is
     embedded any more: the two Instagram reels and the YouTube film that used
     to be here are all self-hosted now, so no player phones home, no login
     prompt appears, and every film keeps its own poster frame. */
  films: [
    {
      kind: "film",
      title: "Taste of Home",
      note: "The story of Fan-Fan: food, memory, and belonging on campus.",
      src: "assets/film/taste-of-home.mp4",
      poster: "assets/film/taste-of-home-poster.jpg",
      len: "4:59",
      year: "2024"
    },
    {
      kind: "film",
      title: "Spend a Day With Me",
      note: "A day-in-the-life film for UC San Diego.",
      src: "assets/film/spend-a-day.mp4",
      poster: "assets/film/spend-a-day-poster.jpg",
      len: "2:40",
      year: "2023"
    },
    {
      kind: "reel",
      title: "Graduation recap",
      note: "Class of 2024, cap in the air.",
      src: "assets/film/graduation.mp4",
      poster: "assets/film/graduation-poster.jpg",
      len: "1:29",
      year: "2024"
    },
    {
      kind: "reel",
      title: "New York Alumni Awards",
      note: "Event coverage for the alumni community.",
      src: "assets/film/alumni-awards.mp4",
      poster: "assets/film/alumni-awards-poster.jpg",
      len: "1:03",
      year: "2024"
    },
    {
      kind: "reel",
      title: "UCSD Farmers’ Market",
      note: "A Wednesday ritual on campus.",
      src: "assets/film/farmers-market.mp4",
      poster: "assets/film/farmers-market-poster.jpg",
      len: "0:38",
      year: "2024"
    },
    {
      kind: "reel",
      title: "Skydiving on Thanksgiving",
      note: "A jump over Oceanside, start to landing.",
      src: "assets/film/skydiving.mp4",
      poster: "assets/film/skydiving-poster.jpg",
      len: "0:57",
      year: "2024"
    }
  ],

  /* Each deck is read in the page as prerendered WebP slides, so `slug` and
     `pages` point at assets/design-album/slides/<slug>/pNN.webp. Rerun
     tools/prep_decks.py after replacing or adding a PDF. */
  /* Tools, as five trays on a table. `logo: true` means a real full-colour SVG
     sits at assets/tools/<slug>.svg, fetched by tools/prep_tool_logos.py.
     The nine without one are not published in any of the free colour-logo
     collections (checked against gilbarbara/logos, 2068 marks, and
     vectorlogo.zone), so they fall back to a tile in the brand's own colour
     until a real file is dropped in. */
  tools: [
    {
      group: "Video",
      items: [
        { name: "Premiere Pro", slug: "premiere-pro", c: "#9999FF", file: "premiere-pro.svg", use: "long-form cuts, colour and sound" },
        { name: "Final Cut Pro", slug: "final-cut-pro", c: "#1B1B1F", file: "final-cut-pro.png", use: "the films I shoot on a real camera" },
        { name: "CapCut", slug: "capcut", c: "#000000", file: "capcut.png", use: "fast vertical cuts and captions" },
        { name: "iMovie", slug: "imovie", c: "#8E54E9", file: "imovie.png", use: "quick assemblies on the phone" },
        { name: "Vimeo", slug: "vimeo", c: "#1AB7EA", file: "vimeo.svg", use: "where the finished films live" }
      ]
    },
    {
      group: "Design",
      items: [
        { name: "Canva", slug: "canva", c: "#00C4CC", file: "canva.svg", use: "decks, social sets, anything on a deadline" },
        { name: "Photoshop", slug: "photoshop", c: "#31A8FF", file: "photoshop.svg", use: "retouching and the stills that carry a campaign" },
        { name: "Figma", slug: "figma", c: "#F24E1E", file: "figma.svg", use: "layouts and handoff before anything gets built" }
      ]
    },
    {
      group: "Web & commerce",
      items: [
        { name: "WordPress", slug: "wordpress", c: "#21759B", file: "wordpress.svg", use: "the sites I maintain, not just launch" },
        { name: "Wix", slug: "wix", c: "#0C6EFC", file: "wix.svg", use: "fast builds for small brands" },
        { name: "Shopify", slug: "shopify", c: "#7AB55C", file: "shopify.svg", use: "product pages and the checkout path" },
        { name: "GitHub", slug: "github", c: "#181717", file: "github.svg", use: "versioning, and this site" }
      ]
    },
    {
      group: "Paid & lifecycle",
      items: [
        { name: "Meta Ads", slug: "meta-ads", c: "#0467DF", file: "meta-ads.svg", use: "paid social, creative testing" },
        { name: "Google Ads", slug: "google-ads", c: "#4285F4", file: "google-ads.svg", use: "search and demand capture" },
        { name: "HubSpot", slug: "hubspot", c: "#FF7A59", file: "hubspot.svg", use: "email sequences and the funnel behind them" },
        { name: "SEMrush", slug: "semrush", c: "#FF642D", file: "semrush.png", use: "keyword and competitor research" },
        { name: "Keap", slug: "keap", c: "#3CB371", file: "keap.png", use: "lifecycle automation for smaller lists" }
      ]
    },
    {
      group: "Analytics",
      items: [
        { name: "Google Analytics", slug: "google-analytics", c: "#E37400", file: "google-analytics.svg", use: "what people actually did on the site" },
        { name: "Tableau", slug: "tableau", c: "#E97627", file: "tableau.svg", use: "turning a messy export into one chart" },
        { name: "Sprout Social", slug: "sprout-social", c: "#75DD66", file: "sprout-social.png", use: "scheduling and social reporting" },
        { name: "Brandwatch", slug: "brandwatch", c: "#2B2A8C", file: "brandwatch.png", use: "listening, before the brief is written" },
        { name: "Later", slug: "later", c: "#1A1A1A", file: "later.png", use: "the social calendar" },
        { name: "Excel", slug: "excel", c: "#217346", file: "excel.png", use: "the first place I look at any dataset" }
      ]
    }
  ],

  design: [
    {
      title: "Marketing Design Portfolio",
      note: "Selected work built in Canva, Photoshop, and Premiere Pro.",
      pdf: "assets/design-portfolio.pdf",
      kind: "Cover",
      slug: "design-portfolio",
      pages: 12
    },
    {
      title: "Spotify",
      note: "",
      pdf: "assets/design-album/spotify.pdf",
      kind: "Deck",
      slug: "spotify",
      pages: 15
    },
    {
      title: "Blick",
      note: "",
      pdf: "assets/design-album/blick.pdf",
      kind: "Deck",
      slug: "blick",
      pages: 12
    },
    {
      title: "Blue Moon",
      note: "",
      pdf: "assets/design-album/blue-moon.pdf",
      kind: "Deck",
      slug: "blue-moon",
      pages: 37
    },
    {
      title: "Augmented Reality",
      note: "",
      pdf: "assets/design-album/augmented-reality.pdf",
      kind: "Deck",
      slug: "augmented-reality",
      pages: 16
    },
    {
      title: "Dossier",
      note: "",
      pdf: "assets/design-album/dossier.pdf",
      kind: "Deck",
      slug: "dossier",
      pages: 11
    },
    {
      title: "Single page slides",
      note: "",
      pdf: "assets/design-album/single-page-slides.pdf",
      kind: "Deck",
      slug: "single-page-slides",
      pages: 4
    }
  ],


  interests: [
    {
      key: "twins",
      emoji: "👯‍♀️",
      title: "Two of a kind",
      headline: "Two minutes ahead. Four inches behind.",
      story: "I’m a fraternal twin! My sister is two minutes younger, four inches taller, and looks nothing like me. Ask me anything about being a twin — I’ve got plenty of stories to share!",
      photos: [
        "assets/aboutme/web/twin1.jpg",
        "assets/aboutme/web/twin2.jpg",
        "assets/aboutme/web/twin3.jpg",
        "assets/aboutme/web/twin4.jpg"
      ]
    },
    {
      key: "ballet",
      emoji: "🩰",
      title: "A little room to dance",
      headline: "My favourite way to get out of my head.",
      story: "Ballet is where I slow down, let go, and explore who I am through movement. It teaches me discipline and patience, reminding me that progress takes time. There’s always something new to learn, and that’s what keeps me coming back.",
      photos: [
        "assets/aboutme/web/ballet.jpg",
        "assets/aboutme/web/ballet2.jpg",
        "assets/aboutme/web/ballet3.jpg",
        "assets/aboutme/web/ballet4.jpg"
      ]
    },
    {
      key: "cats",
      emoji: "🐾",
      title: "Small paws, big love",
      headline: "Five tiny guests. A very full heart.",
      story: "I’ve been volunteering at a cat shelter for almost a year and have fostered five kittens so far. I love giving back to the community while helping these little furballs find their forever homes.",
      photos: [
        "assets/aboutme/web/foster-sequoia.jpg",
        "assets/aboutme/web/foster-michael-jane.jpg",
        "assets/aboutme/web/foster-jonathan-bailey.jpg",
        "assets/aboutme/web/foster-marsala.jpg"
      ]
    },
    {
      key: "food",
      emoji: "🍜",
      title: "Always room for a bite",
      headline: "A curious palate, a busy kitchen.",
      story: "Nothing cheers me up quite like a good meal. I love experimenting in the kitchen and trying new cuisines, but I’m also the kind of person who can eat the same favourite dish on repeat without ever getting bored.",
      photos: [
        "assets/aboutme/web/foodie1.jpg",
        "assets/aboutme/web/foodie2.jpg",
        "assets/aboutme/web/foodie3.jpg",
        "assets/aboutme/web/foodie4.jpg",
        "assets/aboutme/web/foodie5.jpg"
      ]
    },
    {
      key: "crafts",
      emoji: "🧶",
      title: "Made with a little patience",
      headline: "Yarn, thread, ink. Endless possibilities.",
      story: "Crochet, cross-stitch, and calligraphy are my favourite ways to get creative. There’s something so satisfying about making something from scratch, especially when it turns out just the way I imagined (which isn’t always the case!).",
      photos: [
        "assets/aboutme/web/crochet1.jpg",
        "assets/aboutme/web/cross-stitch.jpg",
        "assets/aboutme/web/cross-stitch2.jpg",
        "assets/aboutme/web/calligraphy.jpg",
        "assets/aboutme/web/calligraphy2.jpg"
      ]
    },
    {
      key: "bear",
      emoji: "🧸",
      title: "Fifteen years of goodnight",
      headline: "Some things you never outgrow.",
      story: "My Disney ShellieMay bear has been by my side for 15 years. I still hug her to sleep every night — my longest-running bedtime tradition.",
      photos: ["assets/aboutme/web/shelliemay-bear.jpg", "assets/aboutme/web/shelliemay-bear2.jpg"]
    }
  ]
};
