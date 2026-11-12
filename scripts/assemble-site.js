import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist");
const desk = resolve(root, "my-study-desk");
await mkdir(output, { recursive: true });
for (const file of ["index.html", "config.js", "schema.sql", "manifest.json", "sw.js"]) {
  await cp(resolve(desk, file), resolve(output, file));
}
const firebaseConfigPath = resolve(root, "firebase.json");
const firebaseConfig = JSON.parse(await readFile(firebaseConfigPath, "utf8"));
firebaseConfig.hosting.public = "dist";
firebaseConfig.hosting.rewrites = [
  { source: "/rankvault/**", destination: "/rankvault/index.html" },
  { source: "**", destination: "/index.html" }
];
await writeFile(firebaseConfigPath, JSON.stringify(firebaseConfig, null, 2) + "\n");
console.log("Unified site assembled: My Desk at / and RankVault AI at /rankvault/");
