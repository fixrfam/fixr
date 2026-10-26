"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { formatCpf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCustomerSearch } from "./store";

const CPF_LIKE = /^[\d.\s-]+$/;
const NON_DIGITS = /\D/g;

export interface PickedCustomer {
	id: string;
	name: string;
	cpf: string;
}

/** Search the company's customers by name, CPF, phone or email and pick one. */
export function CustomerPicker({
	value,
	onChange,
	disabled,
	id,
}: {
	value: PickedCustomer | null;
	onChange: (customer: PickedCustomer) => void;
	disabled?: boolean;
	id?: string;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	// CPFs are stored as digits, so "529.982" searches "529982".
	const { customers, loading } = useCustomerSearch(
		CPF_LIKE.test(search) ? search.replace(NON_DIGITS, "") : search
	);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className="w-full justify-between font-normal"
					disabled={disabled}
					id={id}
					role="combobox"
					type="button"
					variant="outline"
				>
					<span className={cn("truncate", !value && "text-muted-foreground")}>
						{value
							? `${value.name} · ${formatCpf(value.cpf)}`
							: t("devices.form.customerPlaceholder")}
					</span>
					<ChevronsUpDown className="size-3.5 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-(--radix-popover-trigger-width) p-0"
			>
				<Command shouldFilter={false}>
					<CommandInput
						onValueChange={setSearch}
						placeholder={t("devices.form.customerPlaceholder")}
						value={search}
					/>
					<CommandList>
						{!loading && (
							<CommandEmpty>{t("devices.form.customerEmpty")}</CommandEmpty>
						)}
						<CommandGroup>
							{customers.map((customer) => (
								<CommandItem
									key={customer.id}
									onSelect={() => {
										onChange(customer);
										setOpen(false);
									}}
									value={customer.id}
								>
									<Check
										className={cn(
											"size-3.5",
											value?.id === customer.id ? "opacity-100" : "opacity-0"
										)}
									/>
									<span className="truncate">{customer.name}</span>
									<span className="ml-auto text-muted-foreground text-xs tabular-nums">
										{formatCpf(customer.cpf)}
									</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
