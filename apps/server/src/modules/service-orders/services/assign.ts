import type { Transaction } from "@fixr/db/connection";
import { ServiceOrdersRepository } from "../repositories";

/**
 * The one way to change who is responsible for a service order: update its
 * sector and assignee and record the change (who made it, from what to what)
 * in the order's assignment history, in the caller's transaction.
 *
 * @param employeeId - who reassigned it; none when a stage's default did
 * @returns whether anything changed (the same sector and assignee change nothing)
 */
export async function assignServiceOrder(
	tx: Transaction,
	{
		serviceOrderId,
		sectorId,
		assigneeId,
		employeeId = null,
	}: {
		serviceOrderId: string;
		sectorId: string | null;
		assigneeId: string | null;
		employeeId?: string | null;
	}
) {
	const current = await ServiceOrdersRepository.queryAssignmentForUpdate(
		tx,
		serviceOrderId
	);
	if (
		!current ||
		(current.sectorId === sectorId && current.assigneeId === assigneeId)
	) {
		return false;
	}

	await ServiceOrdersRepository.updateAssignment(tx, serviceOrderId, {
		sectorId,
		assigneeId,
	});
	await ServiceOrdersRepository.insertAssignmentHistory(tx, {
		serviceOrderId,
		fromSectorId: current.sectorId,
		toSectorId: sectorId,
		fromAssigneeId: current.assigneeId,
		toAssigneeId: assigneeId,
		employeeId,
	});
	return true;
}
