import { env } from "@fixr/env/web";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/dashboard/back-button";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/server";

export default async function DowntimePage() {
	const { t } = await getTranslator();

	return (
		<main className="flex min-h-screen flex-col items-center px-6 py-20">
			<section className="flex w-full max-w-3xl flex-col gap-6 pt-6 text-justify text-sm leading-relaxed md:pt-20 md:text-base">
				<BackButton className="inline-flex w-auto -translate-x-4 self-start px-4" />
				<h1 className="text-left font-heading font-semibold text-2xl md:text-4xl">
					{t("home.downtime.title")}
				</h1>

				<Image
					alt={t("home.downtime.bannerAlt")}
					className="w-full rounded-lg border border-border"
					height={630}
					src={"/og_image.jpg"}
					width={1200}
				/>

				<p className="text-muted-foreground">{t("home.downtime.project")}</p>

				<p className="text-muted-foreground">{t("home.downtime.costs")}</p>

				<p className="text-muted-foreground">{t("home.downtime.outside")}</p>

				<p className="text-muted-foreground">{t("home.downtime.learn")}</p>

				<div className="flex gap-4">
					<Link href={env.NEXT_PUBLIC_LINKTREE_URL ?? "/"}>
						<Button className="font-light">
							{t("home.downtime.linktree")}{" "}
							<ExternalLink className="inline-block h-5 w-5" />
						</Button>
					</Link>
					<Link href={env.NEXT_PUBLIC_DOCS_URL ?? "/"}>
						<Button className="font-light" variant="outline">
							{t("home.downtime.docs")}{" "}
							<ExternalLink className="inline-block h-5 w-5" />
						</Button>
					</Link>
				</div>

				<p className="text-muted-foreground">{t("home.downtime.thanks")}</p>

				<p>{t("home.downtime.signature")}</p>
			</section>
		</main>
	);
}
