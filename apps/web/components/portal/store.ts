"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
	type PortalServiceOrderStatus,
	portalApi,
} from "@/lib/services/portal";

export const portalKeys = {
	all: ["portal"] as const,
	me: ["portal", "me"] as const,
	serviceOrders: ["portal", "service-orders"] as const,
	serviceOrder: (id: string) => ["portal", "service-orders", id] as const,
	estimates: ["portal", "estimates"] as const,
	estimate: (id: string) => ["portal", "estimates", id] as const,
};

export function usePortalMe() {
	return useQuery({
		queryKey: portalKeys.me,
		queryFn: portalApi.me,
		retry: false,
	});
}

export function usePortalServiceOrders() {
	return useQuery({
		queryKey: portalKeys.serviceOrders,
		queryFn: portalApi.serviceOrders,
		retry: false,
	});
}

export function usePortalServiceOrder(id: string) {
	return useQuery({
		queryKey: portalKeys.serviceOrder(id),
		queryFn: () => portalApi.serviceOrder(id),
		retry: false,
	});
}

export function usePortalEstimates() {
	return useQuery({
		queryKey: portalKeys.estimates,
		queryFn: portalApi.estimates,
		retry: false,
	});
}

export function usePortalEstimate(id: string) {
	return useQuery({
		queryKey: portalKeys.estimate(id),
		queryFn: () => portalApi.estimate(id),
		retry: false,
	});
}

/** Without a portal session (401), send the client to ask for a new link. */
export function useRedirectWithoutSession(error: unknown) {
	const router = useRouter();
	const unauthorized = isAxiosError(error) && error.response?.status === 401;

	useEffect(() => {
		if (unauthorized) {
			router.replace("/portal/access");
		}
	}, [unauthorized, router]);

	return unauthorized;
}

/** The lifecycle the client follows, in order. */
export const PORTAL_STEPS: PortalServiceOrderStatus[] = [
	"pending",
	"diagnosing",
	"waiting_approval",
	"approved",
	"fixing",
	"ready",
	"delivered",
];

const WHITESPACE = /\s+/;

export const firstName = (name: string | null | undefined) =>
	name?.trim().split(WHITESPACE)[0] ?? null;
