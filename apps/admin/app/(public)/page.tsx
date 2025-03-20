import { Button } from "@/components/ui/button";
import { SignInButton, SignOutButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Fixr from "@/components/Fixr";
import { Lock, LogOut } from "lucide-react";

export default function Home() {
    return (
        <main className='w-full h-dvh flex items-center justify-center px-4'>
            <div className='flex flex-col space-y-6'>
                <Fixr className='w-12 text-[#1E64FD]' />
                <div>
                    <h1 className='text-2xl tracking-tight font-semibold'>
                        Painel de administrador
                    </h1>
                    <p className='traking-tight text-muted-foreground'>
                        Crie organizações, admins e configure as empresas de nossos clientes.
                    </p>
                    <span className='inline-flex items-center gap-1 text-xs text-muted-foreground/50'>
                        <Lock className='size-3' />
                        Acesso restrito a desenvolvedores
                    </span>
                </div>
                <SignedOut>
                    <Button asChild>
                        <SignInButton forceRedirectUrl={"/dash"} fallbackRedirectUrl={"/dash"}>
                            Entrar
                        </SignInButton>
                    </Button>
                </SignedOut>
                <SignedIn>
                    <hr></hr>
                    <div className='flex justify-between items-center '>
                        <Button asChild className='flex-grow max-w-xs'>
                            <Link href='/dash'>Dashboard</Link>
                        </Button>
                        <div className='inline-flex gap-2 items-center'>
                            <Button asChild variant={"ghost"}>
                                <SignOutButton>
                                    <span>
                                        Sair <LogOut />
                                    </span>
                                </SignOutButton>
                            </Button>
                            <UserButton />
                        </div>
                    </div>
                </SignedIn>
            </div>
        </main>
    );
}
