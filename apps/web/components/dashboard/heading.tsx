import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export function Heading({
    title,
    description,
    Icon,
}: {
    title: ReactNode;
    description: ReactNode;
    Icon?: LucideIcon;
}) {
    return (
        <div className='flex gap-4 items-center'>
            {Icon && (
                <div className='size-12 bg-primary rounded-md grid place-items-center'>
                    <Icon className='size-6 text-white' />
                </div>
            )}
            <div>
                <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
                <p className='text-muted-foreground text-sm'>{description}</p>
            </div>
        </div>
    );
}
