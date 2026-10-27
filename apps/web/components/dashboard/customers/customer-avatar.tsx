"use client";

import { Avatar } from "@/components/account/profile-avatar";
import { cn } from "@/lib/utils";

/**
 * A customer's generated avatar. Seeded by the id, so it stays the same when
 * the name is edited and two customers with the same name still differ.
 */
export function CustomerAvatar({
	customer,
	className,
}: {
	customer: { id: string; name: string };
	className?: string;
}) {
	return (
		<Avatar
			aria-hidden
			className={cn("size-8 shrink-0", className)}
			fallbackHash={customer.id}
			fallbackType="beam"
			title={customer.name}
		/>
	);
}
