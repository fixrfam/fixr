import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type DashLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
	href: string;
	subdomain: string;
	children: ReactNode;
};

export function DashLink({
	href,
	subdomain,
	children,
	...props
}: DashLinkProps) {
	const normalizedHref = href.startsWith("/") ? href : `/${href}`;
	const hrefWithSubdomain = `/dashboard/${subdomain}${normalizedHref}`;

	return (
		<Link href={hrefWithSubdomain} {...props}>
			{children}
		</Link>
	);
}
