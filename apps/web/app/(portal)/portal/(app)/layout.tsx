import { PortalShell } from "@/components/portal/portal-shell";

export default function PortalAppLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return <PortalShell>{children}</PortalShell>;
}
