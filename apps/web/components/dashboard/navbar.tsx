import Image from "next/image";
import Logo from "@/public/logo.svg";
import { AccountPopover } from "./account-popover";
import { ModeToggle } from "../mode-toggle";

export function Navbar() {
    return (
        <header className='h-14 border-border border-b px-6 flex justify-between items-center'>
            <div>
                <Image src={Logo} alt='logo' className='size-6' />
            </div>
            <div className='flex justify-center items-center gap-2'>
                <ModeToggle />
                <AccountPopover />
            </div>
        </header>
    );
}
