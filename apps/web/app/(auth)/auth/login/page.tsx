import { AuthDialogs } from "@/components/auth/auth-dialogs";
import { LoginForm } from "@/components/auth/login-form";
import { cookieKey } from "@repo/constants/cookies";
import { cookies } from "next/headers";

export default function LoginPage() {
    const cookieStore = cookies();
    const showVerifiedDialog = cookieStore.get(cookieKey("showVerifiedDialog"))?.value === "true";
    const showDeletedDialog = cookieStore.get(cookieKey("showDeletedDialog"))?.value === "true";

    return (
        <>
            <LoginForm />
            <AuthDialogs
                showDeletedDialog={showDeletedDialog}
                showVerifiedDialog={showVerifiedDialog}
            />
        </>
    );
}
