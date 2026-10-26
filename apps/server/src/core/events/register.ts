import { registerDeviceEffects } from "../../modules/devices/effects";
import { events } from "./bus";

let registered = false;

/**
 * Register every module's effects on the application bus. Called once by
 * `buildApp`; a module with effects adds its `register*Effects` here.
 */
export function registerEffects() {
	if (registered) {
		return;
	}
	registered = true;

	registerDeviceEffects(events);
}
