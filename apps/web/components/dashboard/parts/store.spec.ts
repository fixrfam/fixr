import { mockParts, mockServices, mockSuppliers } from "@fixr/mock";
import type { EmployeeRole } from "@fixr/permissions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { SessionProvider } from "@/lib/hooks/use-session";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import "@/test/mocks";
import { serveInventory } from "@/test/msw/inventory";
import { employeeSession } from "@/test/session";
import {
	useCreatePart,
	usePartsPage,
	useServiceRow,
	useSupplierPartCounts,
	useSuppliersPage,
} from "./store";

function wrapperFor(role: EmployeeRole) {
	return function Wrapper({ children }: { children: ReactNode }) {
		const client = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		return createElement(
			QueryClientProvider,
			{ client },
			createElement(SessionProvider, {
				children,
				session: employeeSession(role),
			})
		);
	};
}

const wrapper = wrapperFor("admin");

beforeEach(() => {
	setSessionCookie(fakeJwt());
});

describe("usePartsPage", () => {
	it("asks the API for one page with the search, filters and order", async () => {
		const { listQueries } = serveInventory();
		const supplierId = mockParts[0]!.supplierId;

		const { result } = renderHook(
			() =>
				usePartsPage({
					page: 1,
					perPage: 5,
					query: "",
					sort: "name",
					supplierId,
					lowStock: false,
				}),
			{ wrapper }
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		// Empty and false values stay out of the query string.
		expect(listQueries).toEqual([
			{
				path: "/companies/fixr/parts",
				params: { page: "1", perPage: "5", sort: "name", supplierId },
			},
		]);
		expect(result.current.data?.records.map((p) => p.id)).toEqual(
			mockParts
				.filter((p) => p.supplierId === supplierId)
				.sort((a, b) => a.name.localeCompare(b.name))
				.slice(0, 5)
				.map((p) => p.id)
		);
	});

	it("sends the low stock flag only when it is on", async () => {
		const { listQueries } = serveInventory();

		renderHook(() => usePartsPage({ page: 2, perPage: 10, lowStock: true }), {
			wrapper,
		});

		await waitFor(() => expect(listQueries).toHaveLength(1));
		expect(listQueries[0]?.params).toEqual({
			page: "2",
			perPage: "10",
			lowStock: "true",
		});
	});
});

describe("catalog access by role", () => {
	it("never lists suppliers for a technician", async () => {
		const { reads } = serveInventory();

		const { result } = renderHook(
			() => ({
				parts: usePartsPage({ page: 1, perPage: 10 }),
				suppliers: useSuppliersPage({ page: 1, perPage: 10 }),
			}),
			{ wrapper: wrapperFor("technician") }
		);

		await waitFor(() => expect(result.current.parts.isSuccess).toBe(true));
		// Parts embed the supplier name, so the list still shows it.
		expect(result.current.parts.data?.records[0]?.supplier?.name).toBeTruthy();
		expect(reads).not.toContain("/companies/fixr/suppliers");
	});
});

describe("useSuppliersPage", () => {
	it("searches a typed CNPJ by its digits, as the API stores it", async () => {
		const { listQueries } = serveInventory();

		renderHook(
			() => useSuppliersPage({ page: 1, perPage: 10, query: "12.345.678/" }),
			{ wrapper }
		);

		await waitFor(() => expect(listQueries).toHaveLength(1));
		expect(listQueries[0]?.params.query).toBe("12345678");
	});
});

describe("useServiceRow", () => {
	it("loads the service and resolves its parts by id", async () => {
		serveInventory();
		const service = mockServices.find((s) => s.partIds.length > 0)!;

		const { result } = renderHook(() => useServiceRow(service.id), {
			wrapper,
		});

		await waitFor(() => expect(result.current.isPending).toBe(false));
		expect(result.current.service?.id).toBe(service.id);
		expect(result.current.service?.parts.map((p) => p.id)).toEqual(
			service.partIds.filter((id) => mockParts.some((p) => p.id === id))
		);
	});

	it("settles without a part that no longer exists", async () => {
		const service = {
			...mockServices[0]!,
			partIds: [mockParts[0]!.id, "gone"],
		};
		serveInventory("fixr", {
			parts: [...mockParts],
			services: [service],
			suppliers: [...mockSuppliers],
		});

		const { result } = renderHook(() => useServiceRow(service.id), {
			wrapper,
		});

		await waitFor(() => expect(result.current.isPending).toBe(false));
		expect(result.current.service?.parts.map((p) => p.id)).toEqual([
			mockParts[0]!.id,
		]);
	});

	it("is not found for an unknown id", async () => {
		serveInventory();

		const { result } = renderHook(() => useServiceRow("missing"), {
			wrapper,
		});

		await waitFor(() => expect(result.current.isPending).toBe(false));
		expect(result.current.service).toBeNull();
	});
});

describe("useSupplierPartCounts", () => {
	it("counts the parts of each supplier from the list total", async () => {
		serveInventory();
		const ids = mockSuppliers.slice(0, 2).map((s) => s.id);

		const { result } = renderHook(() => useSupplierPartCounts(ids), {
			wrapper,
		});

		await waitFor(() =>
			expect(ids.every((id) => result.current.get(id) !== undefined)).toBe(true)
		);
		for (const id of ids) {
			expect(result.current.get(id)).toBe(
				mockParts.filter((p) => p.supplierId === id).length
			);
		}
	});
});

describe("mutations", () => {
	it("creates a part through the API and refreshes the lists", async () => {
		const { writes } = serveInventory();
		const { result } = renderHook(
			() => ({
				page: usePartsPage({ page: 1, perPage: 100 }),
				create: useCreatePart(),
			}),
			{ wrapper }
		);
		await waitFor(() => expect(result.current.page.isSuccess).toBe(true));

		await act(() =>
			result.current.create.mutateAsync({
				sku: "NEW-1",
				name: "New part",
				category: "Baterias",
				costPrice: 1,
				salePrice: 2,
				stock: 0,
				minStock: 1,
				supplierId: mockSuppliers[0]!.id,
			})
		);

		expect(writes).toEqual([
			expect.objectContaining({
				method: "POST",
				path: "/companies/fixr/parts",
			}),
		]);
		await waitFor(() =>
			expect(result.current.page.data?.pagination.total_records).toBe(
				mockParts.length + 1
			)
		);
	});
});
