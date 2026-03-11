import { cookieKey } from "@fixr/constants/cookies";
import { ArrowRight, Trash2 } from "lucide-react";
import CookieDialog from "../cookie-dialog";
import { Logo } from "../svg/logo";

export function AuthDialogs({
	showVerifiedDialog,
	showDeletedDialog,
}: {
	showVerifiedDialog: boolean;
	showDeletedDialog: boolean;
}) {
	return (
		<>
			<CookieDialog
				close={{
					cta: (
						<>
							Iniciar <ArrowRight />
						</>
					),
					toast: {
						text: "Entre para explorar o app.",
						description: "Estamos esperando por voc!",
					},
				}}
				cookieKey={cookieKey("showVerifiedDialog")}
				open={showVerifiedDialog}
			>
				<div className="flex flex-col items-center gap-4">
					<div className="flex items-center justify-center rounded-md bg-primary p-2 text-primary-foreground">
						<Logo className="size-5" />
					</div>
					<div className="space-y-1 text-center text-foreground">
						<h2 className="font-bold text-2xl tracking-tight">
							Conta verificada com sucesso!
						</h2>
						<p className="text-muted-foreground">
							A verificação da sua conta foi concluída com sucesso.
						</p>
					</div>
					<div className="space-y-1 text-center text-foreground">
						<p className="text-muted-foreground text-sm">
							O seu e-mail foi verificado com sucesso e a sua conta está pronta
							para uso. Clique abaixo para entrar e começar a explorar.
						</p>
					</div>
				</div>
			</CookieDialog>
			<CookieDialog
				close={{
					cta: "Fechar",
					toast: {
						text: "Até mais!",
						description: "A sua conta foi excluída. Volte quando quiser.",
					},
				}}
				cookieKey={cookieKey("showDeletedDialog")}
				open={showDeletedDialog}
			>
				<div className="flex flex-col items-center gap-4">
					<Trash2 className="size-8 text-destructive" />
					<div className="space-y-1 text-center text-foreground">
						<h2 className="font-bold text-2xl tracking-tight">
							A sua conta foi excluída
						</h2>
						<p className="text-muted-foreground">
							Estamos tristes em ver você ir embora!
						</p>
					</div>
					<div className="space-y-1 text-center text-foreground">
						<p className="text-muted-foreground text-sm">
							Se você decidir voltar, estaremos aqui para recebê-lo de volta.
							Sinta-se à vontade para se inscrever novamente a qualquer momento!
						</p>
					</div>
				</div>
			</CookieDialog>
		</>
	);
}
