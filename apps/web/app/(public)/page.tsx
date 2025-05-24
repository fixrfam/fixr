import Features from "@/components/home/sections/Features";
import Hero from "@/components/home/sections/hero/Hero";
import { LampContainer } from "@/components/ui/lamp";

export default function Home() {
    return (
        <main className='flex flex-col gap-8 items-center w-full p-8 py-24'>
            <Hero />
            <LampContainer className='-translate-y-[35%] hidden lg:flex'>{null}</LampContainer>
            <Features className='lg:-mt-[95dvh] z-[2]' />
        </main>
    );
}
