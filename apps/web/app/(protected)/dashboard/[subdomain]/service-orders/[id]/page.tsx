import { mockServiceOrders } from "@fixr/mock";
import {
	ArrowLeft,
	CheckCircle,
	ClipboardList,
	Clock,
	DollarSign,
	FileUser,
	History,
	Image as ImageIcon,
	MoreHorizontal,
	Package,
	Pencil,
	Phone,
	User,
	UserCheck,
	Wrench,
	XCircle,
} from "lucide-react";
import { notFound } from "next/navigation";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { Button } from "@/components/ui/button";
import { ServiceOrderStatusBadge } from "@/components/ui/service-order-status-badge";
import {
	Timeline,
	TimelineConnector,
	TimelineContent,
	TimelineDescription,
	TimelineDot,
	TimelineHeader,
	TimelineItem,
	TimelineTime,
	TimelineTitle,
} from "@/components/ui/timeline";
import {
	getStatusClass,
	getStatusClassTable,
	type ServiceOrderStatusId,
} from "@/lib/utils/service-orders";

type Params = Promise<{ subdomain: string; id: string }>;

function getStatusIcon(statusId: string) {
	switch (statusId) {
		case "parts_pending":
			return Package;
		case "analysis":
			return ClipboardList;
		case "finished":
			return CheckCircle;
		case "canceled":
			return XCircle;
		case "quote_pending":
			return DollarSign;
		case "approval_pending":
			return Clock;
		case "in_progress":
			return Wrench;
		case "ready_for_pickup":
			return UserCheck;
		case "contacted":
			return Phone;
		default:
			return MoreHorizontal;
	}
}

function getTimelineConnectorBg(statusId: string) {
	const classes = getStatusClassTable(statusId as ServiceOrderStatusId);
	// pega a classe de bg-* do retorno (fallback transparente)
	return (
		classes.split(" ").find((c) => c.startsWith("bg-")) ?? "bg-transparent"
	);
}

interface HistoryStatus {
	id: string;
	label: string;
}

interface HistoryItem {
	id: string;
	status: HistoryStatus;
	dateTime: string;
	comment: string;
}

interface HistoryGroup {
	status: HistoryStatus;
	entries: HistoryItem[];
}

function groupHistoryByStatus(history: HistoryItem[]): HistoryGroup[] {
	return history.reduce<HistoryGroup[]>((acc, item) => {
		const lastGroup = acc.at(-1);

		if (lastGroup && lastGroup.status.id === item.status.id) {
			lastGroup.entries.push(item);
			return acc;
		}

		acc.push({
			status: item.status,
			entries: [item],
		});

		return acc;
	}, []);
}

