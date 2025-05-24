import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { TextLogo } from "../svg/TextLogo";
import { Button } from "../ui/button";
import { ModeToggle } from "../mode-toggle";

export default function Header() {
    return (
        <header className='w-full h-20 flex items-center justify-center p-8 border-b-[1px] border-border border-opacity-10 fixed z-[99] bg-background/50 backdrop-blur-lg'>
            <div className='max-w-7xl w-full flex justify-between items-center'>
                <div className='flex gap-8'>
                    <Link href='/' prefetch>
                        <TextLogo className='w-16 text-primary' />
                    </Link>
                    <nav className='hidden lg:block'>
                        <ul className='flex gap-6 font-light'>
                            <li>Funcionalidades</li>
                            <li>Produtos</li>
                            <li>Preços</li>
                            <li>Clientes</li>
                            <li>Contato</li>
                        </ul>
                    </nav>
                </div>
                <div className='flex gap-2'>
                    <Link href={process.env.NEXT_PUBLIC_DOCS_URL ?? "/"}>
                        <Button variant='outline' className='font-light hidden lg:block' size='sm'>
                            Docs <ExternalLink className='w-3.5 h-3.5 inline-block' />
                        </Button>
                    </Link>
                    <Link href='/auth/login' prefetch>
                        <Button size='sm'>Entrar</Button>
                    </Link>
                    <ModeToggle size={"sm"} />
                </div>
            </div>
        </header>
    );
}
