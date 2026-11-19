"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { toast } from "@pheralb/toast";
import {
	ArrowLeft,
	Check,
	Crown,
	Network,
	Pencil,
	Trash2,
	UserMinus,
	UserPlus,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmployeeChip } from "@/components/dashboard/employees/employee-chip";
import { EmployeePicker } from "@/components/dashboard/employees/employee-picker";
import { Heading } from "@/components/dashboard/heading";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { ServiceOrderDetailsCard } from "@/components/dashboard/service-order/service-order-details-card";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { roleLabelKeys } from "@/lib/i18n/labels";
import type { DepartmentDetail } from "@/lib/services/departments";
import {
	useDeleteDepartment,
	useDepartment,
	useRemoveDepartmentMember,
	useUpdateDepartment,
} from "./store";

function RenameDepartment({ department }: { department: DepartmentDetail }) {
	const { t } = useTranslation();
	const update = useUpdateDepartment(department.id);
	const toastError = useApiErrorToast();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(department.name);

	if (!editing) {
		return (
			<Button onClick={() => setEditing(true)} size="sm" variant="ghost">
				<Pencil className="size-3.5" />
				{t("departments.detail.rename")}
			</Button>
		);
	}

	return (
		<form
			className="flex items-center gap-2"
			onSubmit={(e) => {
				e.preventDefault();
				update
					.mutateAsync({ name: name.trim() })
					.then(() => {
						toast.success({ text: t("departments.detail.renamed") });
						setEditing(false);
					})
					.catch(toastError);
			}}
		>
			<Input
				aria-label={t("departments.form.nameLabel")}
				autoFocus
				className="h-8 w-56"
				maxLength={80}
				onChange={(e) => setName(e.target.value)}
				value={name}
			/>
			<Button
				aria-label={t("common.actions.save")}
				disabled={!name.trim() || update.isPending}
				size="icon"
				type="submit"
				variant="ghost"
			>
				<Check className="size-3.5" />
			</Button>
			<Button
				aria-label={t("common.actions.cancel")}
				onClick={() => {
					setName(department.name);
					setEditing(false);
				}}
				size="icon"
				type="button"
				variant="ghost"
			>
				<X className="size-3.5" />
			</Button>
		</form>
	);
}

