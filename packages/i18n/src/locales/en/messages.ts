/**
 * Feedback for the `code` the API returns on every response.
 * The backend stays language agnostic: it sends the code, we render the copy.
 */
export const messages = {
	fallback: {
		success: {
			title: "Done!",
			description: "Your request was completed successfully.",
		},
		error: {
			title: "Oops! Something went wrong.",
			description:
				"We could not process your request. Check the data and try again.",
		},
	},
	codes: {
		create_api_key_success: {
			title: "Key created",
			description: "Copy the secret now, it will not be shown again.",
		},
		revoke_api_key_success: {
			title: "Key revoked",
			description: "Requests using this key will be refused from now on.",
		},
		api_key_name_conflict: {
			title: "Name already taken",
			description: "You already have an active key with this name.",
		},
		api_key_invalid_scopes: {
			title: "Invalid permissions",
			description: "A key cannot hold more permissions than you do.",
		},
		api_key_not_found: {
			title: "Key not found",
			description: "This key does not exist or does not belong to you.",
		},
		api_key_already_revoked: {
			title: "Key already revoked",
			description: "This key was revoked earlier.",
		},
		api_key_expiration_too_far: {
			title: "Expiration too far out",
			description: "The expiration date is beyond the allowed limit.",
		},
		rate_limit_exceeded: {
			title: "Too many requests",
			description: "Wait a moment before trying again.",
		},
		schema_mismatch: {
			title: "Invalid schema",
			description: "The request you sent cannot be processed.",
		},
		cpf_conflict: {
			title: "CPF already registered",
			description: "An employee with this CPF already exists.",
		},
		cnpj_conflict: {
			title: "CNPJ already registered",
			description: "A company with this CNPJ already exists.",
		},
		email_already_exists: {
			title: "Email already registered",
			description: "A user with this email already exists.",
		},
		email_already_used: {
			title: "Email already registered",
			description: "There is already an account using this email.",
		},
		subdomain_taken: {
			title: "Subdomain in use",
			description: "This domain was already picked by another company.",
		},
		company_create_success: {
			title: "Done!",
			description: "Company created successfully.",
		},
		company_not_found: {
			title: "Company not found",
			description: "There are no companies linked to your account.",
		},
		not_allowed: {
			title: "Access denied",
			description: "You do not have permission to perform this action.",
		},
		violates_role_hierarchy: {
			title: "Action denied",
			description: "You can only register employees below your own role.",
		},
		create_employee_success: {
			title: "Done!",
			description: "Employee registered successfully.",
		},
		verification_email_failed: {
			title: "Could not send the verification email",
			description: "The problem is on our side. Please try again later.",
		},
		user_registered_success: {
			title: "Account created.",
			description: "Check your email to activate it.",
		},
		invalid_password: {
			title: "Wrong password",
			description: "Check what you typed and try again.",
		},
		email_not_verified: {
			title: "Email not verified",
			description: "Click the link we sent to your email and try again.",
		},
		user_not_found: {
			title: "User not found",
			description: "We found no user with these credentials.",
		},
		login_success: {
			title: "Logged in!",
			description: "You will be redirected in a moment...",
		},
		update_account_success: {
			title: "Account updated!",
			description: "Reload the page to see the changes.",
		},
		password_update_success: {
			title: "Password updated!",
			description: "Use your new password on the next login.",
		},
		equal_passwords: {
			title: "Passwords are the same",
			description: "Your new password cannot match the current one.",
		},
		password_reset_request_accepted: {
			title: "Reset request sent",
			description: "Check your email for the instructions.",
		},
		existing_password_reset_request: {
			title: "Request pending",
			description:
				"You already have an active request. Finish it or wait 30 minutes for it to expire.",
		},
		token_expired: {
			title: "Your time is up.",
			description: "Start over, 30 minutes have already passed.",
		},
		deletion_request_accepted: {
			title: "Deletion request sent",
			description: "Check your email to confirm it.",
		},
		existing_deletion_request: {
			title: "Request pending",
			description:
				"You already have a deletion request. Finish it or wait 30 minutes for it to expire.",
		},
		gacc_missing_email: {
			title: "Email not provided",
			description:
				"We could not read your email address from Google. Please try again.",
		},
		gacc_user_not_found: {
			title: "Could not access your account",
			description:
				"The email linked to your Google account is not registered as an employee or client of any company.",
		},
		gacc_email_not_verified: {
			title: "Email not verified",
			description:
				"Your Google email address has not been verified yet. Verify it and try again.",
		},
	},
} as const;
