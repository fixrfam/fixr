"use client";

import {
	mockParts,
	mockServices,
	mockSuppliers,
	type PartRow,
	type ServiceRow,
	type SupplierRow,
} from "@fixr/mock";
import { nanoid } from "nanoid";
import { useMemo } from "react";
import { create } from "zustand";
import {
	buildPartRows,
	buildServiceRows,
	buildSupplierRows,
	type PartsData,
} from "./table/data";

interface PartsStore extends PartsData {
	addPart: (part: Omit<PartRow, "id">) => void;
	updatePart: (id: string, part: Omit<PartRow, "id">) => void;
	addService: (service: Omit<ServiceRow, "id">) => void;
	updateService: (id: string, service: Omit<ServiceRow, "id">) => void;
	addSupplier: (supplier: Omit<SupplierRow, "id">) => void;
}

/**
 * In-memory stand-in for the parts/services/suppliers API: starts from the
 * mocks and keeps what the forms create or edit until the page is reloaded.
 */
//TODO: trocar por chamadas em lib/services quando as rotas da API existirem
export const usePartsStore = create<PartsStore>((set) => ({
	parts: mockParts,
	services: mockServices,
	suppliers: mockSuppliers,
	addPart: (part) =>
		set((state) => ({ parts: [...state.parts, { ...part, id: nanoid() }] })),
	updatePart: (id, part) =>
		set((state) => ({
			parts: state.parts.map((p) => (p.id === id ? { ...part, id } : p)),
		})),
	addService: (service) =>
		set((state) => ({
			services: [...state.services, { ...service, id: nanoid() }],
		})),
	updateService: (id, service) =>
		set((state) => ({
			services: state.services.map((s) =>
				s.id === id ? { ...service, id } : s
			),
		})),
	addSupplier: (supplier) =>
		set((state) => ({
			suppliers: [...state.suppliers, { ...supplier, id: nanoid() }],
		})),
}));

function usePartsData(): PartsData {
	const parts = usePartsStore((state) => state.parts);
	const services = usePartsStore((state) => state.services);
	const suppliers = usePartsStore((state) => state.suppliers);

	return useMemo(
		() => ({ parts, services, suppliers }),
		[parts, services, suppliers]
	);
}

export function usePartRows() {
	const data = usePartsData();
	return useMemo(() => buildPartRows(data), [data]);
}

export function useServiceRows() {
	const data = usePartsData();
	return useMemo(() => buildServiceRows(data), [data]);
}

export function useSupplierRows() {
	const data = usePartsData();
	return useMemo(() => buildSupplierRows(data), [data]);
}

export function useServiceRow(id: string) {
	const rows = useServiceRows();
	return useMemo(() => rows.find((row) => row.id === id) ?? null, [rows, id]);
}