function DeleteDepartment({ department }: { department: DepartmentDetail }) {
	const { t } = useTranslation();
	const router = useRouter();
	const remove = useDeleteDepartment();
	const toastError = useApiErrorToast();

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="sm" variant="ghost">
					<Trash2 className="size-3.5" />
					{t("departments.detail.delete")}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("departments.detail.deleteTitle", { name: department.name })}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("departments.detail.deleteDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() =>
							remove
								.mutateAsync(department.id)
								.then(() => {
									toast.success({ text: t("departments.detail.deleted") });
									router.back();
								})
								.catch(toastError)
						}
					>
						{t("departments.detail.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

/** The department's leader, picked among its members (or nobody). */
function LeaderCard({
	department,
	canEdit,
}: {
	department: DepartmentDetail;
	canEdit: boolean;
}) {
	const { t } = useTranslation();
	const update = useUpdateDepartment(department.id);
	const toastError = useApiErrorToast();

	function setLeader(leaderId: string | null) {
		update
			.mutateAsync({ leaderId })
			.then(() =>
				toast.success({ text: t("departments.detail.leaderChanged") })
			)
			.catch(toastError);
	}

	let body = (
		<p className="text-muted-foreground text-sm">
			{t("departments.detail.noLeader")}
		</p>
	);
	if (canEdit) {
		body = (
			<div className="grid gap-2">
				<EmployeePicker
					disabled={update.isPending || department.members.length === 0}
					onChange={(employee) => setLeader(employee.id)}
					only={department.members.map((member) => member.id)}
					placeholder={t("departments.detail.noLeader")}
					value={department.leader}
				/>
				{department.leader && (
					<Button
						className="w-fit"
						disabled={update.isPending}
						onClick={() => setLeader(null)}
						size="sm"
						variant="ghost"
					>
						<X className="size-3.5" />
						{t("departments.detail.clearLeader")}
					</Button>
				)}
			</div>
		);
	} else if (department.leader) {
		body = <EmployeeChip employee={department.leader} />;
	}

	return (
		<ServiceOrderDetailsCard
			description={t("departments.detail.leaderDescription")}
			icon={Crown}
			title={t("departments.detail.leaderTitle")}
		>
			{body}
		</ServiceOrderDetailsCard>
	);
}

function MembersCard({
	department,
	canEdit,
	subdomain,
}: {
	department: DepartmentDetail;
	canEdit: boolean;
	subdomain: string;
}) {
	const { t, format } = useTranslation();
	const remove = useRemoveDepartmentMember(department.id);
	const toastError = useApiErrorToast();

	return (
		<ServiceOrderDetailsCard
			action={
				canEdit ? (
					<Button asChild size="sm" variant="ghost">
						<DashLink
							href={`/departments/${department.id}/members/new`}
							subdomain={subdomain}
						>
							<UserPlus className="size-3.5" />
							{t("departments.members.add")}
						</DashLink>
					</Button>
				) : undefined
			}
			description={t("departments.members.description")}
			icon={Network}
			title={t("departments.members.title", {
				count: department.members.length,
			})}
		>
			{department.members.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					{t("departments.members.empty")}
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("departments.members.headers.employee")}</TableHead>
							<TableHead>{t("departments.members.headers.role")}</TableHead>
							<TableHead>{t("departments.members.headers.addedAt")}</TableHead>
							{canEdit && <TableHead />}
						</TableRow>
					</TableHeader>
					<TableBody>
						{department.members.map((member) => (
							<TableRow key={member.id}>
								<TableCell>
									<span className="flex items-center gap-2">
										<EmployeeChip employee={member} />
										{department.leaderId === member.id && (
											<Badge variant="outline">
												<Crown />
												{t("departments.detail.leaderBadge")}
											</Badge>
										)}
									</span>
								</TableCell>
								<TableCell>{t(roleLabelKeys[member.role])}</TableCell>
								<TableCell className="text-xs">
									{format.date(member.addedAt)}
								</TableCell>
								{canEdit && (
									<TableCell className="text-right">
										<Button
											aria-label={t("departments.members.remove")}
											disabled={remove.isPending}
											onClick={() =>
												remove
													.mutateAsync(member.id)
													.then(() =>
														toast.success({
															text: t("departments.members.removed", {
																name: member.name,
															}),
														})
													)
													.catch(toastError)
											}
											size="icon"
											variant="ghost"
										>
											<UserMinus className="size-3.5" />
										</Button>
									</TableCell>
								)}
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</ServiceOrderDetailsCard>
	);
}

/** A department: its name, its leader and who is in it. */
export function DepartmentDetails({
	id,
	subdomain,
}: {
	id: string;
	subdomain: string;
}) {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const { data: department, isPending } = useDepartment(id);
	const canEdit = ability.can(permissions.departments.update);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3">
				<Button
					asChild
					className="-mt-3 w-fit -translate-x-2.5"
					size="sm"
					variant="ghost"
				>
					<DashLink href="/departments" subdomain={subdomain}>
						<ArrowLeft className="size-4" />
						{t("departments.detail.back")}
					</DashLink>
				</Button>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<Heading
						description={t("departments.detail.description")}
						title={department?.name ?? t("departments.detail.title")}
					/>
					{department && (
						<div className="flex flex-wrap items-center gap-1">
							{canEdit && <RenameDepartment department={department} />}
							{ability.can(permissions.departments.delete) && (
								<DeleteDepartment department={department} />
							)}
						</div>
					)}
				</div>
			</div>

			{isPending && <Skeleton className="h-64 w-full rounded-md" />}
			{!(isPending || department) && (
				<p className="text-muted-foreground text-sm">
					{t("departments.detail.notFound")}
				</p>
			)}
			{department && (
				<div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
					<LeaderCard canEdit={canEdit} department={department} />
					<MembersCard
						canEdit={canEdit}
						department={department}
						subdomain={subdomain}
					/>
				</div>
			)}
		</div>
	);
}
