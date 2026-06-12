const SLUGIFY_SPACE_REGEX = /\s+/g;
const SLUGIFY_SPECIAL_REGEX = /[^\w-]/g;
const SLUGIFY_DUPLICATE_DASHES = /-+/g;
const SLUGIFY_TRIM_DASHES = /^-|-$/g;

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(SLUGIFY_SPACE_REGEX, "-")
		.replace(SLUGIFY_SPECIAL_REGEX, "")
		.replace(SLUGIFY_DUPLICATE_DASHES, "-")
		.replace(SLUGIFY_TRIM_DASHES, "");
}
