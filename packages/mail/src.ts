/**
 * Where the email assets are served (the web app's `public/emails`). Email
 * clients don't render SVG, so they load PNGs: the logo, from
 * `apps/web/public/TextLogo.svg` in Fixr blue, and the process drawn at the top
 * of each email, from `packages/mail/illustrations/generate.ts`.
 */
export const emailAssetsUrl = "https://fixr.com.br/emails";

export const logoUrl = `${emailAssetsUrl}/logo.png`;

export type Illustration =
	| "verification"
	| "password-reset"
	| "account-deletion"
	| "invite"
	| "estimate"
	| "portal-access";

export const illustrationUrl = (name: Illustration) =>
	`${emailAssetsUrl}/process/${name}.png`;
