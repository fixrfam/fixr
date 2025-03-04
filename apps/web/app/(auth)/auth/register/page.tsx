"use client";

import { RegisterForm } from "@/components/auth/register-form";
import AuthFormSuccess from "@/components/auth/auth-form-success";
import { useState } from "react";

export default function RegisterPage() {
    const [success, setSuccess] = useState(false);

    return !success ? (
        <RegisterForm onSuccess={setSuccess} />
    ) : (
        <AuthFormSuccess
            title='Check your inbox'
            description='Your account was created successfully!🎉'
            paragraph='We sent you a confirmation email. Click the link and you are ready to go!'
        />
    );
}
