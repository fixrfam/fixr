import Link, { LinkProps } from "next/link";

export function DashLink({
    subdomain,
    href,
    ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & LinkProps & { subdomain: string }) {
    return <Link href={`/dashboard/${subdomain}${href}`} {...props} />;
}
