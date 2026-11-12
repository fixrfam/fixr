"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
import { CustomerAvatar } from "@/components/dashboard/customers/customer-avatar";
import {
	useCustomer,
	useCustomerSearch,
} from "@/components/dashboard/customers/store";
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

const CPF_LIKE = /^[\d.\s-]+$/;
const NON_DIGITS = /\D/g;

/** Narrow a list to one customer, searched by name, CPF, phone or email. */
export function CustomerFilter({
	value,
	onChange,
}: {
	value: string | null;
	onChange: (customerId: string | null) => void;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const { customers, loading } = useCustomerSearch(
		CPF_LIKE.test(search) ? search.replace(NON_DIGITS, "") : search
	);
	// The URL keeps only the id; the name comes from the customer itself.
	const selected = useCustomer(value ?? "").data;

	return (
		<div className="flex items-center">
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<Button
						aria-expanded={open}
						aria-label={t("estimates.table.headers.customer")}
						className={cn(
							"max-w-56 justify-between gap-2 font-normal",
							value && "rounded-r-none border-r-0"
						)}
						role="combobox"
						type="button"
						variant="outline"
					>
						<span className="flex min-w-0 items-center gap-2">
							{selected && (
								<CustomerAvatar className="size-5" customer={selected} />
							)}
							<span className="truncate">
								{selected?.name ?? t("estimates.table.allCustomers")}
							</span>
						</span>
						<ChevronsUpDown className="size-3.5 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-72 p-0">
					<Command shouldFilter={false}>
						<CommandInput
							onValueChange={setSearch}
							placeholder={t("estimates.table.customerSearch")}
							value={search}
						/>
						<CommandList>
							{!loading && (
								<CommandEmpty>
									{t("estimates.table.customerEmpty")}
								</CommandEmpty>
							)}
							<CommandGroup>
								{customers.map((customer) => (
									<CommandItem
										key={customer.id}
										onSelect={() => {
											onChange(customer.id === value ? null : customer.id);
											setOpen(false);
										}}
										value={customer.id}
									>
										<Check
											className={cn(
												"size-3.5",
												value === customer.id ? "opacity-100" : "opacity-0"
											)}
										/>
										<CustomerAvatar className="size-6" customer={customer} />
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
			{value && (
				<Button
					aria-label={t("common.actions.clear")}
					className="rounded-l-none"
					onClick={() => onChange(null)}
					size="icon"
					type="button"
					variant="outline"
				>
					<X className="size-3.5" />
				</Button>
			)}
		</div>
	);
}
