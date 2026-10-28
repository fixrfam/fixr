import QueryClientWrapper from "@/lib/query-client";

/** Customer portal: passwordless area opened from the links sent by email. */
export default function PortalLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<main className="flex min-h-screen flex-col items-center px-4 py-20 md:px-6">
			<QueryClientWrapper>{children}</QueryClientWrapper>
		</main>
	);
}
