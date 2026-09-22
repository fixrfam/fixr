/** Human-readable names for the resource half of a permission string. */
const RESOURCE_LABELS: Record<string, string> = {
	account: "Conta",
	apiKeys: "Chaves de API",
	companies: "Empresa",
	customers: "Clientes",
	devices: "Aparelhos",
	employees: "Funcionários",
	estimates: "Orçamentos",
	inventory: "Estoque",
	logs: "Registros",
	parts: "Peças",
	serviceOrders: "Ordens de Serviço",
	settings: "Configurações",
	suppliers: "Fornecedores",
};

/** Human-readable names for the action half of a permission string. */
const ACTION_LABELS: Record<string, string> = {
	adjust: "Ajustar",
	assign: "Atribuir",
	changeStatus: "Alterar status",
	create: "Criar",
	delete: "Excluir",
	read: "Ler",
	revoke: "Revogar",
	security: "Segurança",
	sendToCustomer: "Enviar ao cliente",
	update: "Editar",
};

export interface ScopeGroup {
	resource: string;
	label: string;
	scopes: string[];
}

/** Turns "serviceOrders:read" into "Ler". */
export function scopeLabel(scope: string): string {
	const action = scope.split(":")[1] ?? scope;
	return ACTION_LABELS[action] ?? action;
}

/** Turns "serviceOrders:read" into "Ordens de Serviço". */
export function resourceLabel(resource: string): string {
	return RESOURCE_LABELS[resource] ?? resource;
}

/**
 * Groups flat permission strings by their resource, so the picker can render
 * one row per resource instead of a single long list.
 *
 * @param scopes - Permission strings such as "serviceOrders:read"
 * @returns Groups sorted by their display label
 */
export function groupScopes(scopes: string[]): ScopeGroup[] {
	const byResource = new Map<string, string[]>();

	for (const scope of scopes) {
		const resource = scope.split(":")[0] ?? scope;
		const current = byResource.get(resource) ?? [];
		current.push(scope);
		byResource.set(resource, current);
	}

	return [...byResource.entries()]
		.map(([resource, list]) => ({
			resource,
			label: resourceLabel(resource),
			scopes: list,
		}))
		.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}
