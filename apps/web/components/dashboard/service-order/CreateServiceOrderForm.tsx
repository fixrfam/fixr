"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientModal } from "@/components/dashboard/service-order/ClientModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import {createOrderServiceSchema} from "@fixr/schemas/service-orders";

export function CreateServiceOrderForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<z.infer<typeof createOrderServiceSchema>>({
    resolver: zodResolver(createOrderServiceSchema),
    defaultValues: {
      customerCpf: "",
    },
  });

  const handleCustomerCreated = (cpf: string) => {
    form.setValue("customerCpf", cpf);
    setIsModalOpen(false);
  };

  const onSubmit = (values: z.infer<typeof createOrderServiceSchema>) => {
    console.log("Ordem de serviço a ser criada:", values);
    // Lógica para enviar a ordem de serviço para a API
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Criar Ordem de Serviço</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-end gap-4">
            <FormField
              control={form.control}
              name="customerCpf"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormLabel>*CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="Insira o CPF do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" onClick={() => setIsModalOpen(true)}>
              Criar cadastro cliente <Plus className="ml-2 size-4" />
            </Button>
          </div>
          {/* Adicione os outros campos da Ordem de Serviço aqui */}
          <div className="pt-4">
            <Button type="submit" className="w-full">Finalizar cadastro</Button>
          </div>
        </form>
      </Form>
      <ClientModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
}