import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";
import toIco from "to-ico";

const input = join(process.cwd(), "public/hypeauction-favicon.png");
const output = join(process.cwd(), "src/app/favicon.ico");
const sizes = [16, 32, 48];

const buffers = await Promise.all(
  sizes.map((size) =>
    sharp(input)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer(),
  ),
);

await writeFile(output, await toIco(buffers));
console.log(`Wrote ${output}`);
