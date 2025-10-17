import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MdxLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <div id='gradient' className='absolute bg-primary/40 w-full h-[30rem] z-0'>
                <div
                    id='blackoverlay'
                    className='w-full h-full bg-gradient-to-b from-transparent to-background'
                ></div>
            </div>
            <main className='max-w-7xl mx-auto z-10 relative px-6 pt-32'>
                <Link href={"/"} className='text-muted-foreground text-sm'>
                    <ArrowLeft className='scale-75 inline-block' /> Voltar para o início
                </Link>
                <div className='flex gap-4 items-center flex-wrap my-6'>
                    <a id='badge' className='px-6 py-2 text-xs bg-primary rounded-full text-white'>
                        Termos legais
                    </a>
                    <p className='text-muted-foreground text-sm'>
                        Atualizado por último em: 16/10/2025
                    </p>
                </div>
                <article className='max-w-3xl grid grid-cols-1 gap-5 pb-20'>{children}</article>
            </main>
        </>
    );
}
