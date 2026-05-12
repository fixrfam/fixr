"use client";

import { getFilterOptions } from "@fixr/mock";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Filter, Monitor, Tag, User } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

export function ServiceOrderFilters() {
	const [open, setOpen] = useState(false);
	const [line, setLine] = useState<string>("");
	const [technician, setTechnician] = useState<string>("");
	const [status, setStatus] = useState<string>("");
	const [date, setDate] = useState<string>("");

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	//const queryClient = useQueryClient();

	const { data: filters = { lines: [], technicians: [], statuses: [] } } =
		useQuery({
			queryKey: ["filters"],
			queryFn: () => getFilterOptions(), // TODO: replace with API call when ready
		});

	const applyFilters = () => {
		const params = new URLSearchParams(searchParams?.toString() ?? "");

		if (line) {
			params.set("line", line);
		} else {
			params.delete("line");
		}

		if (technician) {
			params.set("technician", technician);
		} else {
			params.delete("technician");
		}

		if (status) {
			params.set("status", status);
		} else {
			params.delete("status");
		}

		if (date) {
			params.set("date", date);
		} else {
			params.delete("date");
		}

		const query = params.toString();
		router.push(`${pathname}${query ? `?${query}` : ""}`);
		setOpen(false);
	};

	return (
		<Sheet onOpenChange={setOpen} open={open}>
			<SheetTrigger asChild>
				<Button className="h-9.5 shrink-0" type="button">
					Filtros <Filter className="size-4" />
				</Button>
			</SheetTrigger>

			<SheetContent className="w-full p-4 sm:max-w-sm">
				<SheetHeader className="mb-0 space-y-1 p-0">
					<SheetTitle className="text-base">Filtros</SheetTitle>
					<SheetDescription className="mb-4">
						Aprimore sua busca com filtros específicos
					</SheetDescription>
				</SheetHeader>

				<div className="mt-0 space-y-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Monitor className="h-4 w-4 text-muted-foreground" />
							<p className="font-medium text-foreground text-sm">Linha</p>
						</div>
						<Select onValueChange={setLine} value={line}>
							<SelectTrigger className="h-10 w-full">
								<SelectValue placeholder="Selecione a linha" />
							</SelectTrigger>
							<SelectContent>
								{filters.lines.map((line) => (
									<SelectItem key={line.id} value={line.id}>
										{line.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<User className="h-4 w-4 text-muted-foreground" />
							<p className="font-medium text-foreground text-sm">Técnico</p>
						</div>
						<Select onValueChange={setTechnician} value={technician}>
							<SelectTrigger className="h-10 w-full">
								<SelectValue placeholder="Selecione o técnico" />
							</SelectTrigger>
							<SelectContent>
								{filters.technicians.map((technician) => (
									<SelectItem key={technician.id} value={technician.id}>
										{technician.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Tag className="h-4 w-4 text-muted-foreground" />
							<p className="font-medium text-foreground text-sm">Status</p>
						</div>
						<Select onValueChange={setStatus} value={status}>
							<SelectTrigger className="h-10 w-full">
								<SelectValue placeholder="Selecione o status" />
							</SelectTrigger>
							<SelectContent>
								{filters.statuses.map((status) => (
									<SelectItem key={status.value} value={status.value}>
										{status.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<p className="font-medium text-foreground text-sm">Data</p>
						</div>
						<Input
							className="h-10"
							onChange={(e) => setDate(e.target.value)}
							type="date"
							value={date}
						/>
					</div>

					<div className="pt-2">
						<Button className="w-full" onClick={applyFilters} type="button">
							Aplicar filtros
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
