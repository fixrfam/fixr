import type { ModelDetail, ModelMeta } from "@fixr/schemas/models";
import {
	Battery,
	Calendar,
	Camera,
	Cpu,
	HardDrive,
	type LucideIcon,
	MonitorSmartphone,
	Radio,
	Ruler,
	ScanFace,
	Sparkles,
	Tag,
	Wifi,
} from "lucide-react";
import { formatNumber, formatPartialDate } from "./format";

export type SpecSectionKey =
	| "display"
	| "platform"
	| "memory"
	| "mainCamera"
	| "selfieCamera"
	| "battery"
	| "body"
	| "network"
	| "connectivity"
	| "features"
	| "launch"
	| "misc";

export type SpecFieldKey =
	| "displayType"
	| "displaySize"
	| "displayResolution"
	| "displaySizeRatio"
	| "displayResPpi"
	| "displayProtection"
	| "refreshRate"
	| "panelType"
	| "backlight"
	| "brightness"
	| "staticContrast"
	| "dynamicContrast"
	| "colorGamut"
	| "viewingAngles"
	| "os"
	| "chipset"
	| "cpu"
	| "gpu"
	| "internalMemory"
	| "cardSlot"
	| "camera"
	| "cameraFeatures"
	| "cameraVideo"
	| "battery"
	| "batteryCharging"
	| "dimensions"
	| "weight"
	| "build"
	| "sim"
	| "networkTech"
	| "network2g"
	| "network3g"
	| "network4g"
	| "network5g"
	| "networkSpeed"
	| "wlan"
	| "bluetooth"
	| "gps"
	| "nfc"
	| "radio"
	| "usb"
	| "sensors"
	| "announced"
	| "released"
	| "status"
	| "modelsText"
	| "price";

export interface SpecRow {
	field: SpecFieldKey;
	value: string;
}

export interface SpecSection {
	key: SpecSectionKey;
	icon: LucideIcon;
	rows: SpecRow[];
}

type Value = string | number | null | undefined;

/**
 * Groups every spec a model has into sections, in reading order. Empty rows
 * and sections are left out, so a monitor doesn't show camera headings.
 */
export function buildSpecSections(
	model: ModelDetail,
	meta: ModelMeta,
	{
		locale,
		statusLabel,
	}: { locale: string; statusLabel: (status: string) => string }
): SpecSection[] {
	const number = (value: number | null, unit: string) =>
		value == null ? null : `${formatNumber(value, locale)} ${unit}`;

	const section = (
		key: SpecSectionKey,
		icon: LucideIcon,
		fields: [SpecFieldKey, Value][]
	): SpecSection => ({
		key,
		icon,
		rows: fields
			.filter(([, value]) => value != null && value !== "")
			.map(([field, value]) => ({ field, value: String(value) })),
	});

	const sections = [
		section("display", MonitorSmartphone, [
			["displayType", model.displayType],
			["panelType", meta.panelType],
			["displaySize", model.displaySize],
			["displayResolution", model.displayResolution],
			["displaySizeRatio", model.displaySizeRatio],
			["displayResPpi", number(model.displayResPpi, "ppi")],
			["refreshRate", meta.refreshRate],
			["brightness", meta.brightness],
			["backlight", meta.backlight],
			["staticContrast", meta.staticContrast],
			["dynamicContrast", meta.dynamicContrast],
			["colorGamut", meta.colorGamut],
			["viewingAngles", meta.viewingAngles],
			["displayProtection", model.displayProtection],
		]),
		section("platform", Cpu, [
			["os", model.os],
			["chipset", model.chipset],
			["cpu", model.cpu],
			["gpu", model.gpu],
		]),
		section("memory", HardDrive, [
			["internalMemory", model.internalMemory],
			["cardSlot", model.cardSlot],
		]),
		section("mainCamera", Camera, [
			["camera", model.mainCamera],
			["cameraFeatures", model.mainCameraFeatures],
			["cameraVideo", model.mainCameraVideo],
		]),
		section("selfieCamera", ScanFace, [
			["camera", model.selfieCamera],
			["cameraFeatures", model.selfieFeatures],
			["cameraVideo", model.selfieVideo],
		]),
		section("battery", Battery, [
			["battery", model.battery],
			["batteryCharging", model.batteryCharging],
		]),
		section("body", Ruler, [
			["dimensions", model.dimensions],
			["weight", model.weight ?? number(model.weightGrams, "g")],
			["build", model.build],
			["sim", model.sim],
		]),
		section("network", Radio, [
			["networkTech", model.networkTech],
			["network2g", meta.network2g],
			["network3g", meta.network3g],
			["network4g", meta.network4g],
			["network5g", meta.network5g],
			["networkSpeed", meta.networkSpeed],
		]),
		section("connectivity", Wifi, [
			["wlan", meta.wlan],
			["bluetooth", meta.bluetooth],
			["gps", meta.gps],
			["nfc", meta.nfc],
			["usb", meta.usb],
			["radio", meta.radio],
		]),
		section("features", Sparkles, [["sensors", model.sensors]]),
		section("launch", Calendar, [
			["announced", formatPartialDate(model.announced, locale)],
			["released", formatPartialDate(model.released, locale)],
			["status", model.status ? statusLabel(model.status) : null],
		]),
		section("misc", Tag, [
			["modelsText", model.modelsText],
			["price", model.price],
		]),
	];

	return sections.filter((item) => item.rows.length > 0);
}
