import { mockParts, mockServices, mockSuppliers } from "@fixr/mock";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
	usePartRows,
	usePartsStore,
	useServiceRow,
	useSupplierRows,
} from "./store";

const initialState = usePartsStore.getState();

beforeEach(() => {
	usePartsStore.setState(initialState, true);
});

const newPart = {
	sku: "NEW-1",
	name: "New part",
	category: "Baterias" as const,
	costPrice: 1,
	salePrice: 2,
	stock: 0,
	minStock: 1,
	supplierId: mockSuppliers[0]!.id,
};

describe("usePartsStore", () => {
	it("starts from the mocks", () => {
		const state = usePartsStore.getState();

		expect(state.parts).toBe(mockParts);
		expect(state.services).toBe(mockServices);
		expect(state.suppliers).toBe(mockSuppliers);
	});

	it("adds a part with a fresh id", () => {
		usePartsStore.getState().addPart(newPart);
		usePartsStore.getState().addPart(newPart);

		const added = usePartsStore.getState().parts.slice(-2);
		expect(added).toHaveLength(2);
		expect(added[0]).toMatchObject(newPart);
		expect(added[0]!.id).toBeTruthy();
		expect(added[0]!.id).not.toBe(added[1]!.id);
	});

	it("updates only the targeted part and keeps its id", () => {
		const target = mockParts[0]!;
		const untouched = mockParts[1]!;

		usePartsStore.getState().updatePart(target.id, newPart);

		const { parts } = usePartsStore.getState();
		expect(parts.find((p) => p.id === target.id)).toEqual({
			...newPart,
			id: target.id,
		});
		expect(parts.find((p) => p.id === untouched.id)).toBe(untouched);
		expect(parts).toHaveLength(mockParts.length);
	});

	it("adds and updates services", () => {
		const { id: _id, ...service } = mockServices[0]!;

		usePartsStore.getState().addService({ ...service, name: "Added" });
		usePartsStore
			.getState()
			.updateService(mockServices[1]!.id, { ...service, name: "Edited" });

		const { services } = usePartsStore.getState();
		expect(services.at(-1)?.name).toBe("Added");
		expect(services.find((s) => s.id === mockServices[1]!.id)?.name).toBe(
			"Edited"
		);
	});

	it("adds a supplier", () => {
		const { id: _id, ...supplier } = mockSuppliers[0]!;

		usePartsStore.getState().addSupplier({ ...supplier, name: "Nova" });

		expect(usePartsStore.getState().suppliers.at(-1)?.name).toBe("Nova");
	});
});

describe("row hooks", () => {
	it("recompute rows when the store changes", () => {
		const { result } = renderHook(() => usePartRows());
		const before = result.current.length;

		act(() => usePartsStore.getState().addPart(newPart));

		expect(result.current).toHaveLength(before + 1);
		expect(result.current.at(-1)).toMatchObject({
			sku: "NEW-1",
			stockStatus: "out_of_stock",
			supplier: mockSuppliers[0],
		});
	});

	it("link a new part to its supplier's row", () => {
		const { result } = renderHook(() => useSupplierRows());

		act(() => usePartsStore.getState().addPart(newPart));

		const supplierRow = result.current.find(
			(row) => row.id === newPart.supplierId
		);
		expect(supplierRow?.parts.map((p) => p.sku)).toContain("NEW-1");
	});

	it("find a single service, or null", () => {
		const { result: found } = renderHook(() =>
			useServiceRow(mockServices[0]!.id)
		);
		const { result: missing } = renderHook(() => useServiceRow("nope"));

		expect(found.current?.name).toBe(mockServices[0]!.name);
		expect(missing.current).toBeNull();
	});
});
