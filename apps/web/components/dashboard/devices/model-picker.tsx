"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { ModelListItem } from "@fixr/schemas/models";
import { ChevronsUpDown, Smartphone } from "lucide-react";
import { useState } from "react";
import { StackedDialog } from "@/components/dashboard/dialog-stack";
import { ModelImage } from "@/components/dashboard/models/model-image";
import {
	ModelsBrowser,
	useLocalModelsParams,
} from "@/components/dashboard/models/models-explorer";
import { AddModelPrompt } from "@/components/dashboard/models/new-model-form";
import { Button } from "@/components/ui/button";

export interface PickedModel {
	id: string;
	name: string;
	maker: string;
	imageUrl?: string | null;
	category?: string | null;
}

function toPicked(model: ModelListItem): PickedModel {
	return {
		id: model.id,
		name: model.name,
		maker: model.maker.name,
		imageUrl: model.imageUrl,
		category: model.category?.slug,
	};
}

/**
 * The model of a device. Opens the device catalog over the current dialog,
 * with the search, filters and specs of the catalog page; who can register
 * devices can also add a model that isn't there yet.
 */
export function ModelPicker({
	value,
	onChange,
	id,
}: {
	value: PickedModel | null;
	onChange: (model: PickedModel) => void;
	id?: string;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button
				aria-haspopup="dialog"
				className="h-14 w-full justify-between gap-3 px-2.5 font-normal"
				id={id}
				onClick={() => setOpen(true)}
				type="button"
				variant="outline"
			>
				<span className="flex min-w-0 items-center gap-3">
					<ModelImage
						alt={value?.name ?? ""}
						category={value?.category}
						className="size-10"
						src={value?.imageUrl}
					/>
					{value ? (
						<span className="min-w-0 text-left">
							<span className="block truncate font-medium">{value.name}</span>
							<span className="block truncate text-muted-foreground text-xs">
								{value.maker}
							</span>
						</span>
					) : (
						<span className="truncate text-muted-foreground">
							{t("devices.form.modelPlaceholder")}
						</span>
					)}
				</span>
				<ChevronsUpDown className="size-4 shrink-0 opacity-50" />
			</Button>
			<ModelBrowserDialog
				onOpenChange={setOpen}
				onPick={(model) => {
					onChange(model);
					setOpen(false);
				}}
				open={open}
			/>
		</>
	);
}

function ModelBrowserDialog({
	open,
	onOpenChange,
	onPick,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPick: (model: PickedModel) => void;
}) {
	const { t } = useTranslation();
	const [params, setParams] = useLocalModelsParams();

	return (
		<StackedDialog
			className="sm:max-w-5xl"
			description={t("devices.form.modelBrowseDescription")}
			icon={<Smartphone />}
			onOpenChange={onOpenChange}
			open={open}
			title={t("devices.form.modelBrowseTitle")}
		>
			<ModelsBrowser
				footer={<AddModelPrompt onCreated={onPick} search={params.q} />}
				onSelect={(model) => onPick(toPicked(model))}
				params={params}
				setParams={setParams}
			/>
		</StackedDialog>
	);
}
