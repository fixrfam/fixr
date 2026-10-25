interface Closable {
	close: () => Promise<void>;
}

/**
 * Close the workers when the process is asked to stop. `Worker.close()` waits
 * for the jobs in progress to finish, so a deploy/restart doesn't drop them.
 */
export function registerGracefulShutdown(
	workers: Closable[],
	{
		signals = ["SIGTERM", "SIGINT"],
		exit = (code: number) => process.exit(code),
	}: { signals?: NodeJS.Signals[]; exit?: (code: number) => void } = {}
) {
	let shuttingDown = false;

	const shutdown = async () => {
		if (shuttingDown) {
			return;
		}
		shuttingDown = true;

		const results = await Promise.allSettled(workers.map((w) => w.close()));
		exit(results.some((r) => r.status === "rejected") ? 1 : 0);
	};

	for (const signal of signals) {
		process.once(signal, shutdown);
	}

	return shutdown;
}
