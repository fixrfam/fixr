export const messages: { [key: string]: { title: string; description: string } } = {
    email_already_used: {
        title: "Email already registered.",
        description: "There's another account using this email.",
    },
    verification_email_failed: {
        title: "Failed to send verification email",
        description: "There was a problem on our end. Try again later.",
    },
    user_registered_success: {
        title: "Account created.",
        description: "Check your email to activate it.",
    },
    invalid_password: {
        title: "Wrong password",
        description: "Check your typing and try again.",
    },
    email_not_verified: {
        title: "Email not verified",
        description: "Click the link sent to your email and try again.",
    },
    user_not_found: {
        title: "User not found",
        description: "We couldn't find any user with this credentials.",
    },
    login_success: {
        title: "Logged in successfully!",
        description: "You will be redirected soon...",
    },
    update_account_success: {
        title: "Account updated sucessfully!",
        description: "Reload to see the changes.",
    },
    password_update_success: {
        title: "Password updated successfully!",
        description: "Use your new password the next time you log in.",
    },
    equal_passwords: {
        title: "Passwords match",
        description: "Your new password cannot be the same as the current one.",
    },
    password_reset_request_accepted: {
        title: "Reset request sent",
        description: "Please check your email for instructions.",
    },
    existing_password_reset_request: {
        title: "Request pending",
        description:
            "You already have a reset request. Complete it or wait 30 minutes for it to expire.",
    },
    token_expired: {
        title: "Oops... Your time expired.",
        description: "Please start over as 30 minutes passed since you started the reset.",
    },
    deletion_request_accepted: {
        title: "Deletion request sent",
        description: "Please check your email for confirming.",
    },
    existing_deletion_request: {
        title: "Request pending",
        description:
            "You already have a deletion request. Complete it or wait 30 minutes for it to expire.",
    },
};

export const fallbackMessages = {
    success: {
        title: "Success!",
        description: "Your request was completed successfully.",
    },
    error: {
        title: "Oops! Something went wrong.",
        description: "We couldn't process your request. Please check your input and try again.",
    },
};
