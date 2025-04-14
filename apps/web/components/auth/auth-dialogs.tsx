import { ArrowRight, Trash2 } from "lucide-react";
import CookieDialog from "../cookie-dialog";
import { cookieKey } from "@repo/constants/cookies";
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
                            Start <ArrowRight />
                        </>
                    ),
                    toast: {
                        text: "Login to explore the app.",
                        description: "We are waiting for you!",
                    },
                }}
                open={showVerifiedDialog}
            >
                <div className='flex flex-col gap-4 items-center'>
                    <div className='flex items-center justify-center rounded-md bg-primary text-primary-foreground p-2'>
                        <Logo className='size-5' />
                    </div>
                    <div className='text-foreground space-y-1 text-center'>
                        <h2 className='font-bold tracking-tight text-2xl'>Account Verified! 🎉</h2>
                        <p className='text-muted-foreground'>
                            Your account verification is complete.
                        </p>
                    </div>
                    <div className='text-foreground space-y-1 text-center'>
                        <p className='text-muted-foreground text-sm'>
                            Your email has been successfully verified, and your account is ready to
                            go. Click below to log in and start exploring.
                        </p>
                    </div>
                </div>
            </CookieDialog>
            <CookieDialog
                cookieKey={cookieKey("showDeletedDialog")}
                close={{
                    cta: "Close",
                    toast: {
                        text: "Goodbye for now!",
                        description: "Your account is deleted. Come back anytime.",
                    },
                }}
                open={showDeletedDialog}
            >
                <div className='flex flex-col gap-4 items-center'>
                    <Trash2 className='text-destructive size-8' />
                    <div className='text-foreground space-y-1 text-center'>
                        <h2 className='font-bold tracking-tight text-2xl'>
                            Your account has been deleted
                        </h2>
                        <p className='text-muted-foreground'>We&apos;re sorry to see you go!</p>
                    </div>
                    <div className='text-foreground space-y-1 text-center'>
                        <p className='text-muted-foreground text-sm'>
                            If you ever decide to return, we&apos;ll be here to welcome you back.
                            Feel free to sign up again anytime!
                        </p>
                    </div>
                </div>
            </CookieDialog>
        </>
    );
}
