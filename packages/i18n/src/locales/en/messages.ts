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
		create_estimate_success: {
			title: "Estimate created",
			description: "It was saved as a draft. Open the PDF to review it.",
		},
		update_estimate_status_success: {
			title: "Estimate updated",
			description: "The status was changed.",
		},
		delete_estimate_success: {
			title: "Estimate deleted",
			description: "The draft was removed.",
		},
		estimate_service_order_empty: {
			title: "Nothing to estimate",
			description: "Add parts or services to the service order first.",
		},
		estimate_service_order_not_found: {
			title: "Service order not found",
			description: "This service order does not exist in your company.",
		},
		estimate_not_editable: {
			title: "Estimate locked",
			description: "Only drafts can be changed or deleted.",
		},
		estimate_invalid_transition: {
			title: "Status not allowed",
			description: "The estimate can't move to this status now.",
		},
		send_estimate_success: {
			title: "Estimate sent",
			description:
				"The customer will get an email with the PDF and the approval link.",
		},
		estimate_no_recipient: {
			title: "No email to send to",
			description: "The customer has no email. Enter one to send the estimate.",
		},
		estimate_expired: {
			title: "Estimate expired",
			description: "The validity date has passed. Back to draft and update it.",
		},
		estimate_link_invalid: {
			title: "Link not available",
			description:
				"This estimate link is invalid or was replaced by a newer one.",
		},
		estimate_already_answered: {
			title: "Estimate already answered",
			description: "This estimate was already approved or rejected.",
		},
		approve_estimate_success: {
			title: "Estimate approved",
			description: "Thank you! The shop was notified.",
		},
		reject_estimate_success: {
			title: "Estimate rejected",
			description: "Thank you for the answer. The shop was notified.",
		},
		portal_link_invalid: {
			title: "Link not available",
			description: "This link is invalid or was replaced. Ask for a new one.",
		},
		portal_unauthorized: {
			title: "Session ended",
			description: "Open the link from your email again.",
		},
		portal_access_requested: {
			title: "Check your email",
			description: "If the email is registered, a link is on the way.",
		},
		send_portal_access_success: {
			title: "Access sent",
			description: "The customer will get an email with the portal link.",
		},
		portal_customer_no_email: {
			title: "No email",
			description: "Add the customer's email before sending portal access.",
		},
		estimate_not_found: {
			title: "Estimate not found",
			description: "This estimate does not exist or was removed.",
		},
		service_order_catalog_item_not_found: {
			title: "Item not found",
			description: "This part or service is no longer in the catalog.",
		},
		service_order_item_not_found: {
			title: "Item not found",
			description: "This item was already removed from the order.",
		},
		service_order_not_found: {
			title: "Service order not found",
			description: "This service order does not exist or was removed.",
		},
		part_stock_insufficient: {
			title: "Not enough stock",
			description: "The adjustment would leave the stock below zero.",
		},
		part_sku_conflict: {
			title: "SKU already registered",
			description: "Another part of your company already uses this SKU.",
		},
		part_supplier_not_found: {
			title: "Supplier not found",
			description: "Pick a supplier registered in your company.",
		},
		part_sale_price_below_cost: {
			title: "Sale price below cost",
			description: "The sale price must be at least the cost price.",
		},
		part_not_found: {
			title: "Part not found",
			description: "This part does not exist or was removed.",
		},
		service_part_not_found: {
			title: "Part not found",
			description: "One of the selected parts no longer exists.",
		},
		service_not_found: {
			title: "Service not found",
			description: "This service does not exist or was removed.",
		},
		supplier_cnpj_conflict: {
			title: "CNPJ already registered",
			description: "Your company already has a supplier with this CNPJ.",
		},
		supplier_in_use: {
			title: "Supplier in use",
			description: "Move or remove its parts before deleting the supplier.",
		},
		supplier_not_found: {
			title: "Supplier not found",
			description: "This supplier does not exist or was removed.",
		},
		update_company_profile_success: {
			title: "Company updated",
			description: "Your documents will use the new data.",
		},
		company_logo_url_invalid: {
			title: "Invalid logo",
			description: "Upload the logo again and save.",
		},
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
				"The email linked to your Google account is not registered as an employee or customer of any company.",
		},
		gacc_email_not_verified: {
			title: "Email not verified",
			description:
				"Your Google email address has not been verified yet. Verify it and try again.",
		},
	},
} as const;
