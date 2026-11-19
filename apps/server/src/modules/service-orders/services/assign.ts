import type { Transaction } from "@fixr/db/connection";
import { ServiceOrdersRepository } from "../repositories";

/**
 * The one way to change who is responsible for a service order: update its
 * department and assignee and record the change (who made it, from what to what)
 * in the order's assignment history, in the caller's transaction.
 *
 * @param employeeId - who reassigned it; none when a stage's default did
 * @returns whether anything changed (the same department and assignee change nothing)
 */
export async function assignServiceOrder(
	tx: Transaction,
	{
		serviceOrderId,
		departmentId,
		assigneeId,
		employeeId = null,
	}: {
		serviceOrderId: string;
		departmentId: string | null;
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
		(current.departmentId === departmentId && current.assigneeId === assigneeId)
	) {
		return false;
	}

	await ServiceOrdersRepository.updateAssignment(tx, serviceOrderId, {
		departmentId,
		assigneeId,
	});
	await ServiceOrdersRepository.insertAssignmentHistory(tx, {
		serviceOrderId,
		fromDepartmentId: current.departmentId,
		toDepartmentId: departmentId,
		fromAssigneeId: current.assigneeId,
		toAssigneeId: assigneeId,
		employeeId,
	});
	return true;
}
