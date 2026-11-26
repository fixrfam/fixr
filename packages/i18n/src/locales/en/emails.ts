/**
 * Transactional email copy. Rendered on the server in the recipient's locale.
 * Plain text only: the templates render it as React text, which escapes every
 * interpolated value. The lead of each email says the point in its first
 * sentence; the rest explains what happens next.
 */
export const emails = {
	common: {
		linkFallback: "If the button doesn't work, open this link:",
	},
	invite: {
		subject: "{{company}} added you to {{app}}",
		preview: "Your temporary password is inside. Sign in and change it.",
		heading: "Welcome to the {{company}} team",
		lead: "Hi {{name}}, {{company}} runs its repair shop on {{app}} and just gave you access. You sign in with this email and the temporary password below.",
		passwordLabel: "Temporary password",
		stepsTitle: "Your first five minutes",
		step1: "Sign in with this email and the temporary password.",
		step2: "Go to Account and pick a password only you know.",
		step3:
			"Open Service orders to see what is with you and with your department.",
		cta: "Sign in to {{app}}",
		note: "Nobody from {{company}} or {{app}} will ever ask for this password by phone or message.",
		footer:
			"You got this email because {{company}} added you to its team on {{app}}. If you don't know them, ignore it and nothing will happen.",
	},
	portalAccess: {
		subject: "Your service orders at {{company}}",
		subjectSelf: "Your link to follow your service orders",
		preview: "See where each repair stands without calling the shop.",
		heading: "All your repairs in one place",
		lead: "Hi {{name}}, the customer portal shows every device you left at {{company}}, from diagnosis to pickup, so you don't need to call to know how it's going.",
		leadSelf:
			"Hi {{name}}, here is the link you asked for. The customer portal shows every device you left at shops that use Fixr, from diagnosis to pickup.",
		listTitle: "In the portal you can",
		item1: "See which stage each service order is in",
		item2: "Approve or decline estimates and download their PDFs",
		item3: "Check the history and photos of your devices",
		cta: "Open my portal",
		note: "The link works for 30 days on any device and opens your history, so keep it to yourself.",
		footer:
			"You got this email because your access to the Fixr customer portal was requested. If it wasn't you, ignore it.",
	},
	estimate: {
		subject: "Estimate #{{number}} from {{company}}",
		preview: "{{total}} to repair your {{device}}. Valid until {{date}}.",
		heading: "Your {{device}} has an estimate",
		lead: "Hi {{name}}, {{company}} has looked at your {{device}} and the repair comes to {{total}}. Check what is included and answer by {{date}}.",
		numberLabel: "Estimate",
		deviceLabel: "Device",
		validUntilLabel: "Valid until",
		totalLabel: "Total",
		stepsTitle: "What happens next",
		step1: "You approve or decline through the link. No account needed.",
		step2:
			"If you approve, {{company}} starts the repair and you can follow each stage.",
		step3:
			"If you decline, you can leave a reason and {{company}} sees your answer right away.",
		cta: "Answer estimate #{{number}}",
		note: "The PDF with every item is attached. After {{date}}, ask {{company}} for a new estimate.",
		footer:
			"You got this email because {{company}} sent you an estimate through Fixr. If you didn't ask for one, ignore it.",
	},
	verification: {
		subject: "Confirm your email on {{app}}",
		preview: "One click and your account is ready.",
		heading: "One click left",
		lead: "Hi {{name}}, your {{app}} account is created. Confirm that this address is yours so you can start using it and get back in if you ever forget your password.",
		cta: "Confirm my email",
		note: "The link works once and only confirms this address.",
		footer:
			"You got this email because someone created a {{app}} account with this address. If it wasn't you, ignore it.",
	},
	passwordReset: {
		subject: "Reset your {{app}} password",
		preview: "Choose a new password for your account.",
		heading: "Let's change your password",
		lead: "Hi {{name}}, we got a request to reset the password of your {{app}} account. If it was you, choose a new one with the button below.",
		cta: "Choose a new password",
		note: "The link works once. Don't forward this email: whoever has the link can change your password.",
		footer:
			"If you didn't ask for this, ignore this email. Your password stays the same.",
	},
	accountDeletion: {
		subject: "Confirm the deletion of your {{app}} account",
		preview: "We need you to confirm before we delete anything.",
		heading: "Confirm your account deletion",
		lead: "Hi {{name}}, you asked to delete your {{app}} account. Before we erase anything, we need to make sure it was you.",
		irreversible:
			"Once you confirm, the account and all the data tied to it are erased right away. This can't be undone.",
		cta: "Delete my account",
		footer:
			"If you didn't ask for this, ignore this email. Your account stays active.",
	},
} as const;
