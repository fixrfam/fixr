"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ArrowLeft, Construction } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<div className="grid h-dvh w-full place-items-center px-4 text-center">
			<div className="flex flex-col items-center gap-4">
				<div className="grid size-12 place-items-center rounded-md border border-primary bg-primary/20 text-primary ring-2 ring-primary/50">
					<Construction className="size-8" />
				</div>
				<div className="space-y-2">
					<h1 className="font-semibold text-2xl">
						{t("dashboard.notFound.title")}
					</h1>
					<p className="mt-2">{t("dashboard.notFound.description")}</p>
					<p className="mt-1 text-gray-700 text-sm">
						{t("dashboard.notFound.hint")}
					</p>
				</div>
				<Button onClick={() => router.back()} variant={"default"}>
					<ArrowLeft /> {t("common.actions.back")}
				</Button>
			</div>
		</div>
	);
}
