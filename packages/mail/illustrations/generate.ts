/**
 * Draws the illustration at the top of each email: the process the email is
 * about, in three steps, built from pieces of Fixr's own interface (cards,
 * fields, buttons, a timeline). Flat, light and mostly blue.
 *
 * Run from the repo root: `bun packages/mail/illustrations/generate.ts`.
 * It writes the SVG sources next to this file and the PNGs the emails load to
 * `apps/web/public/emails/process`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 960;
const H = 400;

const c = {
	bg: "#f5f7fb",
	surface: "#ffffff",
	line: "#dde2ea",
	shadow: "#e8ecf3",
	text: "#e3e7ee",
	textStrong: "#c9cfd9",
	ink: "#0b0d12",
	blue: "#1F65FE",
	blueSoft: "#e8f0ff",
	blueMid: "#b9d0ff",
	red: "#dc2626",
	redSoft: "#fdecec",
};

type Svg = string;

const r = (
	x: number,
	y: number,
	w: number,
	h: number,
	fill: string,
	rx = 0,
	extra = ""
): Svg =>
	`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;

/** A surface of the app: white, hairline border, a soft drop under it. */
const card = (x: number, y: number, w: number, h: number, rx = 14): Svg =>
	r(x + 2, y + 6, w, h, c.shadow, rx) +
	r(x, y, w, h, c.surface, rx, `stroke="${c.line}" stroke-width="1.5"`);

/** A line of text, drawn as a bar. */
const text = (x: number, y: number, w: number, color = c.text, h = 8): Svg =>
	r(x, y, w, h, color, h / 2);

const circle = (
	cx: number,
	cy: number,
	radius: number,
	fill: string,
	extra = ""
): Svg =>
	`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" ${extra}/>`;

