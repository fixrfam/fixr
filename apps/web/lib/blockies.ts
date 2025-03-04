/**
 * Blockies: A tiny library for generating identicons.
 * Original repository: https://github.com/download13/blockies
 * Converted to TypeScript and to use SVGs instead of canvas
 */

type Options = {
    seed?: string;
    size?: number;
    scale?: number;
    color?: string;
    bgcolor?: string;
    spotcolor?: string;
};

const randseed: number[] = new Array(4).fill(0);

function seedrand(seed: string): void {
    randseed.fill(0);
    for (let i = 0; i < seed.length; i++) {
        const index = i % 4;
        randseed[index] =
            ((randseed[index] ?? 0) << 5) - (randseed[index] ?? 0) + seed.charCodeAt(i);
    }
}

function rand(): number {
    if (randseed.some((value) => value === undefined)) {
        throw new Error("randseed is not properly initialized");
    }
    const t = (randseed[0] ?? 0) ^ ((randseed[0] ?? 0) << 11);
    randseed[0] = randseed[1] ?? 0;
    randseed[1] = randseed[2] ?? 0;
    randseed[2] = randseed[3] ?? 0;
    randseed[3] = (randseed[3] ?? 0) ^ ((randseed[3] ?? 0) >> 19) ^ t ^ (t >> 8);
    return ((randseed[3] ?? 0) >>> 0) / ((1 << 31) >>> 0);
}

function createColor(): string {
    const h = Math.floor(rand() * 360);
    const s = `${rand() * 60 + 40}%`;
    const l = `${(rand() + rand() + rand() + rand()) * 25}%`;
    return `hsl(${h},${s},${l})`;
}

function createImageData(size: number): number[] {
    const width = size;
    const height = size;
    const dataWidth = Math.ceil(width / 2);
    const mirrorWidth = width - dataWidth;
    const data: number[] = [];

    for (let y = 0; y < height; y++) {
        let row: number[] = [];
        for (let x = 0; x < dataWidth; x++) {
            row[x] = Math.floor(rand() * 2.3);
        }
        const r = row.slice(0, mirrorWidth).reverse();
        row = row.concat(r);
        data.push(...row);
    }

    return data;
}

function buildOpts(opts: Options): Required<Options> {
    const seed = opts.seed || Math.floor(Math.random() * Math.pow(10, 16)).toString(16);
    seedrand(seed);
    return {
        seed,
        size: opts.size || 8,
        scale: opts.scale || 4,
        color: opts.color || createColor(),
        bgcolor: opts.bgcolor || createColor(),
        spotcolor: opts.spotcolor || createColor(),
    };
}

/**
 * Generates an SVG-based identicon as a Data URL.
 */
export function createIconSVG(opts: Options): string {
    const builtOpts = buildOpts(opts);
    const imageData = createImageData(builtOpts.size);
    const width = Math.sqrt(imageData.length);
    const scale = builtOpts.scale;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${
        builtOpts.size * scale
    } ${builtOpts.size * scale}" width="${builtOpts.size * scale}" height="${
        builtOpts.size * scale
    }">`;

    // Background color
    svg += `<rect width="100%" height="100%" fill="${builtOpts.bgcolor}" />`;

    // Foreground pixels
    for (let i = 0; i < imageData.length; i++) {
        if (imageData[i]) {
            const row = Math.floor(i / width);
            const col = i % width;
            const fill = imageData[i] === 1 ? builtOpts.color : builtOpts.spotcolor;

            svg += `<rect x="${col * scale}" y="${
                row * scale
            }" width="${scale}" height="${scale}" fill="${fill}" />`;
        }
    }

    svg += `</svg>`;

    // Convert SVG string to a data URL
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}
