"use client";

import AuthFormSuccess from "@/components/auth/auth-form-success";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { useState } from "react";

export default function ForgotPassword() {
    const [success, setSuccess] = useState(false);

    return !success ? (
        <ForgotPasswordForm onSuccess={setSuccess} />
    ) : (
        <AuthFormSuccess
            title='Email sent! 📧'
            description='We sent you a confirmation email.'
            paragraph='Click the link sent to your email, fill your new password and you are ready to go!'
        />
    );
}
