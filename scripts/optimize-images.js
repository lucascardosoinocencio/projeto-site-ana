"use strict";

/**
 * Otimização de imagens para a landing page da Ana Julia.
 *
 * Lê tudo que estiver em `assents/`, gera 3 larguras (mobile/tablet/desktop)
 * em .webp + fallback .jpg, e ajusta a qualidade automaticamente até caber
 * na meta de peso de cada categoria de foto (hero / depoimento / galeria).
 *
 * Uso:
 *   npm run optimize-images
 *   npm run optimize-images -- depoimento     (processa só arquivos cujo nome contém "depoimento")
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT_DIR = path.join(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "assents");
const OUTPUT_DIR = path.join(ROOT_DIR, "assets-otimizadas");

const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Larguras máximas por breakpoint — a imagem nunca é esticada além do
// tamanho original (withoutEnlargement), só reduzida.
const BREAKPOINTS = [
  { name: "mobile", width: 480 },
  { name: "tablet", width: 1024 },
  { name: "desktop", width: 1920 },
];

// Qualidades tentadas em ordem decrescente até o arquivo caber na meta de KB.
// Isso evita ficar comprimindo demais fotos que já são pequenas.
const QUALITY_STEPS = [82, 75, 68, 60, 52, 45, 38, 30];

// Categoria é decidida pelo nome do arquivo. A primeira regra que bater
// vence — por isso "capa" (hero) e "depoimento" vêm antes do fallback de galeria.
const CATEGORIES = [
  { test: /\bcapa\b/, label: "hero", maxKB: 200 },
  { test: /depoimento/, label: "depoimento", maxKB: 60 },
  { test: /sala-atendimento/, label: "atendimento", maxKB: 150 }, // foto grande de fundo na seção scrollytelling
  { test: /.*/, label: "galeria", maxKB: 80 }, // fallback: técnicas, ambiente, antes/depois
];

function removeAccents(str) {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function slugify(str) {
  return removeAccents(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categorize(filename) {
  const normalized = removeAccents(filename).toLowerCase();
  return CATEGORIES.find((c) => c.test.test(normalized));
}

async function encodeWithTarget(pipeline, format, maxKB) {
  const maxBytes = maxKB * 1024;
  let last = null;

  for (const quality of QUALITY_STEPS) {
    const instance = pipeline.clone();
    const buffer =
      format === "webp"
        ? await instance.webp({ quality }).toBuffer()
        : await instance.jpeg({ quality, mozjpeg: true }).toBuffer();

    last = { buffer, quality };
    if (buffer.length <= maxBytes) {
      return { ...last, ok: true };
    }
  }

  return { ...last, ok: false };
}

async function processImage(filename, onlyFilter) {
  if (onlyFilter && !removeAccents(filename).toLowerCase().includes(onlyFilter)) {
    return [];
  }

  const rawExt = path.extname(filename);
  const ext = rawExt.toLowerCase();
  if (!VALID_EXT.has(ext)) return [];

  const baseName = slugify(path.basename(filename, rawExt));
  const category = categorize(filename);
  const inputPath = path.join(SOURCE_DIR, filename);
  const source = sharp(inputPath).rotate(); // rotate() normaliza orientação EXIF

  const rows = [];

  for (const bp of BREAKPOINTS) {
    const resized = source.clone().resize({ width: bp.width, withoutEnlargement: true });

    const outDir = path.join(OUTPUT_DIR, bp.name);
    fs.mkdirSync(outDir, { recursive: true });

    const webp = await encodeWithTarget(resized, "webp", category.maxKB);
    fs.writeFileSync(path.join(outDir, `${baseName}.webp`), webp.buffer);

    const jpg = await encodeWithTarget(resized, "jpeg", category.maxKB);
    fs.writeFileSync(path.join(outDir, `${baseName}.jpg`), jpg.buffer);

    rows.push({
      arquivo: filename,
      categoria: category.label,
      breakpoint: bp.name,
      "webp KB": (webp.buffer.length / 1024).toFixed(1),
      "webp q": webp.quality,
      "jpg KB": (jpg.buffer.length / 1024).toFixed(1),
      "jpg q": jpg.quality,
      "meta KB": category.maxKB,
      status: webp.ok && jpg.ok ? "ok" : "ACIMA DA META",
    });
  }

  return rows;
}

async function main() {
  const onlyFilter = process.argv[2] ? removeAccents(process.argv[2]).toLowerCase() : null;

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Pasta de origem não encontrada: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SOURCE_DIR).filter((f) => VALID_EXT.has(path.extname(f).toLowerCase()));

  if (files.length === 0) {
    console.log(`Nenhuma imagem encontrada em ${SOURCE_DIR}`);
    return;
  }

  console.log(`Processando ${files.length} imagem(ns) de assents/ -> assets-otimizadas/\n`);

  const allRows = [];
  for (const file of files) {
    const rows = await processImage(file, onlyFilter);
    allRows.push(...rows);
    if (rows.length) process.stdout.write(".");
  }
  console.log("\n");

  if (allRows.length === 0) {
    console.log("Nenhuma imagem bateu com o filtro informado.");
    return;
  }

  console.table(allRows);

  const acimaDaMeta = allRows.filter((r) => r.status !== "ok");
  if (acimaDaMeta.length) {
    console.warn(
      `\n${acimaDaMeta.length} arquivo(s) não couberam na meta de peso mesmo na qualidade mínima (${QUALITY_STEPS[QUALITY_STEPS.length - 1]}). Considere recortar/redimensionar a imagem original.`
    );
  } else {
    console.log("\nTodas as imagens atingiram a meta de peso.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
