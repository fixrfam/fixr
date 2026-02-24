import {
	SignedIn,
	SignedOut,
	SignInButton,
	SignOutButton,
	UserButton,
} from "@clerk/nextjs";
import { Lock, LogOut } from "lucide-react";
import Link from "next/link";
import Fixr from "@/components/fixr";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<main className="flex h-dvh w-full items-center justify-center px-4">
			<div className="flex flex-col space-y-6">
				<Fixr className="w-12 text-[#1E64FD]" />
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						Painel de administrador
					</h1>
					<p className="traking-tight text-muted-foreground">
						Crie empresas, admins e configure os negócios de nossos clientes.
					</p>
					<span className="inline-flex items-center gap-1 text-muted-foreground/50 text-xs">
						<Lock className="size-3" />
						Acesso restrito a desenvolvedores
					</span>
				</div>
				<SignedOut>
					<Button asChild>
						<SignInButton
							fallbackRedirectUrl={"/dash"}
							forceRedirectUrl={"/dash"}
						>
							Entrar
						</SignInButton>
					</Button>
				</SignedOut>
				<SignedIn>
					<hr />
					<div className="flex items-center justify-between">
						<Button asChild className="max-w-xs grow">
							<Link href="/dash">Dashboard</Link>
						</Button>
						<div className="inline-flex items-center gap-2">
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
