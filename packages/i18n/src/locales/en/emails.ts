/**
 * Transactional email copy. Rendered on the server with the recipient's
 * locale, so a few keys carry inline markup (`<b>`, `<i>`, `<br />`) to keep
 * the original emphasis. Interpolated values are escaped before they land in
 * the markup.
 */
export const emails = {
	header: {
		docs: "Docs",
		app: "App",
	},
	invite: {
		subject: "🎉 Welcome to {{app}} – your access to the system",
		preview: "{{name}}, your access to {{app}}!",
		greeting: "Hi, <i>{{name}}</i>!",
		heading: "<b>{{company}}</b> added you to {{app}}.",
		body: "Your account was created <b>successfully</b>. You are now an <b>employee</b> of <b>{{company}}</b> and can use the platform to manage service orders, quotes and much more.",
		instructions:
			"To get in, <b>click the button below</b> and log in with <b>this email</b> and the <b>random password</b> shown here.",
		cta: "Access",
		passwordHint:
			"Change the default password in your account settings after the first login.",
		footer: "If you do not recognize this company, please ignore this email.",
	},
	verification: {
		subject: "Verify your email, @{{name}}!",
		preview: "{{name}}, confirm your email!",
		title: "<b>{{name}}</b>, your new account is just one step away.",
		greeting: "Hey <b>{{name}}</b>!",
		body: "You have registered a new account on {{app}}, click the button below to confirm your identity.",
		cta: "Verify email",
		footer: "If you have not registered, please ignore this email.",
	},
	passwordReset: {
		subject: "Forgot your password, {{name}}?",
		preview: "Password reset",
		greeting: "Hi, <i>{{name}}</i>!",
		heading: "Forgot your password? 🔒",
		body: "We received a request to change the password of your {{app}} account.<br />If it was you, set a new password by clicking the button below:",
		cta: "Reset my password",
		warning: "To keep your account safe, do not forward this email to anyone.",
		footer:
			"If you did not ask for this change, just ignore and delete this message.",
	},
	accountDeletion: {
		subject: "{{name}}'s account delete confirmation.",
		preview: "{{name}}, confirm your account deletion.",
		title: "Account deletion confirmation",
		greeting: "Hey <b>{{name}}</b>.",
		body: "You requested account deletion on {{app}}. By clicking the button below, your account will be <b>permanently deleted</b> with all associated data.",
		irreversible: "<b>This action is irreversible.</b>",
		cta: "Delete account",
		footer: "If you have not requested deletion, please ignore this email.",
	},
} as const;
