import { ReactNode } from "react";

export function Heading({ title, description }: { title: ReactNode; description: ReactNode }) {
    return (
        <div>
            <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
            <p className='text-muted-foreground text-sm'>{description}</p>
        </div>
    );
}
