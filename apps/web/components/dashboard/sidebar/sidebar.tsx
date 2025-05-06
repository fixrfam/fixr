import { ProfileAvatar } from "@/components/account/profile-avatar";
import { Logo } from "@/components/svg/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PanelLeft, Search } from "lucide-react";
import { AccountPopover } from "../account-popover";
import { ModeToggle } from "@/components/mode-toggle";
import { sidebarSections } from "./sidebar-routes";
import { SidebarButton } from "./sidebar-button";
import { Separator } from "@/components/ui/separator";
import { TextLogo } from "@/components/svg/TextLogo";

export function Sidebar({ width, margin }: { width: string; margin: string }) {
    return (
        <aside
            className={`fixed rounded-md border border-border bg-background flex flex-col justify-between`}
            style={{ width, height: `calc(100dvh - (2 * ${margin}))`, left: margin, top: margin }}
        >
            <div className='flex w-full justify-between items-center px-5'>
                <TextLogo className='size-16 text-primary' />
                <Button variant={"ghost"} size={"icon"}>
                    <PanelLeft className='text-muted-foreground' />
                </Button>
            </div>
            <div className='space-y-4'>
                <div className='flex w-full justify-between items-center px-5'>
                    <div className='flex gap-3'>
                        <div className='size-9 rounded-sm bg-primary flex items-center justify-center'>
                            <Logo className='size-6 text-white' />
                        </div>
                        <div>
                            <p className='text-sm font-medium tracking-tight'>Acme Inc.</p>
                            <p className='text-xs tracking-tight text-muted-foreground'>
                                My company
                            </p>
                        </div>
                    </div>
                </div>
                <div className='w-full px-5'>
                    <Button
                        variant={"outline"}
                        className='h-8.5 bg-muted/50 hover:bg-muted text-muted-foreground px-3 text-[0.8rem] w-full justify-between'
                    >
                        <div className='inline-flex items-center gap-1.5'>
                            <Search className={"size-4"} />
                            Acesso rápido
                        </div>
                        <div className='inline-flex items-center gap-1.5'>
                            <Badge
                                className='rounded-[4px] px-0.5 min-w-5 bg-background text-muted-foreground grid place-items-center'
                                variant={"outline"}
                            >
                                ⌘
                            </Badge>
                            <Badge
                                className='rounded-[4px] px-0.5 min-w-5 bg-background text-muted-foreground grid place-items-center'
                                variant={"outline"}
                            >
                                K
                            </Badge>
                        </div>
                    </Button>
                </div>
            </div>
            <div
                className='w-full h-full py-5 overflow-y-auto space-y-5 px-2'
                style={{
                    maskImage: `
                        linear-gradient(to bottom, transparent, white 12px),
                        linear-gradient(to top, transparent, white 12px)
                    `,
                    maskComposite: "intersect",
                    WebkitMaskComposite: "destination-in",
                }}
            >
                {sidebarSections.map((section, i) => (
                    <div key={i} className='space-y-1'>
                        <p className='text-xs px-5 uppercase tracking-tight text-muted-foreground font-semibold'>
                            {section.title}
                        </p>
                        <div className='px-3'>
                            {section.items.map((item) => (
                                <SidebarButton key={item.id} {...item} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className='h-16 shrink-0 w-full bg-card border-t border-border rounded-b-md px-4 flex items-center justify-between gap-5'>
                <div className='flex items-center min-w-0 flex-1'>
                    <AccountPopover
                        showData
                        className='min-w-0 flex-1 overflow-hidden'
                        variant='square'
                    />
                </div>
                <ModeToggle />
            </div>
        </aside>
    );
}
