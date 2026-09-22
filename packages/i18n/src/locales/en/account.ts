export const account = {
	settings: {
		passwordTitle: "Change password",
		passwordDescription:
			"Update your account password. To change it you must provide your current password and a new one.",
		passwordHint: "Make sure to pick a strong, unique password.",
		deleteTitle: "Delete account",
		deleteDescription:
			"Deleting your account is permanent and cannot be undone. This erases all your data and everything related to you.",
		deleteHint: "Please make sure you really want to go ahead before confirming.",
	},
	changePassword: {
		trigger: "Change",
		title: "Change password",
		description: "Enter your current password and the new one you want to use.",
		current: "Current",
		new: "New",
		confirm: "Confirm",
		confirmDescription:
			"Confirming rules out typos and keeps your account safe.",
	},
	deleteAccount: {
		trigger: "Request deletion",
		title: "Are you absolutely sure?",
		description:
			"This action cannot be undone. It permanently deletes your account and removes your data from our servers.",
		phraseLabel: 'Please type "delete my account" to continue',
		phrasePlaceholder: "Type here",
		phraseInvalid: "Invalid phrase.",
		submit: "Delete",
	},
	profile: {
		noDisplayName: "No display name",
		info: "Info",
	},
	avatar: {
		userPhoto: "User photo",
		change: "Change profile picture",
		remove: "Remove profile picture",
		alt: "Profile picture",
		uploadTitle: "Change profile picture",
		stepSelect: "Pick a photo for your profile.",
		stepCrop: "Adjust how your photo is framed.",
		stepUploading: "Saving...",
		saving: "Saving your photo...",
		dropzoneTitle: "Drag your photo here or click to pick one",
		dropzoneHint: "PNG, JPG or WebP. Up to 5MB.",
		updateSuccess: "Profile picture updated!",
		updateError: "Could not update the profile picture",
		removeTitle: "Remove profile picture",
		removeDescription:
			"Are you sure you want to remove your profile picture? This cannot be undone.",
		removing: "Removing...",
		removeSuccess: "Profile picture removed.",
		removeError: "Could not remove the profile picture.",
	},
} as const;
