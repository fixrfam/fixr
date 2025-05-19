import { ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export default function AuthFormSuccess({
    title,
    description,
    paragraph,
}: {
    title: string;
    description: string;
    paragraph: string;
}) {
    return (
        <div className='flex flex-col items-center space-y-6'>
            <div className='p-4 bg-foreground rounded-lg'>
                <CircleCheck className='text-background' />
            </div>
            <div className='text-center space-y-1'>
                <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
                <p className='text-muted-foreground text-sm'>{description}</p>
            </div>
            <p className='text-center'>{paragraph}</p>
            <Link href='/auth/login'>
                <Button>
                    Ir para o login <ArrowRight />
                </Button>
            </Link>
        </div>
    );
}
