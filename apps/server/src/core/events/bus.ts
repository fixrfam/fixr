import type { Transaction } from "@fixr/db/connection";
import type { DomainEvents, EventName } from "./catalog";

/** What an effect receives besides the payload. */
export interface EffectContext {
	/** The transaction the event was emitted in: effects write through it, so everything commits or rolls back together. */
	tx: Transaction;
	/** Emit a follow-up event in the same transaction (e.g. an effect that changes a status). */
	emit: <K extends EventName>(
		event: K,
		payload: DomainEvents[K]
	) => Promise<void>;
}

export type Effect<K extends EventName> = (
	payload: DomainEvents[K],
	context: EffectContext
) => Promise<void> | void;

interface RegisteredEffect {
	name: string;
	run: Effect<EventName>;
}

/** Effects emitting events that trigger effects... A chain this deep is a loop. */
const MAX_DEPTH = 8;

/**
 * Typed, in-process event bus.
 *
 * `emit` runs the event's effects one after the other, in registration
 * order, inside the caller's transaction, and resolves when all of them
 * finished. An effect that throws aborts the chain and, with it, the
 * transaction: the change that emitted the event is rolled back too.
 */
export class EventBus {
	readonly #effects = new Map<EventName, RegisteredEffect[]>();

	/**
	 * Register an effect of `event`. `name` identifies it in errors and in the
	 * README table (`<module>.<what it does>`, e.g. `devices.followServiceOrder`).
	 */
	on<K extends EventName>(event: K, name: string, run: Effect<K>) {
		const effects = this.#effects.get(event) ?? [];
		if (effects.some((effect) => effect.name === name)) {
			throw new Error(`Effect "${name}" is already registered on "${event}".`);
		}
		effects.push({ name, run: run as Effect<EventName> });
		this.#effects.set(event, effects);
	}

	/** Run every effect of `event` inside `tx`. */
	emit<K extends EventName>(
		tx: Transaction,
		event: K,
		payload: DomainEvents[K]
	): Promise<void> {
		return this.#run(tx, event, payload, 0);
	}

	/** Names of the effects of `event`, in the order they run. */
	effectsOf(event: EventName) {
		return (this.#effects.get(event) ?? []).map((effect) => effect.name);
	}

	/** Remove one effect (tests that register a temporary one). */
	off(event: EventName, name: string) {
		const effects = this.#effects.get(event) ?? [];
		this.#effects.set(
			event,
			effects.filter((effect) => effect.name !== name)
		);
	}

	/** Forget every effect (tests). */
	clear() {
		this.#effects.clear();
	}

	async #run<K extends EventName>(
		tx: Transaction,
		event: K,
		payload: DomainEvents[K],
		depth: number
	) {
		if (depth >= MAX_DEPTH) {
			throw new Error(
				`Event chain deeper than ${MAX_DEPTH} at "${event}": effects are emitting each other in a loop.`
			);
		}

		const context: EffectContext = {
			tx,
			emit: (next, nextPayload) => this.#run(tx, next, nextPayload, depth + 1),
		};

		for (const effect of this.#effects.get(event) ?? []) {
			await effect.run(payload, context);
		}
	}
}

/** The application's bus. Effects are registered once, by `registerEffects()`. */
export const events = new EventBus();
