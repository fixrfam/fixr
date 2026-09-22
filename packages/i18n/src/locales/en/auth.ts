export const auth = {
	layout: {
		imageAlt: "A person repairing a laptop with a screwdriver.",
		/**
		 * The headline is animated one word at a time, so each word is its own
		 * key instead of a single sentence.
		 */
		headline: {
			first: "Managing",
			second: "services",
			third: "with",
			fourth: "excellence.",
		},
		cta: "Log in to get started.",
		photoCredit: "Photo by Samsung Memory on Unsplash",
	},
	login: {
		title: "Welcome to Fixr!",
		subtitle: "Enter your credentials to access your account",
		emailLabel: "Email *",
		emailPlaceholder: "email@example.com",
		passwordLabel: "Password *",
		forgotPassword: "Forgot your password?",
		submit: "Log in",
		orContinueWith: "Or continue with",
		google: "Log in with Google",
		disclaimer: "Non-profit university project.",
	},
	register: {
		title: "Create an account",
		subtitle: "Fill in the form below to get started",
		emailLabel: "Email *",
		emailPlaceholder: "m@example.com",
		nameLabel: "Name",
		namePlaceholder: "John Doe",
		passwordLabel: "Password *",
		confirmPasswordLabel: "Confirm password *",
		submit: "Sign up",
		haveAccount: "Already have an account?",
		login: "Log in",
	},
	forgotPassword: {
		title: "Forgot your password?",
		subtitle: "Type your email below and we will reset it for you!",
		emailLabel: "Email *",
		emailPlaceholder: "email@example.com",
		submit: "Reset password",
		success: {
			title: "Email sent! 📧",
			description: "We sent you a reset email.",
			paragraph:
				"Click the link we sent to your email, fill in your new password and you are all set!",
		},
	},
	resetPassword: {
		title: "Change your password",
		subtitle: "Create a new secure password and fill it in below.",
		passwordLabel: "Password *",
		confirmPasswordLabel: "Confirm password *",
		confirmDescription:
			"Confirming helps to rule out typos and keeps your account safe.",
		submit: "Change password",
		success: {
			title: "Password changed! 🎉",
			description: "Your password was changed successfully.",
			paragraph: "You made it! You can now log in with your new password.",
		},
	},
	success: {
		goToLogin: "Go to login",
	},
	turnstile: {
		error: "Security check failed. Reload the page and try again.",
		interactive: "Security check required. Complete the CAPTCHA challenge",
	},
	signOut: {
		loading: "Signing out, one moment...",
		success: "See you soon!",
		error: "Could not sign out, please try again.",
	},
	verifiedDialog: {
		cta: "Get started",
		toastTitle: "Log in to explore the app.",
		toastDescription: "We are waiting for you!",
		title: "Account verified!",
		description: "Your account verification is complete.",
		details:
			"Your email was verified and your account is ready to use. Click below to log in and start exploring.",
	},
	deletedDialog: {
		cta: "Close",
		toastTitle: "See you around!",
		toastDescription: "Your account was deleted. Come back whenever you want.",
		title: "Your account was deleted",
		description: "We are sad to see you go!",
		details:
			"If you decide to come back, we will be here to welcome you. Feel free to sign up again at any time!",
	},
} as const;
