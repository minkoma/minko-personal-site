# Vendored libraries

GSAP 3.13.0 and Lenis 1.3.11, vendored from pinned npm releases via jsDelivr so the site needs no CDN at runtime.

- `gsap.min.js`, `ScrollTrigger.min.js`, `Draggable.min.js`: GSAP standard "no charge" license, which covers a site like this one. See https://gsap.com/community/standard-license/
- `lenis.min.js`: MIT. See https://github.com/darkroomengineering/lenis
- `three.module.min.js`: three.js r169, MIT. See https://github.com/mrdoob/three.js — used only by `depth-lab.html`, which is a scratch page, so nothing on the live site loads it.

# Media notes

YouTube iframe parameters: https://developers.google.com/youtube/player_parameters
YouTube referrer requirements: https://developers.google.com/youtube/terms/required-minimum-functionality

Instagram uses the existing posts' embed endpoints with permanent original-source links. Google Drive preview depends on the original file's public sharing permissions. No videos were downloaded or reuploaded.
