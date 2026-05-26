import type { ServiceOrderRow } from "@fixr/mock";
import {
	ClipboardList,
	FileUser,
	History,
	Image as ImageIcon,
	Package,
	User,
	Wrench,
} from "lucide-react";
import { ServiceOrderLifecycle } from "@/components/dashboard/service-order/lifecycle";
import { ServiceOrderDetailsCard } from "@/components/dashboard/service-order/service-order-details-card";
import { ServiceOrderImageGrid } from "@/components/dashboard/service-order/widgets/service-order-image-grid";
import {
	ServiceOrderKeyValueItem,
	ServiceOrderKeyValueList,
} from "@/components/dashboard/service-order/widgets/service-order-key-value";
import { ServiceOrderPartsList } from "@/components/dashboard/service-order/widgets/service-order-parts-list";
import { ServiceOrderStatusBadge } from "../service-order-status-badge";
import type { CardId } from "./utils/constants";

type CardsMap = Record<CardId, React.ReactNode>;

export function getCards(order: ServiceOrderRow): CardsMap {
	return {
		summary: (
			<ServiceOrderDetailsCard
				description="Informacoes principais da OS e status atual."
				icon={ClipboardList}
				title="Resumo da ordem"
			>
				<ServiceOrderKeyValueList>
					<ServiceOrderKeyValueItem label="Numero" value={order.orderNumber} />
					<ServiceOrderKeyValueItem
						label="Status"
						value={
							<ServiceOrderStatusBadge
								className="rounded-lg px-2.5 py-1 font-semibold text-xs"
								variant={order.status.id}
							>
								{order.status.label}
							</ServiceOrderStatusBadge>
						}
					/>
					<ServiceOrderKeyValueItem label="Linha" value={order.line} />
					<ServiceOrderKeyValueItem label="Marca" value={order.mark} />
					<ServiceOrderKeyValueItem label="Modelo" value={order.model} />
				</ServiceOrderKeyValueList>
			</ServiceOrderDetailsCard>
		),
		device: order.orderDetails ? (
			<ServiceOrderDetailsCard
				description="Dados tecnicos, data de recebimento e defeito."
				icon={Wrench}
				title="Detalhes do aparelho"
			>
				<ServiceOrderKeyValueList>
					<ServiceOrderKeyValueItem
						label="Recebimento"
						value={order.orderDetails.receivedAt}
					/>
					{order.orderDetails.imei && (
						<ServiceOrderKeyValueItem
							label="IMEI"
							value={order.orderDetails.imei}
						/>
					)}
					<ServiceOrderKeyValueItem
						label="Descrição"
						stacked
						value={order.orderDetails.description}
					/>
				</ServiceOrderKeyValueList>
			</ServiceOrderDetailsCard>
		) : null,
		technician: (
			<ServiceOrderDetailsCard
				description="Responsavel atribuido e observacoes internas."
				icon={User}
				title="Dados do técnico"
			>
				<ServiceOrderKeyValueList>
					<ServiceOrderKeyValueItem
						label="Responsável"
						value={order.technician}
					/>
					{order.notes && (
						<ServiceOrderKeyValueItem
							label="Observações"
							stacked
							value={order.notes}
						/>
					)}
				</ServiceOrderKeyValueList>
			</ServiceOrderDetailsCard>
		),
		client: (
			<ServiceOrderDetailsCard
				description="Informacoes de contato e identificacao."
				icon={FileUser}
				title="Dados do cliente"
			>
				<ServiceOrderKeyValueList>
					<ServiceOrderKeyValueItem label="Nome" value={order.client.name} />
					<ServiceOrderKeyValueItem label="CPF" value={order.client.cpf} />
					<ServiceOrderKeyValueItem
						label="Telefone"
						value={order.client.phone}
					/>
				</ServiceOrderKeyValueList>
			</ServiceOrderDetailsCard>
		),
		lifecycle: (
			<ServiceOrderDetailsCard
				description="Progresso da OS por fases e registros recentes."
				icon={History}
				title="Ciclo de vida"
			>
				{order.history.length > 0 ? (
					<ServiceOrderLifecycle
						currentStatus={order.status.id}
						history={order.history}
					/>
				) : (
					<p className="text-muted-foreground text-sm">
						Nenhum histórico registrado.
					</p>
				)}
			</ServiceOrderDetailsCard>
		),
		parts: (
			<ServiceOrderDetailsCard
				description="Lista de itens previstos para concluir o serviço."
				icon={Package}
				title="Peças necessárias para o reparo"
			>
				<ServiceOrderPartsList parts={order.parts} />
			</ServiceOrderDetailsCard>
		),
		images: (
			<ServiceOrderDetailsCard
				description="Registro visual do equipamento e do defeito."
				icon={ImageIcon}
				title="Imagens do aparelho"
			>
				<ServiceOrderImageGrid images={order.images} />
			</ServiceOrderDetailsCard>
		),
	};
}
