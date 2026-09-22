import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslator } from "@/lib/i18n/server";

/** The legal documents are dated content, so the date is formatted, not copy. */
const LAST_UPDATED_AT = new Date("2025-10-16T00:00:00Z");

export default async function MdxLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { t, format } = await getTranslator();

	return (
		<>
			<div
				className="absolute z-0 h-[30rem] w-full bg-primary/40"
				id="gradient"
			>
				<div
					className="h-full w-full bg-gradient-to-b from-transparent to-background"
					id="blackoverlay"
				/>
			</div>
			<main className="relative z-10 mx-auto max-w-7xl px-6 pt-32">
				<Link className="text-muted-foreground text-sm" href={"/"}>
					<ArrowLeft className="inline-block scale-75" /> {t("home.legal.back")}
				</Link>
				<div className="my-6 flex flex-wrap items-center gap-4">
					<span
						className="rounded-full bg-primary px-6 py-2 text-white text-xs"
						id="badge"
					>
						{t("home.legal.badge")}
					</span>
					<p className="text-muted-foreground text-sm">
						{t("home.legal.updatedAt", {
							date: format.date(LAST_UPDATED_AT, { timeZone: "UTC" }),
						})}
					</p>
				</div>
				<article className="grid max-w-3xl grid-cols-1 gap-5 pb-20">
					{children}
				</article>
			</main>
		</>
	);
}
