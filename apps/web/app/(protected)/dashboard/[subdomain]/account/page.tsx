import type { accountSchema } from "@fixr/schemas/account";
import type { ApiResponse } from "@fixr/schemas/utils";
import type { z } from "zod";
import { AvatarSection } from "@/components/account/avatar-section";
import { Settings } from "@/components/account/settings";
import { SignOutButton } from "@/components/auth/signout-button";
import { Heading } from "@/components/dashboard/heading";
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
				<AvatarSection account={content!} />
				<div className="w-full space-y-6">
					<Settings />
				</div>
			</div>
		</div>
	);
}
