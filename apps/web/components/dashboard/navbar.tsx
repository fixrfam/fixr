import { AccountPopover } from "./account-popover";
import { ModeToggle } from "../mode-toggle";
import { Logo } from "../svg/Logo";

export function Navbar() {
    return (
        <header className='h-14 border-border border-b px-6 flex justify-between items-center'>
            <div>
                <Logo className='size-6 text-primary ' />
            </div>
            <div className='flex justify-center items-center gap-2'>
                <ModeToggle />
                <AccountPopover />
            </div>
        </header>
    );
}
