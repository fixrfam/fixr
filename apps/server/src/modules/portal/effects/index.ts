import type { EventBus } from "../../../core/events/bus";
import { PortalRepository } from "../repositories";

/**
 * A portal session opened from an estimate's emailed link lasts as long as
 * the link: once the shop sends the estimate again or takes it back to draft,
 * whoever opened the old link is signed out.
 */
export function registerPortalEffects(bus: EventBus) {
	bus.on(
		"estimate.linkRevoked",
		"portal.endEstimateSessions",
		({ estimateId }, { tx }) =>
			PortalRepository.deleteEstimateSessions(estimateId, tx)
	);
}
