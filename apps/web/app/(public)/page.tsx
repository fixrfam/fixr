import Features from "@/components/home/sections/features";
import Hero from "@/components/home/sections/hero/hero";

export default function Home() {
	return (
		<main className="flex w-full flex-col items-center gap-8 p-8 py-24">
			<Hero />
			<Features className="z-2 mt-10" />
		</main>
	);
}
