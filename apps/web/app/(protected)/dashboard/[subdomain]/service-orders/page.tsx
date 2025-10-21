import { CreateServiceOrderForm } from "@/components/dashboard/service-order/CreateServiceOrderForm";
import { Heading } from "@/components/dashboard/heading";

export default function ServiceOrdersPage() {
  return (
    <div className='flex flex-col gap-2'>
    <Heading
        title={"Ordens de serviço"}
        description={"Controle as ordens de serviço de seus clientes"}
    />
    <CreateServiceOrderForm />
    </div>  
  );
}