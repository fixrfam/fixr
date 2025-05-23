import type { Metadata } from "next";
import { APP_NAME } from "@fixr/constants/app";
import { Logo } from "@/components/svg/Logo";
import { SessionProvider } from "@/lib/hooks/use-session";
import Image from "next/image";
import LoginBg from "@/public/login_bg.webp";
import { TextLogo } from "@/components/svg/TextLogo";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Create Next App",
    description: "Generated by create next app",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <SessionProvider>
                <div className='grid min-h-svh lg:grid-cols-2 p-6'>
                    <div className='relative hidden bg-muted lg:block rounded-3xl overflow-clip'>
                        <Image
                            src={LoginBg}
                            alt='Uma pessoa consertando um laptop com uma chave de fenda.'
                            className='absolute inset-0 h-full w-full object-cover'
                        />
                        <div className='absolute z-10 size-full flex flex-col justify-between px-16 py-12 xl:px-20 xl:py-16'>
                            <TextLogo className='w-20 text-white shrink-0' />
                            <h1 className='text-[3.875rem] xl:text-[4.5rem] leading-[4.5rem] xl:leading-[5.25rem] tracking-tight text-white'>
                                Gerenciando <br /> <b>serviços</b> com <br />
                                <b>excelência</b>.
                            </h1>
                            <div>
                                <p className='text-xl text-white'>Faça login para começar.</p>
                                <Link
                                    href='https://unsplash.com/pt-br/fotografias/uma-pessoa-trabalhando-em-um-laptop-com-uma-caneta-XTs2Fl2iXkY'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    <p className='hover:underline text-white/50'>
                                        Foto de Samsung Memory na Unsplash
                                    </p>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col gap-4 p-6 md:p-10'>
                        <div className='flex flex-1 items-center justify-center'>
                            <div className='w-full max-w-xs'>{children}</div>
                        </div>
                    </div>
                </div>
            </SessionProvider>
        </>
    );
}
