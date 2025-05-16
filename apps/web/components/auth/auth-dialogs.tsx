import { ArrowRight, Trash2 } from "lucide-react";
import CookieDialog from "../cookie-dialog";
import { cookieKey } from "@fixr/constants/cookies";
import { Logo } from "../svg/Logo";

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
                cookieKey={cookieKey("showVerifiedDialog")}
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
                open={showVerifiedDialog}
            >
                <div className='flex flex-col gap-4 items-center'>
                    <div className='flex items-center justify-center rounded-md bg-primary text-primary-foreground p-2'>
                        <Logo className='size-5' />
                    </div>
                    <div className='text-foreground space-y-1 text-center'>
                        <h2 className='font-bold tracking-tight text-2xl'>
                            Conta verificada com sucesso!
                        </h2>
                        <p className='text-muted-foreground'>
                            A verificação da sua conta foi concluída com sucesso.
                        </p>
                    </div>
                    <div className='text-foreground space-y-1 text-center'>
                        <p className='text-muted-foreground text-sm'>
                            O seu e-mail foi verificado com sucesso e a sua conta está pronta para
                            uso. Clique abaixo para entrar e começar a explorar.
                        </p>
                    </div>
                </div>
            </CookieDialog>
            <CookieDialog
                cookieKey={cookieKey("showDeletedDialog")}
                close={{
                    cta: "Fechar",
                    toast: {
                        text: "Até mais!",
                        description: "A sua conta foi excluída. Volte quando quiser.",
                    },
                }}
                open={showDeletedDialog}
            >
                <div className='flex flex-col gap-4 items-center'>
                    <Trash2 className='text-destructive size-8' />
                    <div className='text-foreground space-y-1 text-center'>
                        <h2 className='font-bold tracking-tight text-2xl'>
                            A sua conta foi excluída
                        </h2>
                        <p className='text-muted-foreground'>
                            Estamos tristes em ver você ir embora!
                        </p>
                    </div>
                    <div className='text-foreground space-y-1 text-center'>
                        <p className='text-muted-foreground text-sm'>
                            Se você decidir voltar, estaremos aqui para recebê-lo de volta. Sinta-se
                            à vontade para se inscrever novamente a qualquer momento!
                        </p>
                    </div>
                </div>
            </CookieDialog>
        </>
    );
}
