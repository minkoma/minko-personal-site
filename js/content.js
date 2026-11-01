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

  /* Hero layer geometry, measured from the supplied 1920x1080 artwork by
     tools/prep_hero.py. Fractions are of the frame, so any stage size works. */
  hero: {
    frame: [1920, 1080],
    scene: "../assets/hero/scene.jpg",
    scenePlaceholder: "../assets/hero/scene-small.jpg",
    name: "../assets/hero/name.png",
    subject: "../assets/hero/subject.png",
    nameBox: [280, 45, 1631, 457],
    subjectBox: [758, 46, 1254, 1060],
    letters: [
      { src: "../assets/hero/name-01.png", box: [278,  176,  521,  368] },
      { src: "../assets/hero/name-02.png", box: [509,  160,  611,  329] },
      { src: "../assets/hero/name-03.png", box: [614,  136,  780,  316] },
      { src: "../assets/hero/name-04.png", box: [808,  136,  984,  301] },
      { src: "../assets/hero/name-05.png", box: [989,  136,  1148,  305] },
      { src: "../assets/hero/name-06.png", box: [1222,  146,  1451,  338] },
      { src: "../assets/hero/name-07.png", box: [1447,  192,  1633,  373] }
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
      photo: "../assets/experience/northwestern.jpg",
      year: "2025"
    },
    {
      school: "University of California, San Diego",
      place: "La Jolla, CA",
      degree: "B.A. Communication · B.A. International Studies (International Business)",
      period: "Sep 2021 – Jun 2024",
      detail: "Cumulative GPA 3.81 / 4.0 · Provost Honors Recipient",
      photo: "../assets/experience/ucsd-graduation.jpg",
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
      photos: ["../assets/experience/bagel.jpg"],
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
        "../assets/experience/Asian Egg Bank.jpg",
        "../assets/experience/Asian Egg Bank Team.jpg",
        "../assets/experience/hanabusa-halloween.jpg"
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
        "../assets/experience/ucsd-team.jpg",
        "../assets/experience/ucsd-awards.jpg",
        "../assets/experience/ucsd-graduation.jpg"
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
      embed: "https://www.youtube-nocookie.com/embed/q2FydPe0dEs?playsinline=1",
      source: "https://youtu.be/q2FydPe0dEs",
      host: "YouTube",
      poster: "../assets/experience/ucsd-team.jpg"
    },
    {
      title: "Taste of Home",
      note: "Food, memory, and belonging on campus.",
      embed: "https://drive.google.com/file/d/1fqWAGMzZHsRLnFVDzHd3WNh04QCnRGBP/preview",
      source: "https://drive.google.com/file/d/1fqWAGMzZHsRLnFVDzHd3WNh04QCnRGBP/view",
      host: "Google Drive",
      poster: "../assets/aboutme/web/foodie1.jpg"
    },
    {
      title: "New York Alumni Awards",
      note: "Event coverage for the alumni community.",
      embed: "https://www.instagram.com/p/C5o5H6OPJcL/embed/",
      source: "https://www.instagram.com/p/C5o5H6OPJcL/",
      host: "Instagram",
      poster: "../assets/experience/ucsd-awards.jpg"
    },
    {
      title: "UCSD Farmers’ Market",
      note: "A short reel on a Wednesday ritual.",
      embed: "https://www.instagram.com/reel/C5RECJtOtdj/embed/",
      source: "https://www.instagram.com/reel/C5RECJtOtdj/",
      host: "Instagram",
      poster: "../assets/aboutme/web/foodie3.jpg"
    }
  ],

  design: [
    {
      title: "Marketing Design Portfolio",
      note: "Selected work built in Canva, Photoshop, and Premiere Pro.",
      image: "../assets/design-album/design-portfolio-cover.jpg",
      pdf: "../assets/design-portfolio.pdf",
      kind: "Cover"
    },
    {
      title: "Assignment #3",
      note: "Marketing strategy and analysis prepared for coursework.",
      image: "../assets/design-album/assignment-3-minko-ma.jpg",
      pdf: "../assets/design-album/assignment-3-minko-ma.pdf",
      kind: "Strategy"
    },
    {
      title: "Shopper Marketing",
      note: "IMC 424: shopper behaviour, retail context, and activation.",
      image: "../assets/design-album/imc424-shopper-marketing.jpg",
      pdf: "../assets/design-album/imc424-shopper-marketing.pdf",
      kind: "IMC 424"
    },
    {
      title: "Chobani Case",
      note: "A brand case study on positioning and growth.",
      image: "../assets/design-album/chobani-case-minko-ma.jpg",
      pdf: "../assets/design-album/chobani-case-minko-ma.pdf",
      kind: "Case study"
    }
  ],

  interests: [
    {
      key: "twins",
      emoji: "👯‍♀️",
      title: "Two of a kind",
      headline: "Two minutes ahead. Ten centimetres behind.",
      story: "My twin sister is two minutes younger than me — and 10 cm taller. I’ll always have seniority, even if she has the better view.",
      photos: ["../assets/aboutme/web/twin1.jpg", "../assets/aboutme/web/twin2.jpg", "../assets/aboutme/web/twin3.jpg"]
    },
    {
      key: "ballet",
      emoji: "🩰",
      title: "A little room to dance",
      headline: "My favourite way to get out of my head.",
      story: "Ballet is where I slow down, let go, and explore who I am through movement. I love getting completely lost in a dance.",
      photos: ["../assets/aboutme/web/ballet.jpg", "../assets/aboutme/web/ballet2.jpg", "../assets/aboutme/web/ballet3.jpg"]
    },
    {
      key: "travel",
      emoji: "🌍",
      title: "Just one more stamp",
      headline: "15+ countries, and still curious.",
      story: "I love going somewhere new. After exploring more than 15 countries, I’m always ready for another place to discover and another memory to bring home.",
      photos: [
        "../assets/aboutme/web/travel.jpg",
        "../assets/aboutme/web/travel2.jpg",
        "../assets/aboutme/web/travel3.jpg",
        "../assets/aboutme/web/travel4.jpg",
        "../assets/aboutme/web/travel5.jpg"
      ]
    },
    {
      key: "cats",
      emoji: "🐾",
      title: "Small paws, big love",
      headline: "Five tiny guests. A very full heart.",
      story: "I volunteer at a shelter and have fostered five kittens: Sequoia, Michael, Jane, Jonathan Bailey, and Marsala. Giving them a little home along the way has been such a joy.",
      photos: [
        "../assets/aboutme/web/foster-sequoia.jpg",
        "../assets/aboutme/web/foster-michael-jane.jpg",
        "../assets/aboutme/web/foster-jonathan-bailey.jpg",
        "../assets/aboutme/web/foster-marsala.jpg"
      ]
    },
    {
      key: "food",
      emoji: "🍜",
      title: "Always room for a bite",
      headline: "A curious palate, a busy kitchen.",
      story: "I love cooking just as much as trying different cuisines. Whether I’m making a meal at home or tasting something new, food is one of my favourite ways to explore.",
      photos: [
        "../assets/aboutme/web/foodie1.jpg",
        "../assets/aboutme/web/foodie2.jpg",
        "../assets/aboutme/web/foodie3.jpg",
        "../assets/aboutme/web/foodie4.jpg",
        "../assets/aboutme/web/foodie5.jpg"
      ]
    },
    {
      key: "crafts",
      emoji: "🧶",
      title: "Made with a little patience",
      headline: "Yarn, thread, ink. Endless possibilities.",
      story: "Crochet, cross-stitch, and calligraphy are my little creative playground. I love watching an idea become something I can hold, stitch by stitch or brushstroke by brushstroke.",
      photos: [
        "../assets/aboutme/web/crochet1.jpg",
        "../assets/aboutme/web/cross-stitch.jpg",
        "../assets/aboutme/web/cross-stitch2.jpg",
        "../assets/aboutme/web/calligraphy.jpg"
      ]
    },
    {
      key: "forky",
      emoji: "🍴",
      title: "My kind of character",
      headline: "A soft spot for a very unusual toy.",
      story: "Forky is my favourite cartoon character. A little quirky and completely lovable — he always makes me smile.",
      photos: ["../assets/aboutme/web/me-forky.jpg"]
    },
    {
      key: "coffee",
      emoji: "☕",
      title: "But first, a latte",
      headline: "Home café. Occasional chaos.",
      story: "I like starting the morning by making myself a latte. Some days it comes together beautifully; other days, the barista is still learning. Either way, it’s my little morning ritual.",
      photos: ["../assets/aboutme/web/make-coffee.jpg"]
    },
    {
      key: "bear",
      emoji: "🧸",
      title: "Fifteen years of goodnight",
      headline: "Some things you never outgrow.",
      story: "My Disney ShellieMay bear has been by my side for 15 years. I still hug her to sleep every night — my longest-running bedtime tradition.",
      photos: ["../assets/aboutme/web/shelliemay-bear.jpg"]
    }
  ]
};
