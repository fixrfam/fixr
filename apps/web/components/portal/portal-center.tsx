import type { ReactNode } from "react";
import { Logo } from "@/components/svg/logo";

/** A centered card on the portal's background, for the pages before signing in. */
export function PortalCenter({ children }: { children: ReactNode }) {
	return (
		<div className="relative flex min-h-dvh flex-col items-center justify-center bg-muted/30 px-4 py-10">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/15 to-transparent"
			/>
			<div className="relative w-full max-w-md">
				<Logo className="mx-auto mb-6 size-12" />
				<div className="rounded-3xl border bg-card p-6 shadow-black/5 shadow-xl sm:p-8">
					{children}
				</div>
			</div>
		</div>
	);
}
