import Link from "next/link";
import { TextLogo } from "@/components/svg/TextLogo";
import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export default function Footer({ className, ...props }: ComponentPropsWithoutRef<"footer">) {
    return (
        <footer
            className={cn(
                "mx-auto gap-2 flex flex-col items-center justify-center py-16 z-2",
                className
            )}
            {...props}
        >
            <p className='text-sm text-muted-foreground/50'>
                Construído pela equipe <TextLogo className='w-11 inline-flex align-sub' /> como
                projeto acadêmico na{" "}
                <Link
                    href='https://vemprafam.com.br/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline'
                >
                    FAM
                </Link>
                . © {new Date().getFullYear()} Fixr. Código disponível no{" "}
                <Link
                    href='https://github.com/fixrfam/fixr'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline'
                >
                    GitHub
                </Link>
                .
            </p>
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <Link href='/legal/privacy-policy' className='hover:underline'>
                    Política de Privacidade
                </Link>
                <Link href='/legal/terms-and-conditions' className='hover:underline'>
                    Termos de Uso
                </Link>
            </div>
        </footer>
    );
}
