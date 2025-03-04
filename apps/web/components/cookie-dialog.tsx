"use client";

import { Dialog, DialogContent } from "./ui/dialog";
import { ReactNode, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "@pheralb/toast";

export default function CookieDialog({
    cookieKey,
    close,
    open,
    children,
}: {
    cookieKey: string;
    close: {
        cta: ReactNode;
        toast: {
            text: string;
            description: string;
        };
    };
    open: boolean;
    children: ReactNode;
}) {
    const [openDialog, setOpenDialog] = useState(open);

    if (open) {
        document.cookie = `${cookieKey}=; max-age=0; path=/`;
    }

    const openChangeHandler = (bool: boolean) => {
        setOpenDialog(bool);
        toast.info({
            text: close.toast.text,
            description: close.toast.description,
        });
    };

    return (
        <Dialog open={openDialog} onOpenChange={(bool) => openChangeHandler(bool)}>
            <DialogContent>
                {children}
                <Button onClick={() => setOpenDialog(false)} className='mx-auto'>
                    {close.cta}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
