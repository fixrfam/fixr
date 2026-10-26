"use client";

import { env } from "@fixr/env/web";
import { useTranslation } from "@fixr/i18n/react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { dashboardHref } from "@/lib/auth/utils";
import { useSession } from "@/lib/hooks/use-session";
import { FixrCubeScene } from "../iso/scenes/fixr-cube";
import { Reveal } from "../reveal";

export default function Cta() {
	const { t } = useTranslation();
	const { session } = useSession();

	return (
		<section className="w-full max-w-7xl">
			<Reveal className="grid items-center gap-8 overflow-hidden rounded-4xl border border-border bg-card p-8 md:p-12 lg:grid-cols-2">
				<div className="flex flex-col items-start gap-6">
					<h2 className="max-w-170 text-balance font-light text-3xl md:text-5xl">
						{t("home.cta.titleBefore")}{" "}
						<span className="font-heading">{t("home.cta.titleHighlight")}</span>
					</h2>
					<p className="max-w-lg text-pretty font-light text-base text-muted-foreground md:text-lg">
						{t("home.cta.description")}
					</p>
					<div className="flex flex-wrap gap-4">
						<Link href={session ? dashboardHref(session) : "/auth/login"}>
							<Button className="font-light">
								{session ? t("common.auth.goToDashboard") : t("home.hero.cta")}
							</Button>
						</Link>
						<Link href={env.NEXT_PUBLIC_DOCS_URL ?? "/"}>
							<Button className="font-light" variant="outline">
								{t("home.hero.docs")}{" "}
								<ExternalLink className="ml-2 inline-block h-5 w-5" />
							</Button>
						</Link>
					</div>
					<p className="font-light text-muted-foreground text-sm">
						{t("home.cta.reassurance")}
					</p>
				</div>
				<div className="mx-auto aspect-square w-full max-w-sm">
					<FixrCubeScene label={t("home.cta.scene")} />
				</div>
			</Reveal>
		</section>
	);
}
