"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { EmployeeRole } from "./abilities";
import { type Ability, createAbility } from "./accessor";
import type { Permission } from "./permissions";

type AbilityContextType = Ability & { isLoading: boolean };

const AbilityContext = createContext<AbilityContextType>({
	can: () => false,
	cannot: () => true,
	permissions: [],
	isLoading: true,
});

export function AbilityProvider({
	children,
	role,
}: {
	children: ReactNode;
	role: EmployeeRole;
}) {
	const ability = createAbility(role);
	return (
		<AbilityContext.Provider value={{ ...ability, isLoading: false }}>
			{children}
		</AbilityContext.Provider>
	);
}

export function useAbility(): AbilityContextType {
	return useContext(AbilityContext);
}

export function Can({
	permission,
	children,
	fallback = null,
}: {
	permission: Permission;
	children: ReactNode;
	fallback?: ReactNode;
}) {
	const { can } = useAbility();
	return can(permission) ? children : fallback;
}