export default async function ServiceOrderDetailsPage({
	params,
}: {
	params: Params;
}) {
	const { subdomain, id } = await params;

	const order = mockServiceOrders.find((item) => item.id === id);

	if (!order) {
		notFound();
	}

	const groupedHistory = groupHistoryByStatus(
		order.history.map((item) => ({
			id: item.id,
			status: {
				id: item.status,
				label: item.label,
			},
			dateTime: item.dateTime,
			comment: item.comment,
		}))
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3">
				<Button
					asChild
					className="mb-5 w-fit -translate-x-2"
					size="sm"
					variant="ghost"
				>
					<DashLink href="/service-orders" subdomain={subdomain}>
						<ArrowLeft className="size-4" />
						Voltar
					</DashLink>
				</Button>

				<div>
					<h1 className="font-semibold text-2xl">
						Ordem de serviço N° {order.orderNumber}
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Detalhes completos da ordem de serviço.
					</p>
				</div>
			</div>

			<div className="grid gap-4 lg:flex-cols lg:gap-6">
				<div className="self-start rounded-lg bg-muted/20 p-4">
					<div className="mb-4 flex items-center gap-2">
						<ClipboardList className="size-4 text-muted-foreground" />
						<h2 className="font-medium">Resumo da ordem</h2>
						<Pencil className="ml-6 size-4.5 text-muted-foreground" />
					</div>

					<div className="space-y-2 text-sm">
						<p>
							<span className="font-medium">Número:</span> {order.orderNumber}
						</p>
						<p>
							<span className="font-medium">Status:</span>{" "}
							<ServiceOrderStatusBadge
								className={`ml-1 inline-flex rounded-lg px-2.5 py-1 font-semibold text-xs ${getStatusClassTable(order.status.id as ServiceOrderStatusId)}`}
								variant={order.status.id}
							>
								<span className="font-semibold text-bg-foreground">
									{order.status.label}
								</span>
							</ServiceOrderStatusBadge>
						</p>
						<p>
							<span className="font-medium">Linha:</span> {order.line}
						</p>
						<p>
							<span className="font-medium">Marca:</span> {order.mark}
						</p>
						<p>
							<span className="font-medium">Modelo:</span> {order.model}
						</p>
					</div>
				</div>

				<div className="rounded-lg bg-muted/20 p-4">
					<div className="mb-4 flex items-center gap-2">
						<User className="size-4 text-muted-foreground" />
						<h2 className="font-medium">Dados do técnico</h2>
						<Pencil className="ml-6 size-4.5 text-muted-foreground" />
					</div>

					<div className="space-y-2 text-sm">
						<p>
							<span className="font-medium">Responsável:</span>{" "}
							{order.technician}
						</p>
						<p>
							<span className="font-medium">Observações:</span> {order.notes}
						</p>
					</div>
				</div>

				<div className="self-start rounded-lg bg-muted/20 p-4">
					<div className="mb-4 flex items-center gap-2">
						<FileUser className="size-4 text-muted-foreground" />
						<h2 className="font-medium">Dados do cliente</h2>
						<Pencil className="ml-6 size-4.5 text-muted-foreground" />
					</div>

					<div className="space-y-2 text-sm">
						<p>
							<span className="font-medium">Nome:</span> {order.client.name}
						</p>
						<p>
							<span className="font-medium">CPF:</span> {order.client.cpf}
						</p>
						<p>
							<span className="font-medium">Telefone:</span>{" "}
							{order.client.phone}
						</p>
					</div>
				</div>

				<div className="rounded-lg bg-muted/20 p-4">
					<div className="mb-4 flex items-center gap-2">
						<History className="size-4 text-muted-foreground" />
						<h2 className="font-medium">Histórico de observações</h2>
						<Pencil className="ml-6 size-4.5 text-muted-foreground" />
					</div>

					{groupedHistory.length > 0 ? (
						<Timeline
							activeIndex={groupedHistory.length - 1}
							className="[--timeline-connector-offset:calc(50%_-_0.5rem)] [--timeline-dot-size:2.5rem]"
						>
							{groupedHistory.map((group, idx) => {
								const StatusIcon = getStatusIcon(group.status.id);
								const isLast = idx === groupedHistory.length - 1;
								const connectorBg = getTimelineConnectorBg(group.status.id);

								return (
									<TimelineItem
										key={`${group.status.id}-${group.entries.at(-1)?.id}`}
									>
										<TimelineDot
											className={`${getStatusClass(group.status.id as ServiceOrderStatusId)} !border-0 flex items-center justify-center`}
										>
											<StatusIcon className="size-5" />
										</TimelineDot>

										{/* connector usa cor do status atual (mantém cor do anterior ao transitar) */}
										{isLast ? (
											<TimelineConnector className="!bg-transparent" />
										) : (
											<TimelineConnector className={connectorBg} />
										)}

										<TimelineContent>
											<TimelineHeader>
												<TimelineTime
													dateTime={group.entries.at(-1)?.dateTime ?? ""}
												>
													{group.entries.at(-1)?.dateTime}
												</TimelineTime>
												<TimelineTitle>{group.status.label}</TimelineTitle>
											</TimelineHeader>

											<div className="mt-2 space-y-2">
												{group.entries.map((entry) => (
													<TimelineDescription key={entry.id}>
														<span className="mr-2 text-muted-foreground text-xs">
															{entry.dateTime}
														</span>
														{entry.comment}
													</TimelineDescription>
												))}
											</div>
										</TimelineContent>
									</TimelineItem>
								);
							})}
						</Timeline>
					) : (
						<p className="text-muted-foreground text-sm">
							Nenhum histórico registrado.
						</p>
					)}
				</div>

				<div className="rounded-lg bg-muted/20 p-4">
					<div className="mb-4 flex items-center gap-2">
						<Wrench className="size-4 text-muted-foreground" />
						<h2 className="font-medium">Peças necessárias para o reparo</h2>
						<Pencil className="ml-6 size-4.5 text-muted-foreground" />
					</div>

					<div className="flex flex-wrap gap-2">
						{order.parts?.map((part) => (
							<span
								className="rounded-full bg-background px-3 py-1 text-foreground text-sm"
								key={part}
							>
								{part}
							</span>
						))}
					</div>
				</div>

				<div className="rounded-lg bg-muted/20 p-4">
					<div className="mb-4 flex items-center gap-2">
						<ImageIcon className="size-4 text-muted-foreground" />
						<h2 className="font-medium">Imagens do aparelho</h2>
						<Pencil className="ml-6 size-4.5 text-muted-foreground" />
					</div>

					{order.images && order.images.length > 0 ? (
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
							{order.images.map((image) => (
								<div
									className="overflow-hidden rounded-lg border bg-background"
									key={image.id}
								>
									{/** biome-ignore lint/correctness/useImageSize: <No need for that> */}
									<img
										alt={image.description}
										className="aspect-square w-full object-cover"
										src={image.url}
									/>
									<p className="p-2 text-center text-muted-foreground text-xs">
										{image.description}
									</p>
								</div>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-sm">
							Nenhuma imagem registrada.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
