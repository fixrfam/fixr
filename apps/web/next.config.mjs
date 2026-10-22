import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Type-check the app only: specs and test helpers are checked by
	// `check-types`, and their inferred vitest types are not portable
	// declarations, which fails `next build`.
	typescript: {
		tsconfigPath: "tsconfig.build.json",
	},
	experimental: {
		staleTimes: {
			dynamic: 0,
			static: 0,
		},
	},
	pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX();

export default withMDX(nextConfig);
