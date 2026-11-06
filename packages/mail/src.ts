export const whiteLogoUrl = "https://i.imgur.com/d3ZzTqA.png";

/**
 * Where the email illustrations are served (the web app's `public/emails`).
 * Email clients don't render SVG, so these are PNGs rendered at 2x from the
 * sources in `packages/mail/illustrations`.
 */
export const illustrationsUrl = "https://fixr.com.br/emails";

export type Illustration =
	| "verification"
	| "password-reset"
	| "account-deletion"
	| "invite"
	| "estimate"
	| "portal-access";

export const illustrationUrl = (name: Illustration) =>
	`${illustrationsUrl}/${name}.png`;
