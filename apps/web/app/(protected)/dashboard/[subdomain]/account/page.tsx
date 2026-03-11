import { roleLabels } from "@fixr/constants/roles";
import type { accountSchema } from "@fixr/schemas/account";
import type { employeeRoles } from "@fixr/schemas/roles";
import type { ApiResponse } from "@fixr/schemas/utils";
import { BriefcaseBusiness, Building2 } from "lucide-react";
import type { z } from "zod";
import { Avatar } from "@/components/account/profile-avatar";
import { Settings } from "@/components/account/settings";
import { SignOutButton } from "@/components/auth/signout-button";
import { Heading } from "@/components/dashboard/heading";
import { Separator } from "@/components/ui/separator";
import { axios } from "@/lib/auth/axios";

export default async function ServerPage() {
	const res =
		await axios.get<ApiResponse<z.infer<typeof accountSchema>>>("/account");

	const content = res.data.data;

	return (
		<div className="flex w-full flex-col items-center space-y-10">
			<div className="flex w-full items-center justify-between">
				<Heading
					description="Gerencie as configurações da sua conta."
					title="Perfil"
				/>
				<div className="flex items-center gap-2">
					<SignOutButton variant={"outline"}>Sair</SignOutButton>
				</div>
			</div>
			<div className="flex w-full flex-col gap-10 lg:flex-row">
				<div className="w-full space-y-4 lg:max-w-[20rem]">
					<Avatar
						className="size-32 text-4xl"
						fallbackHash={content?.id as string}
						src={content?.avatarUrl}
					/>
					<div className="space-y-5">
						<div>
							<h2
								className={`w-full truncate text-3xl tracking-tight ${content?.displayName && "font-semibold"}`}
							>
								{content?.displayName ?? "Sem nome de exibição"}
							</h2>
							<p className="text-muted-foreground">{content?.email}</p>
						</div>
						<Separator className="my-8" />
						<div>
							<p className="mb-4 font-semibold text-muted-foreground text-xs uppercase">
								Info
							</p>
							<div className="flex flex-col gap-2">
								<div className="inline-flex items-center gap-2 tracking-tight">
									<div className="rounded-md bg-primary/30 p-1 text-primary">
										<Building2 className="size-5" />
									</div>
									{content?.company?.name}
								</div>
								<div className="inline-flex items-center gap-2 tracking-tight">
									<div className="rounded-md bg-primary/30 p-1 text-primary">
										<BriefcaseBusiness className="size-5" />
									</div>
									{
										roleLabels[
											content?.company?.role as z.infer<typeof employeeRoles>
										]
									}
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="w-full space-y-6">
					<Settings />
				</div>
			</div>
		</div>
	);
}
