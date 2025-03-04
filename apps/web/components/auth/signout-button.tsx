"use client";

import React, { FormEvent, useState } from "react";
import { Button, ButtonProps } from "../ui/button";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "@pheralb/toast";
import { useRouter } from "next/navigation";

const SignOutButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, ...props }, ref) => {
        const [loading, setLoading] = useState(false);

        const router = useRouter();

        const onSubmit = (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const fetchSignout = async () => {
                setLoading(true);
                const response = await fetch("/api/auth/signout", {
                    method: "GET",
                    credentials: "include",
                });

                if (response.redirected) {
                    router.push(response.url);
                }
            };

            toast.loading({
                text: "Signing you out, hold tight...",
                options: {
                    promise: fetchSignout(),
                    success: "See you later!",
                    error: "Error signing out, try again.",
                    autoDismiss: false,
                },
            });
        };

        return (
            <form onSubmit={(e) => onSubmit(e)}>
                <Button disabled={loading} ref={ref} {...props}>
                    {children}
                    {!loading ? <LogOut /> : <Loader2 className='animate-spin' />}
                </Button>
            </form>
        );
    }
);
SignOutButton.displayName = "SignOutButton";

export { SignOutButton };
