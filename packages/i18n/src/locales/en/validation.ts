/**
 * Form validation copy. Schemas in `@fixr/schemas` emit these keys instead of
 * plain text, and the form layer renders them in the reader's language.
 */
export const validation = {
	generic: {
		required: "Fill in this field",
		invalidFormat: "Invalid format.",
	},
	name: {
		required: "Name is required",
		min: "The name must be at least {{count}} characters.",
		max: "Oops! That name is too long...",
		tooLong: "Name too long.",
		atLeast: "Name must be at least {{count}} characters.",
		atMost: "Name must be at most {{count}} characters long.",
	},
	email: {
		required: "Email is required.",
		invalid: "Invalid email address",
	},
	password: {
		required: "Password is required.",
		complexity:
			"Password needs to contain one uppercase character, one lowercase character, one number, one special character and be at least 8 length.",
	},
	phone: {
		required: "Phone number is required",
		incomplete: "Incomplete phone number.",
	},
	address: {
		required: "Address is required",
		min: "Address must be at least {{count}} characters long.",
		max: "Address must be at most {{count}} characters long.",
	},
	city: {
		required: "City is required",
	},
	state: {
		required: "State is required",
	},
	document: {
		cpf: "Invalid CPF",
		cnpj: "Invalid CNPJ",
	},
	subdomain: {
		min: "Subdomain must be at least {{count}} character long.",
		max: "Subdomain must be at most {{count}} characters long.",
	},
	apiKey: {
		expirationInPast: "The expiration date must be in the future.",
	},
	serviceOrder: {
		clientInvalid: "Invalid client.",
		brandInvalid: "Invalid device brand.",
		categoryInvalid: "Invalid device category.",
		assigneeInvalid: "Invalid assignee.",
		modelRequired: "The device model is required.",
		modelMax: "The device model exceeds {{count}} characters.",
		imeiMax: "The IMEI exceeds {{count}} characters.",
		issueRequired: "The reported issue is required.",
		issueMax: "The reported issue exceeds the allowed limit.",
		notesMax: "The notes exceed the allowed limit.",
		photosMax: "At most {{count}} photos per service order.",
		photoDescriptionMax: "The description exceeds {{count}} characters.",
		dateFromInvalid: "Invalid start date.",
		dateToInvalid: "Invalid end date.",
		dateRange: "The start date must be on or before the end date.",
	},
	upload: {
		idRequired: "The upload id is required.",
		fileNameRequired: "The file name is required.",
		fileNameMax: "The file name exceeds {{count}} characters.",
		contentTypeRequired: "The content type is required.",
		contentTypeMax: "The content type exceeds {{count}} characters.",
		contentTypeInvalid: "The content type must be a valid MIME type.",
		sizeRequired: "The file size is required.",
		sizeInteger: "The size must be a whole number.",
		sizePositive: "The size must be greater than zero.",
		sizeMax: "The file exceeds the {{limit}} limit.",
	},
} as const;
