import { cn } from "@/lib/utils";
import { Feather } from "lucide-react";

export default function Features({ className }: { className?: string }) {
    return (
        <section
            id='features'
            className={cn(
                "w-full max-w-7xl flex flex-col gap-4 lg::gap-10 justify-center items-center",
                className
            )}
        >
            <div className='bg-background border-[1px] border-primary text-primary px-3 py-2 text-xs md:px-4 md:py-2 md:text-sm rounded-full font-light shadow-[0_4px_30_-8px_var(--primary-500)]'>
                <Feather className='w-4 h-4 inline-block mr-2' />
                Simples & intuitivo
            </div>
            <div className='space-y-4'>
                <h2 className='text-3xl md:text-5xl lg:text-6xl font-light text-center'>
                    Seu <span className='font-heading'>trabalho</span>, mais{" "}
                    <span className='font-heading'>fácil</span>
                </h2>
                <p className='text-base md:text-lg lg:text-2xl font-light text-center'>
                    O Fixr facilita o <b>workflow</b> em todas as áreas de sua assistência técnica.
                </p>
            </div>
        </section>
    );
}
