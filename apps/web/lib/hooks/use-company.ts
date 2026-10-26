"use client";

import { useQuery } from "@tanstack/react-query";
import { companyQueryKey, getCompany } from "@/lib/services/company";

/**
 * The company's profile. Prefer it over the session for anything editable
 * (name, logo): the session token keeps the values from sign in, while this
 * query is refreshed whenever the settings page saves.
 */
export function useCompany(subdomain: string | undefined) {
	return useQuery({
		queryKey: companyQueryKey(subdomain ?? ""),
		queryFn: () => getCompany(subdomain as string),
		staleTime: 5 * 60 * 1000,
		enabled: Boolean(subdomain),
	});
}
