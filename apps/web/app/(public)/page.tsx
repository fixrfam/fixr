import Features from '@/components/home/sections/Features'
import Hero from '@/components/home/sections/hero/Hero'

export default function Home() {
  return (
    <main className="flex flex-col gap-8 items-center w-full p-8 py-24">
      <Hero />
      <Features className="z-2 mt-10" />
    </main>
  )
}
