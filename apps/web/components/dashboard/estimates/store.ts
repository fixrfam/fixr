"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { type EstimatesQuery, estimatesApi } from "@/lib/services/estimates";
import { estimatesKey } from "./use-estimate-actions";

export function useEstimatesPage(query: EstimatesQuery) {
	const { subdomain } = useParams<{ subdomain: string }>();
	return useQuery({
		queryKey: [...estimatesKey(subdomain), "list", query],
		queryFn: () => estimatesApi.list(subdomain, query),
		placeholderData: keepPreviousData,
	});
}

export function useEstimate(id: string) {
	const { subdomain } = useParams<{ subdomain: string }>();
	return useQuery({
		queryKey: [...estimatesKey(subdomain), "detail", id],
		queryFn: () => estimatesApi.get(subdomain, id),
		enabled: Boolean(id),
		retry: false,
	});
}

/** The rendered PDF as a blob URL, revoked when it changes or unmounts. */
export function useEstimatePdf(id: string, updatedAt?: string) {
	const { subdomain } = useParams<{ subdomain: string }>();
	return useQuery({
		// The PDF follows the estimate: a new version re-renders it.
		queryKey: [...estimatesKey(subdomain), "pdf", id, updatedAt],
		queryFn: () => estimatesApi.pdfUrl(subdomain, id),
		enabled: Boolean(id && updatedAt),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: 0,
		retry: false,
	});
}

/** `#0042`: how estimates are numbered across the app and the PDF. */
export function formatEstimateNumber(number: number) {
	return `#${String(number).padStart(4, "0")}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from today until the date (negative once it has passed). */
export function daysUntil(date: string, now = new Date()) {
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	// Same local day the date is printed with.
	const end = new Date(date);
	const day = new Date(end.getFullYear(), end.getMonth(), end.getDate());
	return Math.round((day.getTime() - start.getTime()) / DAY_MS);
}
