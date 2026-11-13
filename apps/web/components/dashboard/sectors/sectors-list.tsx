"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { toast } from "@pheralb/toast";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sector } from "@/lib/services/sectors";
import {
	useCreateSector,
	useDeleteSector,
	useRenameSector,
	useSectors,
} from "./store";

function DeleteSector({ sector }: { sector: Sector }) {
	const { t } = useTranslation();
	const remove = useDeleteSector();
	const toastError = useApiErrorToast();

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					aria-label={t("sectors.list.remove")}
					size="icon"
					variant="ghost"
				>
					<Trash2 className="size-3.5" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("sectors.list.removeTitle", { name: sector.name })}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("sectors.list.removeDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() =>
							remove
								.mutateAsync(sector.id)
								.then(() => toast.success({ text: t("sectors.list.removed") }))
								.catch(toastError)
						}
					>
						{t("sectors.list.remove")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function SectorRow({ sector }: { sector: Sector }) {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const rename = useRenameSector();
	const toastError = useApiErrorToast();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(sector.name);

	async function save() {
		try {
			await rename.mutateAsync({ id: sector.id, name: name.trim() });
			toast.success({ text: t("sectors.list.renamed") });
			setEditing(false);
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<li className="flex items-center justify-between gap-3 py-2.5">
			{editing ? (
				<form
					className="flex flex-1 items-center gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						save();
					}}
				>
					<Input
						aria-label={t("sectors.list.rename")}
						autoFocus
						maxLength={80}
						onChange={(e) => setName(e.target.value)}
						value={name}
					/>
					<Button
						aria-label={t("common.actions.save")}
						disabled={!name.trim() || rename.isPending}
						size="icon"
						type="submit"
						variant="ghost"
					>
						<Check className="size-3.5" />
					</Button>
					<Button
						aria-label={t("common.actions.cancel")}
						onClick={() => {
							setName(sector.name);
							setEditing(false);
						}}
						size="icon"
						type="button"
						variant="ghost"
					>
						<X className="size-3.5" />
					</Button>
				</form>
			) : (
				<div className="min-w-0">
					<p className="truncate font-medium text-sm">{sector.name}</p>
					<p className="truncate text-muted-foreground text-xs">
						{sector.employees.length === 0
							? t("sectors.list.noEmployees")
							: sector.employees.map((employee) => employee.name).join(", ")}
					</p>
				</div>
			)}
			{!editing && (
				<div className="flex shrink-0 items-center">
					{ability.can(permissions.sectors.update) && (
						<Button
							aria-label={t("sectors.list.rename")}
							onClick={() => setEditing(true)}
							size="icon"
							variant="ghost"
						>
							<Pencil className="size-3.5" />
						</Button>
					)}
					{ability.can(permissions.sectors.delete) && (
						<DeleteSector sector={sector} />
					)}
				</div>
			)}
		</li>
	);
}

/** The company's sectors with who is in each one; managers create and rename them. */
export function SectorsList() {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const { data: sectors, isPending } = useSectors();
	const create = useCreateSector();
	const toastError = useApiErrorToast();
	const [name, setName] = useState("");

	async function submit() {
		try {
			await create.mutateAsync(name.trim());
			toast.success({ text: t("sectors.list.created") });
			setName("");
		} catch (error) {
			toastError(error);
		}
	}

	if (isPending) {
		return <Skeleton className="h-40 w-full rounded-md" />;
	}

	return (
		<div className="space-y-3">
			{ability.can(permissions.sectors.create) && (
				<form
					className="flex items-center gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						submit();
					}}
				>
					<Input
						maxLength={80}
						onChange={(e) => setName(e.target.value)}
						placeholder={t("sectors.list.newPlaceholder")}
						value={name}
					/>
					<Button
						className="shrink-0"
						disabled={!name.trim() || create.isPending}
						type="submit"
					>
						{t("sectors.list.create")} <Plus className="size-3.5" />
					</Button>
				</form>
			)}
			{sectors?.length ? (
				<ul className="divide-y">
					{sectors.map((sector) => (
						<SectorRow key={sector.id} sector={sector} />
					))}
				</ul>
			) : (
				<p className="text-muted-foreground text-sm">
					{t("sectors.list.empty")}
				</p>
			)}
		</div>
	);
}
