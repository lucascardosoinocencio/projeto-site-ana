"use strict";

/**
 * Otimização de vídeos de depoimento para a landing page da Ana Julia.
 *
 * Lê vídeos (.mov/.mp4) de `assents/`, converte pra H.264/AAC (compatível
 * com todo navegador — os originais do iPhone vêm em HEVC), redimensiona
 * pro maior lado nunca passar de MAX_WIDTH, e extrai um frame de poster
 * (mesma otimização de peso usada pelas fotos de depoimento).
 *
 * Uso:
 *   npm run optimize-videos
 *   npm run optimize-videos -- depoimento-video-1   (processa só um arquivo específico)
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const sharp = require("sharp");

const ROOT_DIR = path.join(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "assents");
const OUTPUT_DIR = path.join(ROOT_DIR, "assets-otimizadas", "videos");
const POSTER_OUTPUT_DIR = path.join(ROOT_DIR, "assets-otimizadas");

const VALID_EXT = new Set([".mov", ".mp4", ".m4v"]);

const MAX_WIDTH = 720; // suficiente pra vídeo vertical exibido em card de ~380-420px
const CRF = 27; // qualidade constante — mais alto = menor arquivo, 23-28 é o range comum pra web
const POSTER_QUALITY_STEPS = [82, 75, 68, 60, 52, 45, 38, 30];
const POSTER_MAX_KB = 60; // mesma meta usada pras fotos de depoimento

// Mapeia nome de arquivo de origem -> slug final. Ajuste aqui quando novos
// vídeos entrarem (o nome de origem do iPhone, tipo IMG_1234, não é
// descritivo o suficiente pra usar direto no HTML).
const NAME_MAP = {
  "img_8113": "depoimento-video-1",
  "img_8110": "depoimento-video-2",
  "img_8939 1": "depoimento-video-3",
};

function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveBaseName(filename) {
  const key = path.basename(filename, path.extname(filename)).toLowerCase();
  return NAME_MAP[key] || slugify(key);
}

async function encodePosterWithTarget(buffer) {
  const maxBytes = POSTER_MAX_KB * 1024;
  let last = null;

  for (const quality of POSTER_QUALITY_STEPS) {
    const out = await sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();
    last = { buffer: out, quality };
    if (out.length <= maxBytes) return { ...last, ok: true };
  }
  return { ...last, ok: false };
}

async function processVideo(filename, onlyFilter) {
  const baseName = resolveBaseName(filename);
  if (onlyFilter && !baseName.includes(onlyFilter)) return null;

  const ext = path.extname(filename).toLowerCase();
  if (!VALID_EXT.has(ext)) return null;

  const inputPath = path.join(SOURCE_DIR, filename);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const outputPath = path.join(OUTPUT_DIR, `${baseName}.mp4`);
  execFileSync("ffmpeg", [
    "-y",
    "-i", inputPath,
    "-vf", `scale='min(${MAX_WIDTH},iw)':-2`,
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", String(CRF),
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputPath,
  ]);

  const posterRaw = execFileSync("ffmpeg", [
    "-y",
    "-ss", "0.4",
    "-i", inputPath,
    "-frames:v", "1",
    "-vf", `scale='min(${MAX_WIDTH},iw)':-2`,
    "-f", "image2pipe",
    "-vcodec", "mjpeg",
    "pipe:1",
  ], { maxBuffer: 1024 * 1024 * 50 });

  const poster = await encodePosterWithTarget(posterRaw);
  const posterDir = path.join(POSTER_OUTPUT_DIR, "tablet");
  fs.mkdirSync(posterDir, { recursive: true });
  fs.writeFileSync(path.join(posterDir, `${baseName}-poster.jpg`), poster.buffer);

  const originalKB = fs.statSync(inputPath).size / 1024;
  const outputKB = fs.statSync(outputPath).size / 1024;

  return {
    arquivo: filename,
    slug: baseName,
    "original MB": (originalKB / 1024).toFixed(1),
    "final MB": (outputKB / 1024).toFixed(1),
    "poster KB": (poster.buffer.length / 1024).toFixed(1),
    "poster q": poster.quality,
    "poster status": poster.ok ? "ok" : "ACIMA DA META",
  };
}

async function main() {
  const onlyFilter = process.argv[2] ? slugify(process.argv[2]) : null;

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Pasta de origem não encontrada: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => VALID_EXT.has(path.extname(f).toLowerCase()));

  if (files.length === 0) {
    console.log(`Nenhum vídeo encontrado em ${SOURCE_DIR}`);
    return;
  }

  console.log(`Processando ${files.length} vídeo(s) de assents/ -> assets-otimizadas/videos/\n`);

  const rows = [];
  for (const file of files) {
    process.stdout.write(`  ${file}...`);
    const row = await processVideo(file, onlyFilter);
    if (row) {
      rows.push(row);
      console.log(" ok");
    } else {
      console.log(" pulado");
    }
  }

  if (rows.length === 0) {
    console.log("\nNenhum vídeo bateu com o filtro informado.");
    return;
  }

  console.log();
  console.table(rows);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
