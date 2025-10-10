import Image from "next/image";
import LoginBg from "@/public/login_bg.webp";
import Link from "next/link";
import { Logo } from "@/components/svg/Logo";
import { TextAnimate } from "@/components/magicui/text-animate";
import { BlurFade } from "@/components/magicui/blur-fade";

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div className='grid min-h-svh lg:grid-cols-2 p-6 w-full pt-24'>
                <div className='relative hidden bg-muted lg:block rounded-3xl overflow-clip'>
                    <Image
                        src={LoginBg}
                        alt='Uma pessoa consertando um laptop com uma chave de fenda.'
                        className='absolute inset-0 h-full w-full object-cover'
                    />
                    <div className='absolute z-10 size-full flex flex-col justify-between px-16 py-12 xl:px-20 xl:py-16'>
                        <BlurFade direction='up'>
                            <Logo className='w-14 text-white shrink-0' />
                        </BlurFade>
                        <h1 className='text-[3.875rem] xl:text-[4.5rem] leading-18 xl:leading-21 tracking-tight text-white'>
                            <TextAnimate animation='blurInUp' by='character' as='span' delay={0.15}>
                                Gerenciando
                            </TextAnimate>
                            <br />{" "}
                            <TextAnimate
                                animation='blurInUp'
                                by='character'
                                as='b'
                                delay={0.15 * 2}
                            >
                                serviços
                            </TextAnimate>{" "}
                            <TextAnimate
                                animation='blurInUp'
                                by='character'
                                as='span'
                                delay={0.15 * 3}
                            >
                                com
                            </TextAnimate>
                            <br />
                            {""}
                            <TextAnimate
                                animation='blurInUp'
                                by='character'
                                as='b'
                                delay={0.15 * 4}
                            >
                                excelência.
                            </TextAnimate>
                        </h1>
                        <BlurFade direction='up' delay={0.3}>
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
                        </BlurFade>
                    </div>
                </div>
                <div className='flex flex-col gap-4 p-6 md:p-10'>
                    <div className='flex flex-1 items-center justify-center'>
                        <BlurFade>
                            <div className='w-full max-w-xs'>{children}</div>
                        </BlurFade>
                    </div>
                </div>
            </div>
        </>
    );
}
