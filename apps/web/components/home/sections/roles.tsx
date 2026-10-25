"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { RolesScene } from "../iso/scenes/roles";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";

/** Ordered from the narrowest access to the widest, like the scene's layers. */
const ROLES = [
	"technician",
	"warehouse",
	"financial",
	"manager",
	"admin",
] as const;

export default function Roles() {
	const { t } = useTranslation();
	const [active, setActive] = useState(0);
	const role = ROLES[active] ?? ROLES[0];

	return (
		<section
			className="grid w-full max-w-7xl scroll-mt-24 items-center gap-12 lg:grid-cols-2"
			id="roles"
		>
			<Reveal className="order-last aspect-square w-full max-w-lg justify-self-center lg:order-first">
				<RolesScene active={active} label={t("home.roles.scene")} />
			</Reveal>
			<div className="flex flex-col gap-8">
				<SectionHeading
					align="left"
					badge={t("home.roles.badge")}
					description={t("home.roles.description")}
					icon={ShieldCheck}
					titleBefore={t("home.roles.titleBefore")}
					titleHighlight={t("home.roles.titleHighlight")}
				/>
				<Reveal className="flex flex-col gap-4" delay={0.1}>
					<p className="font-light text-muted-foreground text-sm">
						{t("home.roles.pick")}
					</p>
					<div className="flex flex-wrap gap-2">
						{ROLES.map((key, index) => (
							<button
								aria-pressed={index === active}
								className={cn(
									"rounded-full border px-3 py-2 font-semibold text-sm transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
									index === active
										? "border-primary bg-primary text-primary-foreground"
										: "border-border bg-card hover:border-primary/40 hover:bg-accent"
								)}
								key={key}
								onClick={() => setActive(index)}
								type="button"
							>
								{t(`roles.${key}`)}
							</button>
						))}
					</div>
					<div
						aria-live="polite"
						className="rounded-2xl border border-border bg-card p-4"
					>
						<h3 className="font-heading text-xl">{t(`roles.${role}`)}</h3>
						<p className="mt-2 text-pretty font-light text-base text-muted-foreground">
							{t(`home.roles.items.${role}`)}
						</p>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
