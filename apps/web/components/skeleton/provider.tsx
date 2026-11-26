"use client";

import { SkulletProvider } from "skullet/react";

/**
 * How every skeleton in the app looks and arrives. Colours come from
 * `--skullet-base` and `--skullet-highlight` in `globals.css`, so they follow
 * the theme toggle instead of the system preference.
 */
export function SkeletonProvider({ children }: { children: React.ReactNode }) {
	return (
		<SkulletProvider
			reveal="smart"
			theme={{ animation: "shimmer", speed: "slow", radius: "0.375rem" }}
		>
			{children}
		</SkulletProvider>
	);
}
