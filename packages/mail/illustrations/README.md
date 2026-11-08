# Email illustrations

Isometric art for the hero of each email, one per template. Email clients
(Gmail, Outlook) don't render SVG, so the emails load PNGs rendered from these
sources at 2x (1920x880) and served by the web app from `apps/web/public/emails`
(`illustrationsUrl` in `packages/mail/src.ts`).

After editing an SVG, render it again with any SVG rasterizer at density 144,
e.g. `rsvg-convert -z 2 estimate.svg -o ../../../apps/web/public/emails/estimate.png`.