const path = (d: string, stroke: string, width = 2.5, extra = ""): Svg =>
	`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

const check = (cx: number, cy: number, size: number, stroke = "#ffffff"): Svg =>
	path(
		`M${cx - size * 0.45},${cy} L${cx - size * 0.1},${cy + size * 0.35} L${cx + size * 0.5},${cy - size * 0.35}`,
		stroke,
		Math.max(2, size * 0.22)
	);

/** A button: filled for the action, outlined for the alternative. */
const button = (
	x: number,
	y: number,
	w: number,
	h: number,
	filled: boolean,
	color = c.blue
): Svg => {
	const label = Math.min(w * 0.46, 84);
	const lx = x + (w - label) / 2;
	return filled
		? r(x, y, w, h, color, 8) + text(lx, y + h / 2 - 3, label, "#ffffff", 6)
		: r(x, y, w, h, c.surface, 8, `stroke="${c.line}" stroke-width="1.5"`) +
				text(lx, y + h / 2 - 3, label, c.textStrong, 6);
};

/** An input field; `dots` draws a password in it. */
const field = (
	x: number,
	y: number,
	w: number,
	content: "text" | "dots" | "empty",
	focus = false
): Svg => {
	const box = r(
		x,
		y,
		w,
		34,
		c.surface,
		8,
		`stroke="${focus ? c.blue : c.line}" stroke-width="${focus ? 2 : 1.5}"`
	);
	if (content === "text")
		return box + text(x + 12, y + 13, w * 0.55, c.textStrong);
	if (content === "dots") {
		let dots = "";
		for (let i = 0; i < 8; i++)
			dots += circle(x + 16 + i * 13, y + 17, 3.6, focus ? c.blue : c.ink);
		return box + dots;
	}
	return box;
};

/** The step number, sitting on the connector above each scene. */
const badge = (cx: number, cy: number, n: number, color = c.blue): Svg =>
	circle(cx, cy, 15, color) +
	`<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="Inter,Arial,Helvetica,sans-serif" font-size="14" font-weight="600" fill="#ffffff">${n}</text>`;

/** The dashed line that carries the process from one step to the next. */
const connector = (x1: number, x2: number, y: number, color = c.blueMid): Svg =>
	path(`M${x1},${y} L${x2 - 8},${y}`, color, 2, 'stroke-dasharray="2 7"') +
	path(`M${x2 - 14},${y - 6} L${x2 - 7},${y} L${x2 - 14},${y + 6}`, color, 2);

/** The three badges and the line between them. */
const steps = (xs: number[], y = 48, last = c.blue): Svg =>
	connector(xs[0]! + 22, xs[1]! - 18, y) +
	connector(
		xs[1]! + 22,
		xs[2]! - 18,
		y,
		last === c.red ? "#f3b4b4" : c.blueMid
	) +
	xs.map((x, i) => badge(x, y, i + 1, i === 2 ? last : c.blue)).join("");

const COL = [180, 480, 780];

// ---------------------------------------------------------------- pieces

/** A phone: outline, screen and the notch. */
const phone = (x: number, y: number, w: number, h: number, screen: Svg): Svg =>
	r(x + 2, y + 6, w, h, c.shadow, 22) +
	r(x, y, w, h, c.ink, 22) +
	r(x + 7, y + 7, w - 14, h - 14, c.surface, 16) +
	r(x + w / 2 - 18, y + 13, 36, 7, c.ink, 4) +
	screen;

/** An envelope seen from the front, with its flap. */
const envelope = (
	x: number,
	y: number,
	w: number,
	h: number,
	accent = c.blue
): Svg =>
	r(x + 2, y + 6, w, h, c.shadow, 10) +
	r(x, y, w, h, c.surface, 10, `stroke="${c.line}" stroke-width="1.5"`) +
	path(
		`M${x + 6},${y + 8} L${x + w / 2},${y + h * 0.55} L${x + w - 6},${y + 8}`,
		accent,
		2.5
	);

/** A card on the board; `mine` is the one assigned to the reader. */
const boardCard = (x: number, y: number, w: number, mine: boolean): Svg =>
	r(
		x,
		y,
		w,
		44,
		mine ? c.blueSoft : c.surface,
		8,
		`stroke="${mine ? c.blue : c.line}" stroke-width="${mine ? 2 : 1.5}"`
	) +
	text(x + 10, y + 12, w * 0.7, mine ? c.blueMid : c.text) +
	text(x + 10, y + 26, w * 0.4, mine ? c.blueMid : c.text, 6);

/** The sidebar, its items, the current one highlighted. */
const sidebar = (x: number, y: number, h: number): Svg => {
	let s = r(x + 1, y + 1, 58, h - 2, "#f8f9fc", 11);
	s += r(x + 12, y + 14, 22, 22, c.blue, 6);
	for (let i = 0; i < 5; i++) {
		const active = i === 1;
		s += r(x + 10, y + 50 + i * 22, 40, 14, active ? c.blueSoft : "none", 5);
		s += text(
			x + 15,
			y + 53 + i * 22,
			active ? 30 : 26,
			active ? c.blue : c.text
		);
	}
	return s;
};

/** The sidebar and the board of the dashboard, small. */
const dashboard = (x: number, y: number, w: number, h: number): Svg => {
	let s = card(x, y, w, h, 12) + sidebar(x, y, h);
	const colW = (w - 58 - 16 * 4) / 3;
	[3, 2, 1].forEach((cards, col) => {
		const cx = x + 58 + 16 + col * (colW + 16);
		s += text(cx, y + 16, colW * 0.6, c.textStrong);
		for (let k = 0; k < cards; k++) {
			s += boardCard(cx, y + 34 + k * 52, colW, col === 1 && k === 0);
		}
	});
	return s;
};

/** The order timeline: done, done, the current stage, and what is left. */
const timeline = (
	x: number,
	y: number,
	rows: number,
	current: number,
	gap = 44
): Svg => {
	let s = "";
	for (let i = 0; i < rows; i++) {
		const cy = y + i * gap;
		if (i < rows - 1)
			s += path(
				`M${x},${cy + 12} L${x},${cy + gap - 12}`,
				i < current ? c.blue : c.line,
				2.5
			);
		if (i < current) s += circle(x, cy, 11, c.blue) + check(x, cy, 10);
		else if (i === current)
			s +=
				circle(x, cy, 11, c.surface, `stroke="${c.blue}" stroke-width="3"`) +
				circle(x, cy, 4.5, c.blue);
		else
			s += circle(
				x,
				cy,
				10,
				c.surface,
				`stroke="${c.line}" stroke-width="2.5"`
			);
		s += text(
			x + 24,
			cy - 9,
			i === current ? 96 : 80,
			i <= current ? c.textStrong : c.text
		);
		s += text(x + 24, cy + 4, 56, c.text, 6);
	}
	return s;
};

/** A person: the avatar the app shows next to a name. */
const avatar = (
	cx: number,
	cy: number,
	radius: number,
	fill = c.blueSoft,
	stroke = c.blue
): Svg =>
	circle(cx, cy, radius, fill) +
	circle(cx, cy - radius * 0.2, radius * 0.3, stroke) +
	`<path d="M${cx - radius * 0.56},${cy + radius * 0.62} A${radius * 0.56},${radius * 0.5} 0 0 1 ${cx + radius * 0.56},${cy + radius * 0.62} Z" fill="${stroke}"/>`;

/** A mouse pointer, the moment of the click. */
const pointer = (x: number, y: number): Svg =>
	`<path d="M${x},${y} L${x},${y + 26} L${x + 7},${y + 19} L${x + 12},${y + 30} L${x + 17},${y + 28} L${x + 12},${y + 17} L${x + 21},${y + 17} Z" fill="${c.ink}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>`;

