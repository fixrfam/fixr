export const portal = {
	header: {
		title: "My service orders",
		greeting: "Hi, {{name}}!",
		signOut: "Sign out",
	},
	list: {
		empty: "No service orders yet.",
		openedAt: "Opened on {{date}}",
		details: "See details",
		pendingEstimate: "Estimate waiting for your answer",
	},
	detail: {
		back: "Back to my service orders",
		title: "{{device}}",
		shop: "Shop",
		reportedDefect: "Reported defect",
		items: "Parts and services",
		noItems: "The shop has not added parts or services yet.",
		servicePart: "Part used in the service above",
		estimates: "Estimates",
		noEstimates: "No estimate sent yet.",
		estimateNumber: "Estimate #{{number}}",
		validUntil: "Valid until {{date}}",
		total: "Total {{total}}",
		openPdf: "Open PDF",
		approve: "Approve",
		reject: "Reject",
		expired: "Expired",
		contact: "Contact",
	},
	status: {
		pending: "Received",
		diagnosing: "Diagnosing",
		waiting_approval: "Waiting for your approval",
		approved: "Approved",
		fixing: "Being repaired",
		ready: "Ready for pickup",
		delivered: "Delivered",
	},
	entry: {
		opening: "Opening your area...",
		invalidTitle: "Link not available",
		invalidDescription:
			"This link is invalid or was replaced by a newer one. Ask for a new link with your email.",
		requestNew: "Get a new link",
	},
	access: {
		title: "Access my service orders",
		description:
			"Enter the email you gave the shop. We will send you a link to see your service orders.",
		email: "Email",
		emailPlaceholder: "you@email.com",
		submit: "Send me a link",
		sending: "Sending...",
		sentTitle: "Check your email",
		sentDescription:
			"If this email is registered at a shop that uses Fixr, you will get a link in a few minutes.",
	},
	fromEstimate: "See all my service orders",
	shopActions: {
		sendAccess: "Send portal access",
		sendAccessTitle: "Send portal access to {{name}}",
		sendAccessDescription:
			"The customer gets an email with a link to the customer portal, to follow their service orders and answer estimates. Previous links sent by your shop stop working.",
		confirm: "Send access",
		cancel: "Cancel",
	},
} as const;
