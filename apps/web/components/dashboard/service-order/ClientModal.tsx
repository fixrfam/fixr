"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, User, Mail, PhoneIcon, IdCard, MapPin, Building, Smartphone } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useMaskito } from "@maskito/react";
import { cpf, phone, unmask } from "@fixr/constants/masks";
import { toast } from "@pheralb/toast";
import { api, tryCatch } from "@/lib/utils";
import { axios } from "@/lib/auth/axios";
import { AxiosError, AxiosResponse } from "axios";
import { ApiResponse } from "@fixr/schemas/utils";

const createCustomerSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "O email é obrigatório"),
  cpf: z.string().min(14, "CPF inválido").max(14, "CPF inválido"),
  phone: z.string().min(1, "O telefone é obrigatório"),
  alternativePhone: z.string().optional(),
  address: z.string().min(1, "O endereço é obrigatório"),
  state: z.string().min(2, "O estado é obrigatório").max(2),
  city: z.string().min(1, "A cidade é obrigatória"),
});

export function ClientModal({ open, onOpenChange, onCustomerCreated }: { open: boolean, onOpenChange: (open: boolean) => void, onCustomerCreated: (cpf: string) => void }) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof createCustomerSchema>>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      phone: "",
      alternativePhone: "",
      address: "",
      state: "",
      city: "",
    },
    mode: "all",
  });

  const cpfMask = useMaskito({ options: { mask: cpf } });
  const phoneMask = useMaskito({ options: { mask: phone } });
  const altPhoneMask = useMaskito({ options: { mask: phone } });

  async function onSubmit(values: z.infer<typeof createCustomerSchema>) {
    setLoading(true);

    const formattedData = {
      ...values,
      cpf: unmask.cpf(values.cpf),
      phone: unmask.phone(values.phone),
      alternativePhone: values.alternativePhone ? unmask.phone(values.alternativePhone) : null,
    };

    try {
      // SUBSTITUA ESTA CHAMADA PELA SUA ROTA REAL DE API DE CLIENTES
      // Exemplo: axios.post(api(`/customers`), formattedData);

      toast.success({
        text: "Cliente cadastrado com sucesso!",
      });

      onCustomerCreated(values.cpf);
      onOpenChange(false);
    } catch (error) {
      toast.error({
        text: "Erro ao cadastrar cliente",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar cadastro cliente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <h3 className="font-semibold text-sm">*Dados do cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><User className="size-3.5 inline-block mr-1" /> Nome</FormLabel>
                    <FormControl><Input placeholder="João da Silva" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Mail className="size-3.5 inline-block mr-1" /> Email</FormLabel>
                    <FormControl><Input placeholder="joao.silva@email.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><PhoneIcon className="size-3.5 inline-block mr-1" /> Telefone</FormLabel>
                    <FormControl><Input placeholder="(00) 00000-0000" {...field} ref={phoneMask} onInput={(e) => form.setValue("phone", e.currentTarget.value)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alternativePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Smartphone className="size-3.5 inline-block mr-1" /> Telefone alternativo</FormLabel>
                    <FormControl><Input placeholder="(00) 00000-0000" {...field} ref={altPhoneMask} onInput={(e) => form.setValue("alternativePhone", e.currentTarget.value)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><IdCard className="size-3.5 inline-block mr-1" /> CPF</FormLabel>
                    <FormControl><Input placeholder="000.000.000-00" {...field} ref={cpfMask} onInput={(e) => form.setValue("cpf", e.currentTarget.value)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel><MapPin className="size-3.5 inline-block mr-1" /> Endereço</FormLabel>
                    <FormControl><Input placeholder="Rua, Av..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Building className="size-3.5 inline-block mr-1" /> Estado</FormLabel>
                    <FormControl><Input placeholder="UF" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Building className="size-3.5 inline-block mr-1" /> Cidade</FormLabel>
                    <FormControl><Input placeholder="Cidade" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-4">
              Finalizar cadastro {!loading ? <User /> : <Loader2 className="animate-spin" />}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}