/** A padlock, closed or open. */
const padlock = (cx: number, cy: number, open: boolean, color = c.blue): Svg =>
	path(
		open
			? `M${cx - 16},${cy - 8} L${cx - 16},${cy - 24} A16,16 0 0 1 ${cx + 16},${cy - 28}`
			: `M${cx - 16},${cy - 8} L${cx - 16},${cy - 22} A16,16 0 0 1 ${cx + 16},${cy - 22} L${cx + 16},${cy - 8}`,
		color,
		5
	) +
	r(cx - 26, cy - 10, 52, 42, color, 9) +
	circle(cx, cy + 7, 5, "#ffffff") +
	r(cx - 2, cy + 8, 4, 12, "#ffffff", 2);

// ---------------------------------------------------------------- scenes

const scenes: Record<string, () => Svg> = {
	/** The device comes in, the shop prices it, the customer answers, the repair starts. */
	estimate: () => {
		let s = steps(COL);
		// 1. The device, with the damage the shop looked at.
		s += phone(COL[0]! - 58, 92, 116, 236, "");
		s += path(
			`M${COL[0]! - 30},${130} L${COL[0]! - 6},${168} L${COL[0]! - 22},${184} L${COL[0]! + 14},${232} L${COL[0]! + 2},${250} L${COL[0]! + 26},${290}`,
			c.textStrong,
			2
		);
		s += circle(COL[0]! + 46, 112, 22, c.blue);
		s += circle(
			COL[0]! + 43,
			109,
			8,
			"none",
			`stroke="#ffffff" stroke-width="3.5"`
		);
		s += path(
			`M${COL[0]! + 49},${115} L${COL[0]! + 56},${122}`,
			"#ffffff",
			3.5
		);
		// 2. The estimate: items, prices, the total.
		const ex = COL[1]! - 118;
		s += card(ex, 84, 236, 262);
		s += text(ex + 20, 104, 90, c.textStrong);
		s += text(ex + 176, 104, 40, c.blueMid);
		for (let i = 0; i < 3; i++) {
			const y = 134 + i * 34;
			s += r(ex + 20, y - 4, 18, 18, i === 2 ? c.blueSoft : "#f1f3f7", 5);
			s += text(ex + 48, y + 1, [96, 76, 104][i]!);
			s += text(ex + 176, y + 1, 40, c.textStrong);
		}
		s += r(ex + 20, 236, 196, 1.5, c.line);
		s += text(ex + 20, 254, 48, c.textStrong);
		s += text(ex + 140, 251, 76, c.blue, 14);
		s += r(ex + 20, 290, 110, 36, c.blue, 8);
		s += check(ex + 40, 308, 12);
		s += text(ex + 56, 305, 52, "#ffffff", 6);
		s += button(ex + 140, 290, 76, 36, false);
		// 3. Approved: the order moves along its stages.
		s += card(COL[2]! - 110, 92, 220, 246);
		s += text(COL[2]! - 88, 112, 70, c.textStrong);
		s +=
			r(COL[2]! + 24, 106, 64, 20, c.blueSoft, 10) +
			text(COL[2]! + 34, 112, 44, c.blue, 8);
		s += timeline(COL[2]! - 80, 158, 4, 2, 46);
		return s;
	},

	/** The invite arrives, the person signs in, the board shows their orders. */
	invite: () => {
		let s = steps(COL);
		// 1. The invite, with the temporary password.
		s += envelope(COL[0]! - 92, 104, 184, 120);
		s += avatar(COL[0]!, 186, 22);
		s += card(COL[0]! - 92, 248, 184, 66, 12);
		s += text(COL[0]! - 74, 262, 60, c.textStrong, 6);
		s += field(COL[0]! - 74, 274, 148, "dots", true);
		// 2. Sign in.
		const lx = COL[1]! - 104;
		s += card(lx, 92, 208, 250);
		s += r(lx + 84, 112, 40, 40, c.blue, 10);
		s += r(lx + 96, 124, 16, 16, "#ffffff", 3);
		s += text(lx + 64, 166, 80, c.textStrong);
		s += field(lx + 20, 192, 168, "text");
		s += field(lx + 20, 236, 168, "dots", true);
		s += button(lx + 20, 286, 168, 36, true);
		s += pointer(lx + 150, 300);
		// 3. Their board: the department's columns, their card highlighted.
		s += dashboard(COL[2]! - 130, 104, 260, 226);
		return s;
	},

	/** The link arrives, the portal opens, every repair has its stage. */
	"portal-access": () => {
		let s = steps(COL);
		// 1. The private link.
		s += card(COL[0]! - 100, 132, 200, 150);
		s += circle(COL[0]!, 180, 30, c.blueSoft);
		s += `<g transform="rotate(-45 ${COL[0]!} 180)">${r(COL[0]! - 25, 171, 30, 18, "none", 9, `stroke="${c.blue}" stroke-width="3.5"`)}${r(COL[0]! - 5, 171, 30, 18, "none", 9, `stroke="${c.blue}" stroke-width="3.5"`)}</g>`;
		s += r(
			COL[0]! - 80,
			226,
			160,
			30,
			"#f8f9fc",
			8,
			`stroke="${c.line}" stroke-width="1.5"`
		);
		s += circle(COL[0]! - 64, 241, 5, c.blueMid);
		s += text(COL[0]! - 52, 237, 112, c.blueMid);
		// 2. The portal on the phone: each device and its stage.
		s += phone(COL[1]! - 74, 82, 148, 272, "");
		for (let i = 0; i < 3; i++) {
			const y = 120 + i * 72;
			const active = i === 0;
			s += r(
				COL[1]! - 56,
				y,
				112,
				60,
				active ? c.blueSoft : "#f8f9fc",
				10,
				`stroke="${active ? c.blue : c.line}" stroke-width="${active ? 2 : 1.5}"`
			);
			s += r(COL[1]! - 46, y + 12, 22, 36, active ? c.blue : c.textStrong, 5);
			s += text(COL[1]! - 16, y + 16, 58, active ? c.blueMid : c.textStrong);
			s += r(COL[1]! - 16, y + 32, 46, 14, active ? c.blue : c.text, 7);
		}
		// 3. One repair in detail: its stages and the estimate to answer.
		s += card(COL[2]! - 110, 92, 220, 250);
		s += timeline(COL[2]! - 82, 128, 3, 1, 44);
		s += r(COL[2]! - 92, 252, 184, 1.5, c.line);
		s += text(COL[2]! - 92, 268, 80, c.textStrong);
		s += button(COL[2]! - 92, 290, 108, 34, true);
		s += button(COL[2]! + 24, 290, 68, 34, false);
		return s;
	},

	/** The email arrives, the click confirms it, the account is ready. */
	verification: () => {
		let s = steps(COL);
		// 1. The confirmation email.
		s += envelope(COL[0]! - 92, 124, 184, 128);
		s += circle(COL[0]! + 70, 126, 22, c.blue) + check(COL[0]! + 70, 126, 18);
		// 2. The click on the button.
		s += card(COL[1]! - 110, 118, 220, 170);
		s += text(COL[1]! - 88, 140, 110, c.textStrong);
		s += text(COL[1]! - 88, 162, 170);
		s += text(COL[1]! - 88, 178, 140);
		s += button(COL[1]! - 88, 210, 128, 38, true);
		s += pointer(COL[1]! + 26, 226);
		// 3. The account, confirmed.
		s += card(COL[2]! - 110, 108, 220, 196);
		s += avatar(COL[2]!, 164, 34);
		s +=
			circle(
				COL[2]! + 28,
				190,
				13,
				c.blue,
				`stroke="#ffffff" stroke-width="3"`
			) + check(COL[2]! + 28, 190, 10);
		s += text(COL[2]! - 48, 220, 96, c.textStrong);
		s += text(COL[2]! - 64, 240, 128);
		s +=
			r(COL[2]! - 40, 262, 80, 22, c.blueSoft, 11) +
			text(COL[2]! - 26, 269, 52, c.blue);
		return s;
	},

	/** Locked out, the link arrives, a new password goes in. */
	"password-reset": () => {
		let s = steps(COL);
		// 1. The account, locked behind a forgotten password.
		s += card(COL[0]! - 100, 108, 200, 200);
		s += padlock(COL[0]!, 180, false);
		s += field(COL[0]! - 76, 244, 152, "dots");
		// 2. The email with the reset link.
		s += envelope(COL[1]! - 92, 104, 184, 118);
		s += card(COL[1]! - 92, 238, 184, 76, 12);
		s += button(COL[1]! - 72, 258, 120, 36, true);
		s += pointer(COL[1]! + 30, 272);
		// 3. The new password, and the strength bar filling up.
		s += card(COL[2]! - 110, 92, 220, 240);
		s += padlock(COL[2]!, 154, true);
		s += field(COL[2]! - 88, 206, 176, "dots", true);
		for (let i = 0; i < 4; i++)
			s += r(COL[2]! - 88 + i * 46, 250, 38, 6, i < 3 ? c.blue : c.text, 3);
		s += button(COL[2]! - 88, 276, 176, 36, true);
		return s;
	},

	/** The account and its data, the confirmation, and nothing left after it. */
	"account-deletion": () => {
		let s = steps(COL, 48, c.red);
		// 1. The account and the data tied to it.
		s += card(COL[0]! - 100, 92, 200, 246);
		s += avatar(COL[0]!, 138, 28);
		s += text(COL[0]! - 44, 178, 88, c.textStrong);
		for (let i = 0; i < 4; i++) {
			const y = 206 + i * 30;
			s += r(COL[0]! - 80, y, 18, 18, "#f1f3f7", 5);
			s += text(COL[0]! - 52, y + 5, [96, 76, 108, 84][i]!);
		}
		// 2. The confirmation, the one red button.
		s += envelope(COL[1]! - 92, 104, 184, 118, c.red);
		s += card(COL[1]! - 92, 238, 184, 76, 12);
		s += button(COL[1]! - 72, 258, 132, 36, true, c.red);
		s += pointer(COL[1]! + 42, 272);
		// 3. Nothing left: the same card, empty.
		s += r(
			COL[2]! - 100,
			92,
			200,
			246,
			"none",
			14,
			`stroke="${c.textStrong}" stroke-width="2" stroke-dasharray="6 7"`
		);
		s += circle(COL[2]!, 194, 30, c.redSoft);
		s += path(
			`M${COL[2]! - 14},${184} L${COL[2]! + 14},${184} M${COL[2]! - 10},${184} L${COL[2]! - 8},${210} L${COL[2]! + 8},${210} L${COL[2]! + 10},${184} M${COL[2]! - 5},${184} L${COL[2]! - 5},${178} L${COL[2]! + 5},${178} L${COL[2]! + 5},${184}`,
			c.red,
			2.5
		);
		s += text(COL[2]! - 50, 250, 100, c.text);
		s += text(COL[2]! - 34, 268, 68, c.text, 6);
		return s;
	},
};

async function main() {
	const here = import.meta.dir;
	const out = join(here, "../../../apps/web/public/emails/process");
	mkdirSync(out, { recursive: true });

	const sharp = require(
		join(process.cwd(), "node_modules/.bun/sharp@0.34.5/node_modules/sharp")
	);

	for (const [name, draw] of Object.entries(scenes)) {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	  <rect width="${W}" height="${H}" fill="${c.bg}"/>
	  ${draw()}
	</svg>
	`;
		writeFileSync(join(here, `${name}.svg`), svg);
		await sharp(Buffer.from(svg), { density: 144 })
			.png({ compressionLevel: 9, palette: true, quality: 90 })
			.toFile(join(out, `${name}.png`));
		console.log(`drew ${name}`);
	}
}

main();
