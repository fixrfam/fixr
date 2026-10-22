"use client";

import { useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { type FormEvent, useState } from "react";
import { Button, type ButtonProps } from "../ui/button";

const SignOutButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ children, ...props }, ref) => {
		const { t } = useTranslation();
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
				text: t("auth.signOut.loading"),
				options: {
					promise: fetchSignout(),
					success: t("auth.signOut.success"),
					error: t("auth.signOut.error"),
					autoDismiss: false,
				},
			});
		};

		return (
			<form onSubmit={(e) => onSubmit(e)}>
				<Button disabled={loading} ref={ref} {...props}>
					{children}
					{loading ? <Loader2 className="animate-spin" /> : <LogOut />}
				</Button>
			</form>
		);
	}
);
SignOutButton.displayName = "SignOutButton";

export { SignOutButton };
