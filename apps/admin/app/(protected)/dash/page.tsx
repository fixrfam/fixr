import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
    return (
        <div>
            <Button asChild>
                <Link href='/dash/organizations/new'>Create a new organization</Link>
            </Button>
        </div>
    );
}
