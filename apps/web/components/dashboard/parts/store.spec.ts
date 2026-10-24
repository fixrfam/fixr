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
	useInventory,
	usePartRows,
	useServiceRow,
	useSupplierRows,
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

describe("useInventory", () => {
	it("loads every page of the catalog", async () => {
		const parts = Array.from({ length: 150 }, (_, i) => ({
			...mockParts[0]!,
			id: `part-${i}`,
		}));
		serveInventory("fixr", {
			parts,
			services: [],
			suppliers: [...mockSuppliers],
		});

		const { result } = renderHook(() => useInventory(), { wrapper });

		expect(result.current.isPending).toBe(true);
		await waitFor(() => expect(result.current.isPending).toBe(false));
		expect(result.current.parts).toHaveLength(150);
	});
});

describe("catalog access by role", () => {
	it("skips the suppliers for a technician and keeps the embedded name", async () => {
		const part = mockParts[0]!;
		const { reads } = serveInventory("fixr", {
			parts: [{ ...part, supplier: { id: part.supplierId, name: "Embedded" } }],
			services: [],
			suppliers: [...mockSuppliers],
		});

		const { result } = renderHook(() => usePartRows(), {
			wrapper: wrapperFor("technician"),
		});

		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0]?.supplier?.name).toBe("Embedded");
		expect(reads).not.toContain("/companies/fixr/suppliers");
	});
});

describe("row hooks", () => {
	it("links parts to their supplier and services", async () => {
		serveInventory();
		const part = mockParts[0]!;

		const { result } = renderHook(() => usePartRows(), { wrapper });

		await waitFor(() => expect(result.current).toHaveLength(mockParts.length));
		const row = result.current.find((r) => r.id === part.id)!;
		expect(row.supplier?.id).toBe(part.supplierId);
		expect(row.services.map((s) => s.id)).toEqual(
			mockServices.filter((s) => s.partIds.includes(part.id)).map((s) => s.id)
		);
	});

	it("finds a service row by id", async () => {
		serveInventory();
		const service = mockServices[0]!;

		const { result } = renderHook(() => useServiceRow(service.id), {
			wrapper,
		});

		await waitFor(() => expect(result.current?.id).toBe(service.id));
		expect(result.current?.parts.map((p) => p.id)).toEqual(
			service.partIds.filter((id) => mockParts.some((p) => p.id === id))
		);
	});

	it("counts the parts of each supplier", async () => {
		serveInventory();
		const supplier = mockSuppliers[0]!;

		const { result } = renderHook(() => useSupplierRows(), { wrapper });

		await waitFor(() =>
			expect(result.current).toHaveLength(mockSuppliers.length)
		);
		const row = result.current.find((r) => r.id === supplier.id)!;
		expect(row.parts).toHaveLength(
			mockParts.filter((p) => p.supplierId === supplier.id).length
		);
	});
});

describe("mutations", () => {
	it("creates a part through the API and refreshes the catalog", async () => {
		const { writes } = serveInventory();
		const { result } = renderHook(
			() => ({ inventory: useInventory(), create: useCreatePart() }),
			{ wrapper }
		);
		await waitFor(() => expect(result.current.inventory.isPending).toBe(false));

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
			expect(result.current.inventory.parts).toHaveLength(mockParts.length + 1)
		);
	});
});
