import { ExternalLink, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppPreview } from "./AppPreview";
import { TextAnimate } from "@/components/magicui/text-animate";
import { BlurFade } from "@/components/magicui/blur-fade";

export default function Hero() {
    return (
        <section className='w-full max-w-7xl flex flex-col gap-10 justify-center items-start py-2 lg:py-10 space-y-6 z-[2]'>
            <div className='flex flex-col w-full items-start gap-4 z-[3]'>
                <BlurFade delay={0.3} direction='up' inView>
                    <div className='bg-primary/15 border-[1px] border-primary text-primary px-3 py-2 text-xs md:px-4 md:py-2 md:text-sm rounded-full font-light shadow-[0_4px_30_-8px_var(--primary-500)]'>
                        <WandSparkles className='w-4 h-4 inline-block mr-2' />
                        Simplifique e expanda
                    </div>
                </BlurFade>
                <div className='flex flex-col lg:flex-row justify-between gap-4 lg:gap-8 w-full'>
                    <div>
                        <h1 className='text-2xl sm:text-5xl lg:text-4xl 2lg:text-5xl xl:text-5.5xl font-light'>
                            <TextAnimate as='span' animation='blurInUp' by='character'>
                                O jeito
                            </TextAnimate>{" "}
                            <TextAnimate
                                className='font-heading'
                                as='span'
                                animation='blurInUp'
                                by='character'
                                delay={0.3}
                            >
                                fácil
                            </TextAnimate>{" "}
                            <TextAnimate
                                as='span'
                                animation='blurInUp'
                                by='character'
                                delay={0.3 * 2}
                            >
                                de gerenciar sua
                            </TextAnimate>
                            <br />
                            <TextAnimate
                                className='font-heading'
                                as='span'
                                animation='slideUp'
                                by='word'
                                delay={0.3 * 3}
                            >
                                assistência técnica
                            </TextAnimate>
                        </h1>
                    </div>
                    <div className='space-y-8 lg:space-y-4 lg:w-[28rem]'>
                        <TextAnimate
                            as='p'
                            className='text-sm lg:text-base max-w-lg font-light'
                            animate='slideUp'
                            by='word'
                            delay={0.3}
                            duration={1}
                        >
                            Consolide suas ordens de serviço, o controle de estoque e o
                            acompanhamento dos consertos em um só lugar.
                        </TextAnimate>
                        <div className='flex gap-4'>
                            <BlurFade delay={0.3 * 2} inView>
                                <Link href='/auth/login'>
                                    <Button className='font-light'>Acessar o Fixr</Button>
                                </Link>
                            </BlurFade>
                            <BlurFade delay={0.3 * 2 + 0.15} inView>
                                <Link href={process.env.NEXT_PUBLIC_DOCS_URL ?? "/"}>
                                    <Button variant='outline' className='font-light'>
                                        Documentação{" "}
                                        <ExternalLink className='w-5 h-5 inline-block ml-2' />
                                    </Button>
                                </Link>
                            </BlurFade>
                        </div>
                    </div>
                </div>
            </div>
            <AppPreview />
        </section>
    );
}
