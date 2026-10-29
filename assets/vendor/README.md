# PhotoSwipe 5.4.4

Vendored from the pinned npm release via jsDelivr. MIT license included in `photoswipe-LICENSE`. UMD builds support this no-build static site, including local-file galleries.

Documentation: https://photoswipe.com/getting-started/

# GSAP 3.13.0 and Lenis 1.3.11

Vendored from pinned npm releases via jsDelivr so the three scroll-driven versions in `v1/`, `v2/`, and `v3/` need no CDN at runtime.

- `gsap.min.js`, `ScrollTrigger.min.js`, `Draggable.min.js` — GSAP standard "no charge" license, which covers a site like this one. See https://gsap.com/community/standard-license/
- `lenis.min.js` — MIT. See https://github.com/darkroomengineering/lenis

`swiper-bundle.min.*` (MIT) drives the coverflow player carousel in `v2/`.

# Media notes

YouTube iframe parameters: https://developers.google.com/youtube/player_parameters
YouTube referrer requirements: https://developers.google.com/youtube/terms/required-minimum-functionality

Instagram uses the existing posts’ embed endpoints with permanent original-source links. Actual playback is not verified; Meta documentation retrieval was rate-limited. Google Drive preview also depends on the original file’s public sharing permissions. No videos were downloaded or reuploaded. Replacement videos can be hosted with permission and their player URLs substituted while retaining the original Instagram links.

Browser interaction was unavailable during implementation. HTML asset/anchor checks and the local HTTP preview passed; photo zoom/swiping and third-party playback still require browser verification.
