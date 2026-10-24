"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { EmployeeRole } from "@fixr/permissions";
import { Check, Minus } from "lucide-react";
import { Fragment, useMemo } from "react";
import {
	resourceLabel,
	scopeLabel,
} from "@/components/dashboard/api-keys/scope-labels";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { roleLabelKeys } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";
import {
	buildPermissionMatrix,
	COLUMN_ROLES,
	MATRIX_ROLES,
	permissionCount,
} from "./matrix";

function RoleCards({ currentRole }: { currentRole?: EmployeeRole }) {
	const { t } = useTranslation();

	return (
		<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{MATRIX_ROLES.map((role) => (
				<li
					className={cn(
						"flex flex-col gap-1 rounded-md border bg-background p-4",
						role === currentRole && "border-primary"
					)}
					key={role}
				>
					<div className="flex items-center justify-between gap-2">
						<span className="font-medium">{t(roleLabelKeys[role])}</span>
						{role === currentRole && (
							<Badge variant="secondary">
								{t("permissions.matrix.yourRole")}
							</Badge>
						)}
					</div>
					<p className="text-muted-foreground text-sm">
						{t(`permissions.roleDescriptions.${role}`)}
					</p>
					<span className="mt-auto pt-2 text-muted-foreground text-xs tabular-nums">
						{t("permissions.matrix.count", { count: permissionCount(role) })}
					</span>
				</li>
			))}
		</ul>
	);
}

/** Default permissions of every role: cards with a summary, then the full matrix. */
export function PermissionsMatrix({
	currentRole,
}: {
	/** The viewer's role, highlighted in the cards and the table. */
	currentRole?: EmployeeRole;
}) {
	const { t } = useTranslation();
	const groups = useMemo(() => buildPermissionMatrix(), []);

	return (
		<div className="flex flex-col gap-6">
			<RoleCards currentRole={currentRole} />
			<div className="rounded-md border bg-background">
				<Table className="text-sm">
					<TableHeader>
						<TableRow>
							<TableHead className="sticky left-0 z-10 min-w-40 bg-background">
								{t("permissions.matrix.permission")}
							</TableHead>
							{COLUMN_ROLES.map((role) => (
								<TableHead
									className={cn(
										"text-center",
										role === currentRole && "bg-primary/5 text-primary"
									)}
									key={role}
									scope="col"
								>
									{t(roleLabelKeys[role])}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{groups.map((group) => (
							<Fragment key={group.resource}>
								<TableRow className="bg-muted/50 hover:bg-muted/50">
									<TableCell
										className="sticky left-0 font-semibold"
										colSpan={COLUMN_ROLES.length + 1}
										scope="colgroup"
									>
										{resourceLabel(t, group.resource)}
									</TableCell>
								</TableRow>
								{group.rows.map((row) => (
									<TableRow key={row.permission}>
										<TableCell
											className="sticky left-0 z-10 bg-background pl-6"
											title={row.permission}
										>
											{scopeLabel(t, row.permission)}
										</TableCell>
										{COLUMN_ROLES.map((role) => {
											const allowed = row.roles.includes(role);
											return (
												<TableCell
													className={cn(
														"text-center",
														role === currentRole && "bg-primary/5"
													)}
													key={role}
												>
													{allowed ? (
														<Check
															aria-label={t("permissions.matrix.allowed")}
															className="mx-auto size-4 text-emerald-600 dark:text-emerald-400"
															role="img"
														/>
													) : (
														<Minus
															aria-label={t("permissions.matrix.notAllowed")}
															className="mx-auto size-4 text-muted-foreground/50"
															role="img"
														/>
													)}
												</TableCell>
											);
										})}
									</TableRow>
								))}
							</Fragment>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
