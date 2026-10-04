// Kumpulkan prisma CLI + seluruh dependensi transitifnya ke ./prisma-cli.
// Dipakai di Dockerfile (stage builder) agar CLI bisa jalan di image runner
// tanpa harus menyalin semua node_modules.
import { readFileSync, existsSync, mkdirSync, cpSync, rmSync } from "fs";
import { join, dirname } from "path";

const root = "node_modules";
const out = "prisma-cli";
const seen = new Set();
const topLevel = new Set();

function depsOf(dir) {
  const p = join(dir, "package.json");
  if (!existsSync(p)) return [];
  const j = JSON.parse(readFileSync(p, "utf8"));
  return Object.keys({ ...(j.dependencies || {}), ...(j.optionalDependencies || {}) });
}

function topName(name) {
  return name.startsWith("@") ? name.split("/").slice(0, 2).join("/") : name.split("/")[0];
}

function walk(name) {
  const top = topName(name);
  if (seen.has(top)) return;
  seen.add(top);
  const dir = join(root, top);
  if (!existsSync(dir)) return;
  topLevel.add(top);
  for (const d of depsOf(dir)) walk(d);
}

walk("prisma");
walk("@prisma/client");

rmSync(out, { recursive: true, force: true });
for (const name of topLevel) {
  const dest = join(out, "node_modules", name);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(join(root, name), dest, { recursive: true, dereference: true });
}
console.log(`prisma-cli: ${topLevel.size} paket`);
