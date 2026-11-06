"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/account/profile-avatar";
import { LanguageToggle } from "@/components/language-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCpf, formatPhone } from "@/lib/format";
import { portalApi } from "@/lib/services/portal";
import { ShopMark } from "./portal-cards";
import { portalKeys, usePortalMe } from "./store";

/** CPF with only the last digits visible, e.g. `***.***.725-47`. */
function maskCpf(cpf: string) {
	const formatted = formatCpf(cpf);
	return `***.***.${formatted.slice(-6)}`;
}

/** Who is signed in, their shops and the way out. */
export function PortalProfile() {
	const { t } = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: me, isPending } = usePortalMe();
	const signOut = useMutation({
		mutationFn: portalApi.signOut,
		onSettled: () => {
			queryClient.removeQueries({ queryKey: portalKeys.all });
			router.replace("/portal/access");
		},
	});

	if (isPending || !me) {
		return <Skeleton className="h-64 rounded-2xl" />;
	}

	return (
		<div className="space-y-5">
			<section className="flex flex-col items-center rounded-2xl border bg-card px-4 py-6 text-center">
				<Avatar
					className="size-20 border-4 border-background shadow-md"
					fallbackHash={me.email}
					fallbackType="beam"
				/>
				<h1 className="mt-3 font-heading font-semibold text-xl">
					{me.name ?? me.email}
				</h1>
				<dl className="mt-3 grid w-full max-w-xs grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left text-sm">
					<dt className="text-muted-foreground">{t("portal.profile.email")}</dt>
					<dd className="truncate">{me.email}</dd>
					<dt className="text-muted-foreground">{t("portal.profile.cpf")}</dt>
					<dd className="tabular-nums">{maskCpf(me.cpf)}</dd>
				</dl>
			</section>

			{me.shops.length > 0 && (
				<section className="rounded-2xl border bg-card p-4">
					<h2 className="font-semibold text-sm">{t("portal.profile.shops")}</h2>
					<p className="text-muted-foreground text-xs">
						{t("portal.profile.shopsDescription")}
					</p>
					<ul className="mt-3 divide-y">
						{me.shops.map((shop) => (
							<li className="flex items-center gap-3 py-3" key={shop.name}>
								<ShopMark className="size-9 rounded-xl text-sm" shop={shop} />
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sm">{shop.name}</p>
									{shop.phone && (
										<p className="text-muted-foreground text-xs">
											{formatPhone(shop.phone)}
										</p>
									)}
								</div>
								{shop.phone && (
									<Button
										asChild
										className="rounded-full"
										size="icon-sm"
										variant="outline"
									>
										<a
											aria-label={t("portal.detail.call")}
											href={`tel:${shop.phone}`}
										>
											<Phone className="size-3.5" />
										</a>
									</Button>
								)}
								{shop.email && (
									<Button
										asChild
										className="rounded-full"
										size="icon-sm"
										variant="outline"
									>
										<a
											aria-label={t("portal.detail.email")}
											href={`mailto:${shop.email}`}
										>
											<Mail className="size-3.5" />
										</a>
									</Button>
								)}
							</li>
						))}
					</ul>
				</section>
			)}

			<section className="rounded-2xl border bg-card p-4">
				<h2 className="mb-2 font-semibold text-sm">
					{t("portal.profile.preferences")}
				</h2>
				<div className="flex items-center justify-between py-1.5 text-sm">
					<span>{t("portal.profile.theme")}</span>
					<ModeToggle variant="outline" />
				</div>
				<div className="flex items-center justify-between py-1.5 text-sm">
					<span>{t("portal.profile.language")}</span>
					<LanguageToggle variant="outline" />
				</div>
			</section>

			<Button
				className="w-full rounded-full"
				disabled={signOut.isPending}
				onClick={() => signOut.mutate()}
				size="lg"
				variant="outline"
			>
				<LogOut className="size-4" />
				{t("portal.profile.signOut")}
			</Button>
		</div>
	);
}
