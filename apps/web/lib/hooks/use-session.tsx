"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { userJWT } from "@fixr/schemas/auth";
import { z } from "zod";

type Session = z.infer<typeof userJWT> | null;

const SessionContext = createContext<Session | undefined>(undefined);

export const useSession = (): Session => {
    const context = useContext(SessionContext);
    if (context === undefined) throw new Error("useSession must be used within SessionProvider");
    return context;
};

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session>(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch("/api/auth/session");
                if (!res.ok) return;

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
        };

        fetchSession();
    }, []);

    return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
};
