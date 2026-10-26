import { PageProgress } from "@/components/home/page-progress";
import Cta from "@/components/home/sections/cta";
import Faq from "@/components/home/sections/faq";
import Features from "@/components/home/sections/features";
import Hero from "@/components/home/sections/hero/hero";
import HowItWorks from "@/components/home/sections/how-it-works";
import Problem from "@/components/home/sections/problem";
import Proof from "@/components/home/sections/proof";
import Roles from "@/components/home/sections/roles";
import Tagline from "@/components/home/sections/tagline";

export const dynamic = "force-dynamic";

export default function Home() {
	return (
		<main
			className="flex w-full flex-col items-center gap-24 overflow-x-clip p-4 py-24 sm:p-8 sm:py-24 md:gap-40"
			id="main"
		>
			<Hero />
			<Problem />
			<Features className="z-2" />
			<Tagline />
			<HowItWorks />
			<Roles />
			<Proof />
			<Faq />
			<Cta />
			<PageProgress />
		</main>
	);
}
