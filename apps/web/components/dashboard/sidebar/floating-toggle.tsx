"use client";

import { Menu, X } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useSidebarStore } from "@/lib/hooks/stores/use-sidebar-store";

export function FloatingToggle({ ...props }: ButtonProps) {
	const { isOpen, toggle } = useSidebarStore();
	return (
		<Button onClick={toggle} size={"icon"} variant={"outline"} {...props}>
			{isOpen ? <X /> : <Menu />}
		</Button>
	);
}
