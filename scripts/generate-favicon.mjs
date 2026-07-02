import { stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

import pngToIco from "png-to-ico";
import sharp from "sharp";
import toIco from "to-ico";

const input = join(process.cwd(), "public/hypeauction-favicon.png");
const output = join(process.cwd(), "src/app/favicon.ico");
const sizes = [32, 16, 48];

const prepared = sharp(input).ensureAlpha().trim({ threshold: 5 });

const buffers = await Promise.all(
  sizes.map((size) =>
    prepared
      .clone()
      .resize(size, size, {
        fit: "cover",
        position: "center",
      })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  ),
);

let ico;
try {
  ico = await pngToIco(buffers);
} catch {
  ico = await toIco(buffers, { resize: false });
}

await writeFile(output, ico);

const { size } = await stat(output);
if (size <= 0) {
  throw new Error("favicon.ico generation failed: file is empty");
}

console.log(`Wrote ${output} (${size} bytes)`);
