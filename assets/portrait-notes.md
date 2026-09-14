# Homepage portrait

Source: user-provided `IMG_9944.heic`. Original file preserved.

Final asset: `minko-cutout.png`, RGBA PNG extracted from original photo pixels using Apple Vision foreground instance segmentation. Core Image removes residual magenta wall spill. CSS adds the mint outline, halo, three bubbles, and two stars; reduced-motion preferences disable animation.

Research: https://developer.apple.com/documentation/vision/vngenerateforegroundinstancemaskrequest

Two built-in imagegen attempts were rejected because their PNGs had no alpha channel. Prompt: “Remove the pink wall and ground from this exact photo. Transparent background PNG with actual alpha channel is REQUIRED, do not paint a checkerboard background. Preserve original person pixels, face, hairstyle, expression, dress, body and shoes. Tight crop around full person. This is background removal only, not a new portrait. No background, no checkerboard, no pattern, no shadow, no added outline. Export RGBA.” Neither generated portrait is used by the site.
