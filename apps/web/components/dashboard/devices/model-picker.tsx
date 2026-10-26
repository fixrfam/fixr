"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useModelsPage } from "@/components/dashboard/models/store";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MODEL_PICKER_SIZE = 20;

export interface PickedModel {
	id: string;
	name: string;
	maker: string;
}

/** Search the device catalog (shared and company models) and pick a model. */
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
	const [search, setSearch] = useState("");
	const query = useModelsPage({
		page: 1,
		perPage: MODEL_PICKER_SIZE,
		query: search.trim(),
		sort: "newer",
	});
	const models = query.data?.records ?? [];

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className="w-full justify-between font-normal"
					id={id}
					role="combobox"
					type="button"
					variant="outline"
				>
					<span className={cn("truncate", !value && "text-muted-foreground")}>
						{value ? value.name : t("devices.form.modelPlaceholder")}
					</span>
					<ChevronsUpDown className="size-3.5 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-(--radix-popover-trigger-width) p-0"
			>
				<Command shouldFilter={false}>
					<CommandInput
						onValueChange={setSearch}
						placeholder={t("devices.form.modelPlaceholder")}
						value={search}
					/>
					<CommandList>
						{!query.isFetching && (
							<CommandEmpty>{t("devices.form.modelEmpty")}</CommandEmpty>
						)}
						<CommandGroup>
							{models.map((model) => (
								<CommandItem
									key={model.id}
									onSelect={() => {
										onChange({
											id: model.id,
											name: model.name,
											maker: model.maker.name,
										});
										setOpen(false);
									}}
									value={model.id}
								>
									<Check
										className={cn(
											"size-3.5",
											value?.id === model.id ? "opacity-100" : "opacity-0"
										)}
									/>
									<span className="truncate">{model.name}</span>
									<span className="ml-auto text-muted-foreground text-xs">
										{model.maker.name}
									</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
