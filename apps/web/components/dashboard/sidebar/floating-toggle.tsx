"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useSidebarStore } from "@/lib/hooks/stores/use-sidebar-store";
import { Menu, X } from "lucide-react";

export function FloatingToggle({ ...props }: ButtonProps) {
    const { isOpen, toggle } = useSidebarStore();
    return (
        <Button variant={"outline"} size={"icon"} onClick={toggle} {...props}>
            {!isOpen ? <Menu /> : <X />}
        </Button>
    );
}
