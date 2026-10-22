import {
	SignedIn,
	SignedOut,
	SignInButton,
	SignOutButton,
	UserButton,
} from "@clerk/nextjs";
import { Lock, LogOut } from "lucide-react";
import Link from "next/link";
import Fixr from "@/components/fixr";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/server";

export default async function Home() {
	const { t } = await getTranslator();

	return (
		<main className="flex h-dvh w-full items-center justify-center px-4">
			<div className="flex flex-col space-y-6">
				<Fixr className="w-12 text-[#1E64FD]" />
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						{t("admin.landing.title")}
					</h1>
					<p className="traking-tight text-muted-foreground">
						{t("admin.landing.description")}
					</p>
					<span className="inline-flex items-center gap-1 text-muted-foreground/50 text-xs">
						<Lock className="size-3" />
						{t("admin.landing.restricted")}
					</span>
				</div>
				<SignedOut>
					<Button asChild>
						<SignInButton
							fallbackRedirectUrl={"/dash"}
							forceRedirectUrl={"/dash"}
						>
							{t("common.auth.login")}
						</SignInButton>
					</Button>
				</SignedOut>
				<SignedIn>
					<hr />
					<div className="flex items-center justify-between">
						<Button asChild className="max-w-xs grow">
							<Link href="/dash">{t("admin.landing.dashboard")}</Link>
						</Button>
						<div className="inline-flex items-center gap-2">
							<Button asChild variant={"ghost"}>
								<SignOutButton>
									<span>
										{t("common.auth.logout")} <LogOut />
									</span>
								</SignOutButton>
							</Button>
							<UserButton />
						</div>
					</div>
				</SignedIn>
			</div>
		</main>
	);
}
