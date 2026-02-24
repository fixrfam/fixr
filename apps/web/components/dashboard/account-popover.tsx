import type { userJWT } from "@fixr/schemas/auth";
import { Settings } from "lucide-react";
import { useParams } from "next/navigation";
import type { z } from "zod";
import { emailDisplayName } from "@/lib/auth/utils";
import { cn } from "@/lib/utils";
import { Avatar, type AvatarProps } from "../account/profile-avatar";
import { SignOutButton } from "../auth/signout-button";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { DashLink } from "./dash-link";

export function AccountPopover({
	session,
	showData,
	variant = "rounded",
	className,
}: {
	session: z.infer<typeof userJWT>;
	variant?: AvatarProps["variant"];
	className?: string;
	showData?: boolean;
}) {
	const displayName =
		session.displayName || emailDisplayName(session.email || "");
	const params = useParams<{ subdomain: string }>();

	return (
		<Popover>
			<PopoverTrigger asChild>
				<div
					className={cn(
						"flex min-w-0 cursor-pointer items-center gap-4",
						className
					)}
				>
					<Avatar
						className="size-9! hover:cursor-pointer"
						fallbackHash={session?.id ?? ""}
						src={session.avatarUrl}
						variant={variant}
					/>
					{showData && (
						<div className="flex min-w-0 flex-col">
							<p className="overflow-hidden truncate whitespace-nowrap font-medium text-sm">
								{displayName}
							</p>
							<p className="overflow-hidden truncate whitespace-nowrap text-muted-foreground text-xs">
								{session?.email}
							</p>
						</div>
					)}
				</div>
			</PopoverTrigger>
			<PopoverContent align="start" className="z-999 w-80 p-0" sideOffset={10}>
				<div className="flex gap-4 p-4">
					<DashLink
						className="cursor-pointer"
						href="/account"
						subdomain={params.subdomain}
					>
						<Avatar
							className="size-12 text-4xl"
							fallbackHash={session?.id ?? ""}
							src={session.avatarUrl}
							variant="square"
						/>
					</DashLink>
					<div className="flex min-w-0 flex-col space-y-1">
						<DashLink
							className="cursor-pointer space-y-1"
							href="/account"
							subdomain={params.subdomain}
						>
							<p className="truncate font-medium leading-5">{displayName}</p>
							<p className="truncate text-muted-foreground text-xs leading-none">
								{session?.email}
							</p>
						</DashLink>
						<div className="mt-3! grid w-full grid-cols-2 gap-2">
							<Button
								asChild
								className="h-7 w-full text-xs"
								size="sm"
								variant="outline"
							>
								<DashLink href="/account" subdomain={params.subdomain}>
									<Settings className="size-4" />
									Gerenciar
								</DashLink>
							</Button>
							<SignOutButton
								className="h-7 text-xs"
								size="icon"
								variant="outline"
							/>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
