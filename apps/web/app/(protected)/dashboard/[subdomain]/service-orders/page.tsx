import { CreateOrderServiceForm } from "@/components/dashboard/service-order/CreateOrderServiceForm";

export default function ServiceOrdersPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Ordens de Serviço</h2>
      </div>
      <CreateOrderServiceForm />
    </div>
  );
}