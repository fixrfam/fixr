import { useEffect, useState } from "react";
import type { CardId } from "./constants";
import type { LayoutState } from "./layout-state";
import { defaultLayout, normalizeLayout } from "./layout-state";

/**
 * Persists the user's resizable panel layout to localStorage.
 *
 * On mount the saved layout is read and normalised so it stays valid even
 * when the available cards change. Every subsequent change is written back
 * to localStorage so the arrangement survives page reloads.
 */
export function useResizableLayout(storageKey: string, available: Set<CardId>) {
	const [layout, setLayout] = useState<LayoutState>(() =>
		normalizeLayout(defaultLayout, available)
	);

	useEffect(() => {
		const stored = localStorage.getItem(storageKey);
		if (!stored) {
			return;
		}
		try {
			const parsed = JSON.parse(stored) as LayoutState;
			setLayout(normalizeLayout(parsed, available));
		} catch {
			setLayout(normalizeLayout(defaultLayout, available));
		}
	}, [storageKey, available]);

	useEffect(() => {
		localStorage.setItem(storageKey, JSON.stringify(layout));
	}, [layout, storageKey]);

	return [layout, setLayout] as const;
}
