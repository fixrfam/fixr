import { randomDelay } from "../async";

export interface DeviceOption {
	id: string;
	marca: string;
	categoria: string;
	modelo: string;
}

export const mockDevices: DeviceOption[] = [
	{
		id: "1001",
		marca: "Apple",
		categoria: "Smartphone",
		modelo: "iPhone 15 Pro",
	},
	{
		id: "1002",
		marca: "Apple",
		categoria: "Smartphone",
		modelo: "iPhone 15",
	},
	{
		id: "1003",
		marca: "Apple",
		categoria: "Smartphone",
		modelo: "iPhone 14 Pro",
	},
	{
		id: "1004",
		marca: "Apple",
		categoria: "Smartphone",
		modelo: "iPhone 12 Pro",
	},
	{
		id: "1005",
		marca: "Apple",
		categoria: "Smartphone",
		modelo: "iPhone 12",
	},

	{
		id: "1101",
		marca: "Apple",
		categoria: "Tablet",
		modelo: "iPad Air",
	},
	{
		id: "1102",
		marca: "Apple",
		categoria: "Tablet",
		modelo: "iPad Mini",
	},
	{
		id: "1201",
		marca: "Apple",
		categoria: "Notebook",
		modelo: "MacBook Air M2",
	},
	{
		id: "1202",
		marca: "Apple",
		categoria: "Notebook",
		modelo: "MacBook M2 Pro",
	},
	{
		id: "1203",
		marca: "Apple",
		categoria: "Notebook",
		modelo: "MacBook M3 Pro",
	},
	{
		id: "1204",
		marca: "Apple",
		categoria: "Notebook",
		modelo: "MacBook M4 Pro",
	},
	{
		id: "2001",
		marca: "Samsung",
		categoria: "Smartphone",
		modelo: "Galaxy S24",
	},
	{
		id: "2002",
		marca: "Samsung",
		categoria: "Smartphone",
		modelo: "Galaxy S24 Ultra",
	},
	{
		id: "2003",
		marca: "Samsung",
		categoria: "Smartphone",
		modelo: "Galaxy S25 Ultra",
	},
	{
		id: "2004",
		marca: "Samsung",
		categoria: "Smartphone",
		modelo: "Galaxy S26",
	},
	{
		id: "2005",
		marca: "Samsung",
		categoria: "Smartphone",
		modelo: "Galaxy A54",
	},
	{
		id: "2101",
		marca: "Samsung",
		categoria: "Tablet",
		modelo: "Galaxy Tab S10",
	},
	{
		id: "2102",
		marca: "Samsung",
		categoria: "Tablet",
		modelo: "Galaxy Tab S20",
	},
	{
		id: "2103",
		marca: "Samsung",
		categoria: "Tablet",
		modelo: "Galaxy Tab S9+",
	},
	{
		id: "2201",
		marca: "Samsung",
		categoria: "Notebook",
		modelo: "Galaxy Book Pro 360",
	},
	{
		id: "2202",
		marca: "Samsung",
		categoria: "Notebook",
		modelo: "Galaxy Book 2 Pro",
	},
	{
		id: "2203",
		marca: "Samsung",
		categoria: "Notebook",
		modelo: "Galaxy Book 4 Pro",
	},
	{
		id: "3001",
		marca: "Xiaomi",
		categoria: "Smartphone",
		modelo: "Redmi Note 13",
	},
	{
		id: "3002",
		marca: "Xiaomi",
		categoria: "Smartphone",
		modelo: "Mi 14",
	},
	{
		id: "3101",
		marca: "Xiaomi",
		categoria: "Tablet",
		modelo: "MiPad 14",
	},
	{
		id: "3102",
		marca: "Xiaomi",
		categoria: "Tablet",
		modelo: "MiPad 14 Pro",
	},
];

export async function getDevices(): Promise<DeviceOption[]> {
	await randomDelay(); // Simulate API delay
	return mockDevices;
}
