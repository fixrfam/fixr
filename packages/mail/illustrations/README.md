# Email illustrations

The drawing at the top of each email shows the process the email is about in
three numbered steps, built from pieces of Fixr's own interface (cards,
fields, buttons, the order timeline). Flat, on a light background, mostly in
Fixr blue; red appears only in the account deletion.

`generate.ts` draws all of them from shared pieces, so a change to a piece
(the card, the button, the step badges) reaches every email. It writes the SVG
sources next to it and the PNGs the emails load, rendered at 2x, to
`apps/web/public/emails/process` (`illustrationUrl` in `packages/mail/src.ts`).
Email clients don't render SVG, so the emails never point at the sources.

After changing a scene, run from the repo root:

```sh
bun packages/mail/illustrations/generate.ts
```

The PNGs directly in `apps/web/public/emails` belong to the previous design
and stay there so emails already sent keep their images.
