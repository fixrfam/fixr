import { Button } from "@/components/ui/button";
import { SignInButton, SignOutButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Fixr from "@/components/Fixr";

export default function Home() {
    return (
        <main className='w-full h-dvh flex items-center justify-center'>
            <div className='flex flex-col items-center gap-2'>
                <Fixr className='w-12 text-[#1E64FD]' />
                <SignedOut>
                    <Button asChild>
                        <SignInButton forceRedirectUrl={"/dash"} fallbackRedirectUrl={"/dash"} />
                    </Button>
                </SignedOut>
                <SignedIn>
                    <UserButton />
                    <Button asChild>
                        <Link href='/dash'>Go to dash</Link>
                    </Button>
                    <SignOutButton>Signout</SignOutButton>
                </SignedIn>
            </div>
        </main>
    );
}
