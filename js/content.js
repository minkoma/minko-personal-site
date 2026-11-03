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
    email: "minkoma2002@gmail.com",
    phone: "858-539-5783",
    linkedin: "https://www.linkedin.com/in/minko-m-281519255/",
    resume: "../resume.html",
    languages: "Bilingual in Mandarin and English"
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
      photos: [
        "assets/experience/nu-graduation-1.jpg",
        "assets/experience/nu-graduation-2.jpg",
        "assets/experience/nu-graduation-3.jpg"
      ],
      photo: "assets/experience/northwestern.jpg",
      year: "2025"
    },
    {
      school: "University of California, San Diego",
      place: "La Jolla, CA",
      degree: "B.A. Communication · B.A. International Studies (International Business)",
      period: "Sep 2021 – Jun 2024",
      detail: "Cumulative GPA 3.81 / 4.0 · Provost Honors Recipient",
      photos: [
        "assets/experience/first-year-1.jpg",
        "assets/experience/first-year-2.jpg",
        "assets/experience/first-year-3.jpg"
      ],
      photo: "assets/experience/ucsd-graduation.jpg",
      year: "2021"
    }
  ],

  work: [
    {
      company: "Bagel Brands",
      sub: "Einstein Bros. Bagels · Bruegger’s Bagels · Noah’s New York Bagels",
      role: "Graduate Marketing Consultant",
      period: "Jun 2026 – Aug 2026",
      place: "Evanston, IL",
      year: "2026",
      photos: ["assets/experience/bagel.jpg"],
      tags: ["Loyalty & CRM", "Segmentation", "Growth strategy"],
      points: [
        "Analysed loyalty transaction and RFM segmentation data across 1.39M registered loyalty members, consolidating 11 Paytronix segments into 4 strategic decision groups and uncovering a structural incentive misalignment that shaped a “Reinvigorating the Next Wave of Growth” strategy.",
        "Benchmarked menu architecture and competitive positioning across 11 QSR brands, analysed 1,100+ Google reviews for recurring guest-experience friction, and synthesised primary survey research (n=1,277) into growth recommendations.",
        "Translated loyalty, segmentation, and customer research into activation strategies spanning loyalty redesign, menu innovation, and campus activation, presented to the CMO and executive leadership."
      ]
    },
    {
      company: "Asian Egg Bank & Hanabusa IVF",
      sub: "Largest Asian egg donor bank in the U.S.",
      role: "Marketing Associate",
      period: "Apr 2024 – Aug 2025",
      place: "San Diego, CA",
      year: "2024",
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
      year: "2022",
      photos: [
        "assets/experience/storyteller-filming.jpg",
        "assets/experience/storyteller-reel.jpg",
        "assets/experience/alumni-awards-event.jpg",
        "assets/experience/storyteller-sixth.jpg",
        "assets/experience/ucsd-team.jpg",
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

  videos: [
    {
      title: "Spend a Day With Me",
      note: "A day-in-the-life film for UC San Diego.",
      embed: "https://www.youtube.com/embed/q2FydPe0dEs?playsinline=1&rel=0",
      source: "https://youtu.be/q2FydPe0dEs",
      host: "YouTube",
      poster: "assets/experience/ucsd-team.jpg"
    },
    {
      title: "Taste of Home",
      note: "Food, memory, and belonging on campus.",
      embed: "https://drive.google.com/file/d/1fqWAGMzZHsRLnFVDzHd3WNh04QCnRGBP/preview",
      source: "https://drive.google.com/file/d/1fqWAGMzZHsRLnFVDzHd3WNh04QCnRGBP/view",
      host: "Google Drive",
      poster: "assets/aboutme/web/foodie1.jpg"
    },
    {
      title: "New York Alumni Awards",
      note: "Event coverage for the alumni community.",
      embed: "https://www.instagram.com/p/C5o5H6OPJcL/embed/",
      source: "https://www.instagram.com/p/C5o5H6OPJcL/",
      host: "Instagram",
      poster: "assets/experience/ucsd-awards.jpg"
    },
    {
      title: "UCSD Farmers’ Market",
      note: "A short reel on a Wednesday ritual.",
      embed: "https://www.instagram.com/reel/C5RECJtOtdj/embed/",
      source: "https://www.instagram.com/reel/C5RECJtOtdj/",
      host: "Instagram",
      poster: "assets/aboutme/web/foodie3.jpg"
    }
  ],

  /* Each deck is read in the page as prerendered WebP slides, so `slug` and
     `pages` point at assets/design-album/slides/<slug>/pNN.webp. Rerun
     tools/prep_decks.py after replacing or adding a PDF. */
  design: [
    {
      title: "Marketing Design Portfolio",
      note: "Selected work built in Canva, Photoshop, and Premiere Pro.",
      image: "assets/design-album/design-portfolio-cover.jpg",
      pdf: "assets/design-portfolio.pdf",
      kind: "Cover",
      slug: "design-portfolio",
      pages: 12
    },
    {
      title: "Assignment #3",
      note: "Marketing strategy and analysis prepared for coursework.",
      image: "assets/design-album/assignment-3-minko-ma.jpg",
      pdf: "assets/design-album/assignment-3-minko-ma.pdf",
      kind: "Strategy",
      slug: "assignment-3",
      pages: 1
    },
    {
      title: "Shopper Marketing",
      note: "IMC 424: shopper behaviour, retail context, and activation.",
      image: "assets/design-album/imc424-shopper-marketing.jpg",
      pdf: "assets/design-album/imc424-shopper-marketing.pdf",
      kind: "IMC 424",
      slug: "imc424-shopper-marketing",
      pages: 16
    },
    {
      title: "Chobani Case",
      note: "A brand case study on positioning and growth.",
      image: "assets/design-album/chobani-case-minko-ma.jpg",
      pdf: "assets/design-album/chobani-case-minko-ma.pdf",
      kind: "Case study",
      slug: "chobani-case",
      pages: 6
    }
  ],

  interests: [
    {
      key: "twins",
      emoji: "👯‍♀️",
      title: "Two of a kind",
      headline: "Two minutes ahead. Ten centimetres behind.",
      story: "My twin sister is two minutes younger than me — and 10 cm taller. I’ll always have seniority, even if she has the better view.",
      photos: ["assets/aboutme/web/twin1.jpg", "assets/aboutme/web/twin2.jpg", "assets/aboutme/web/twin3.jpg"]
    },
    {
      key: "ballet",
      emoji: "🩰",
      title: "A little room to dance",
      headline: "My favourite way to get out of my head.",
      story: "Ballet is where I slow down, let go, and explore who I am through movement. I love getting completely lost in a dance.",
      photos: ["assets/aboutme/web/ballet.jpg", "assets/aboutme/web/ballet2.jpg", "assets/aboutme/web/ballet3.jpg"]
    },
    {
      key: "travel",
      emoji: "🌍",
      title: "Just one more stamp",
      headline: "15+ countries, and still curious.",
      story: "I love going somewhere new. After exploring more than 15 countries, I’m always ready for another place to discover and another memory to bring home.",
      photos: [
        "assets/aboutme/web/travel.jpg",
        "assets/aboutme/web/travel2.jpg",
        "assets/aboutme/web/travel3.jpg",
        "assets/aboutme/web/travel4.jpg",
        "assets/aboutme/web/travel5.jpg"
      ]
    },
    {
      key: "cats",
      emoji: "🐾",
      title: "Small paws, big love",
      headline: "Five tiny guests. A very full heart.",
      story: "I volunteer at a shelter and have fostered five kittens: Sequoia, Michael, Jane, Jonathan Bailey, and Marsala. Giving them a little home along the way has been such a joy.",
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
      story: "I love cooking just as much as trying different cuisines. Whether I’m making a meal at home or tasting something new, food is one of my favourite ways to explore.",
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
      story: "Crochet, cross-stitch, and calligraphy are my little creative playground. I love watching an idea become something I can hold, stitch by stitch or brushstroke by brushstroke.",
      photos: [
        "assets/aboutme/web/crochet1.jpg",
        "assets/aboutme/web/cross-stitch.jpg",
        "assets/aboutme/web/cross-stitch2.jpg",
        "assets/aboutme/web/calligraphy.jpg"
      ]
    },
    {
      key: "forky",
      emoji: "🍴",
      title: "My kind of character",
      headline: "A soft spot for a very unusual toy.",
      story: "Forky is my favourite cartoon character. A little quirky and completely lovable — he always makes me smile.",
      photos: ["assets/aboutme/web/me-forky.jpg"]
    },
    {
      key: "coffee",
      emoji: "☕",
      title: "But first, a latte",
      headline: "Home café. Occasional chaos.",
      story: "I like starting the morning by making myself a latte. Some days it comes together beautifully; other days, the barista is still learning. Either way, it’s my little morning ritual.",
      photos: ["assets/aboutme/web/make-coffee.jpg"]
    },
    {
      key: "bear",
      emoji: "🧸",
      title: "Fifteen years of goodnight",
      headline: "Some things you never outgrow.",
      story: "My Disney ShellieMay bear has been by my side for 15 years. I still hug her to sleep every night — my longest-running bedtime tradition.",
      photos: ["assets/aboutme/web/shelliemay-bear.jpg"]
    }
  ]
};
