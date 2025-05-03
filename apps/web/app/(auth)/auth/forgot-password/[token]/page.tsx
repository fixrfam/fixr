"use client";

import AuthFormSuccess from "@/components/auth/auth-form-success";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { useState, use } from "react";

export default function ChangePasswordPage(props: { params: Promise<{ token: string }> }) {
    const params = use(props.params);
    const [success, setSuccess] = useState(false);

    return !success ? (
        <ResetPasswordForm onSuccess={setSuccess} token={params.token} />
    ) : (
        <AuthFormSuccess
            title='Password changed! 🎉'
            description='Password changed! 🎉'
            paragraph='You did it! Now you can login with your new password.'
        />
    );
}
