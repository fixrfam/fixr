"use client";

import { userJWT } from "@fixr/schemas/auth";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { z } from "zod";

type Session = z.infer<typeof userJWT> | null;

interface SessionContextValue {
	session: Session;
	refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(
	undefined
);

export const useSession = (): SessionContextValue => {
	const context = useContext(SessionContext);
	if (context === undefined) {
		throw new Error("useSession must be used within SessionProvider");
	}
	return context;
};

export const SessionProvider = ({
	children,
	session: initialSession,
}: {
	children: React.ReactNode;
	session?: Session;
}) => {
	const [session, setSession] = useState<Session>(initialSession ?? null);

	const refreshSession = useCallback(async () => {
		try {
			const res = await fetch("/api/auth/session");
			if (!res.ok) {
				return;
			}

			const data = await res.json();

			if (!data) {
				setSession(null);
				return;
			}

			const parsed = userJWT.parse(data);
			setSession(parsed);
		} catch (err) {
			console.error("Failed to fetch session", err);
		}
	}, []);

	useEffect(() => {
		if (!initialSession) {
			refreshSession();
		}
	}, [initialSession, refreshSession]);

	return (
		<SessionContext.Provider value={{ session, refreshSession }}>
			{children}
		</SessionContext.Provider>
	);
};
