import { join } from "node:path";
import { cwd } from "node:process";
import { Font } from "@react-pdf/renderer";

export const PDF_FONT_FAMILY = "Inter";

let registered = false;

/**
 * Register the Inter font used by every PDF.
 *
 * The files live in `apps/server/public/fonts` and are resolved from the
 * working directory (like `@fastify/static` serves `public/`), so the path
 * survives the tsup bundle, unlike a path relative to the source file.
 */
export function registerPdfFonts() {
	if (registered) {
		return;
	}

	const fontsDir = join(cwd(), "public", "fonts");
	Font.register({
		family: PDF_FONT_FAMILY,
		fonts: [
			{ src: join(fontsDir, "Inter-Regular.ttf"), fontWeight: 400 },
			{ src: join(fontsDir, "Inter-SemiBold.ttf"), fontWeight: 600 },
		],
	});
	// Keep words whole: react-pdf hyphenates English rules into Portuguese otherwise.
	Font.registerHyphenationCallback((word) => [word]);
	registered = true;
}
