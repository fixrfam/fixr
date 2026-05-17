/** @description Successful result with data and no error */
interface Success<T> {
	data: T;
	error: null;
}

/** @description Failed result with error and no data */
interface Failure<E> {
	data: null;
	error: E;
}

type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Execute an async operation and return a Result tuple
 *
 * @param promise - The async operation to execute
 * @returns Result with either data or error
 */
export async function tryCatch<T, E = Error>(
	promise: Promise<T>
): Promise<Result<T, E>> {
	try {
		const data = await promise;
		return { data, error: null };
	} catch (error) {
		return { data: null, error: error as E };
	}
}
