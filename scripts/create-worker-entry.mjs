import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";

const distDirectory = resolve("dist");
const outputPath = resolve("dist/server/index.js");

const contentTypes = {
  ".css": "text/css; charset=UTF-8",
  ".html": "text/html; charset=UTF-8",
  ".js": "text/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".svg": "image/svg+xml",
};

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "server" || entry.name === ".openai") continue;

    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else {
      const route = `/${relative(distDirectory, fullPath).split(sep).join("/")}`;
      const body = (await readFile(fullPath)).toString("base64");
      files.push({
        body,
        contentType: contentTypes[extname(fullPath).toLowerCase()] ?? "application/octet-stream",
        route,
      });
    }
  }

  return files;
}

const files = await collectFiles(distDirectory);
const fileTable = JSON.stringify(Object.fromEntries(files.map(({ route, contentType, body }) => [route, { body, contentType }])));

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `const files = ${fileTable};\n\n` +
    `function decode(value) {\n` +
    `  const binary = atob(value);\n` +
    `  const bytes = new Uint8Array(binary.length);\n` +
    `  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);\n` +
    `  return bytes;\n` +
    `}\n\n` +
    `const worker = {\n` +
    `  async fetch(request) {\n` +
    `    const url = new URL(request.url);\n` +
    `    const route = url.pathname === "/" ? "/index.html" : url.pathname;\n` +
    `    const asset = files[route] ?? (!route.includes(".") ? files["/index.html"] : null);\n` +
    `    if (!asset) return new Response("Not found", { status: 404 });\n` +
    `    return new Response(decode(asset.body), {\n` +
    `      headers: {\n` +
    `        "content-type": asset.contentType,\n` +
    `        "cache-control": route === "/index.html" ? "no-cache" : "public, max-age=31536000, immutable",\n` +
    `      },\n` +
    `    });\n` +
    `  },\n` +
    `};\n\n` +
    `export default worker;\n`,
  "utf8",
);
