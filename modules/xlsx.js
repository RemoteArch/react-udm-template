// xlsx-tools.mjs
// Module ESM pour navigateur (CDN -> global XLSX)
// Dépendance: SheetJS (xlsx.full.min.js) chargé via <script>.

const DEFAULT_CDN =
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

let _xlsxPromise = null;

/**
 * Assure que window.XLSX est chargé (via CDN).
 * @returns {Promise<any>} l'objet XLSX
 */
async function ensureXLSX({ cdn = DEFAULT_CDN, globalName = "XLSX" }) {
  if (typeof window === "undefined") {
    throw new Error("ensureXLSX() est prévu pour le navigateur (window requis).");
  }

  if (window[globalName]) return window[globalName];

  if (_xlsxPromise) return _xlsxPromise;

  _xlsxPromise = new Promise((resolve, reject) => {
    // évite double injection si déjà présent
    const existing = document.querySelector(`script[data-xlsx-cdn="true"]`);
    if (existing && window[globalName]) return resolve(window[globalName]);

    const script = document.createElement("script");
    script.src = cdn;
    script.async = true;
    script.defer = true;
    script.dataset.xlsxCdn = "true";

    script.onload = () => {
      if (!window[globalName]) {
        reject(new Error(`Script chargé mais window.${globalName} introuvable.`));
      } else {
        resolve(window[globalName]);
      }
    };
    script.onerror = () => reject(new Error(`Impossible de charger XLSX depuis: ${cdn}`));

    document.head.appendChild(script);
  });

  return _xlsxPromise;
}

/** --------- Helpers internes --------- */

async function toArrayBuffer(input) {
  if (input instanceof ArrayBuffer) return input;

  // File / Blob (input file)
  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return await input.arrayBuffer();
  }

  throw new TypeError("Entrée invalide: donne un File/Blob ou un ArrayBuffer.");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "export.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** --------- 1) Excel file -> JSON --------- */

/**
 * Lit un Excel (File/Blob/ArrayBuffer) et renvoie du JSON.
 * @returns {Promise<{sheetNames:string[], sheets: Record<string, any[]>, firstSheet: any[]}>}
 */
export const excelFileToJson = async (input, opts = {}) => {
  const XLSX = await ensureXLSX(opts.ensure || {});
  const ab = await toArrayBuffer(input);

  const workbook = XLSX.read(ab, {
    type: "array",
    cellDates: opts.cellDates ?? true,
    cellText: opts.cellText ?? false,
  });

  const sheetNames = workbook.SheetNames.slice();
  const sheets = {};

  const sheetToJsonOptions = {
    defval: opts.defval ?? null,
    raw: opts.raw ?? false,
    dateNF: opts.dateNF ?? "yyyy-mm-dd",
  };

  for (const name of sheetNames) {
    const ws = workbook.Sheets[name];
    sheets[name] = XLSX.utils.sheet_to_json(ws, sheetToJsonOptions);
  }

  const firstSheet = sheets[sheetNames[0]] || [];
  return { sheetNames, sheets, firstSheet };
}

/**
 * Variante: Excel depuis une URL (fetch) -> JSON
 */
export async function excelUrlToJson(url, opts = {}) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) sur ${url}`);
  const ab = await res.arrayBuffer();
  return excelFileToJson(ab, opts);
}

/** --------- 2) JSON -> Excel file --------- */

/**
 * Crée un Blob Excel à partir de:
 * - un tableau d'objets [{...}, {...}]
 * - OU un objet multi-feuilles { "Sheet1": [...], "Sheet2": [...] }
 * @returns {Promise<Blob>}
 */
export async function jsonToExcelBlob(data, opts = {}) {
  const XLSX = await ensureXLSX(opts.ensure || {});

  const wb = XLSX.utils.book_new();

  const bookType = opts.bookType ?? "xlsx";

  // Multi-sheets
  if (data && !Array.isArray(data) && typeof data === "object") {
    for (const [sheetName, rows] of Object.entries(data)) {
      const ws = XLSX.utils.json_to_sheet(rows ?? []);
      XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet");
    }
  } else {
    // Single sheet
    const sheetName = opts.sheetName ?? "Sheet1";
    const ws = XLSX.utils.json_to_sheet(data ?? []);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const out = XLSX.write(wb, { type: "array", bookType });
  return new Blob([out], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * JSON -> fichier Excel (download direct)
 */
export async function jsonToExcelDownload(data, opts = {}) {
  const blob = await jsonToExcelBlob(data, opts);
  downloadBlob(blob, opts.fileName ?? "export.xlsx");
}

/** --------- “Plein d’autres” utilitaires --------- */

/**
 * Excel -> CSV (par feuille)
 */
export async function excelFileToCsv(input, opts = {}) {
  const XLSX = await ensureXLSX(opts.ensure || {});
  const ab = await toArrayBuffer(input);

  const workbook = XLSX.read(ab, { type: "array" });
  const sheetNames = workbook.SheetNames.slice();
  const csvBySheet = {};

  for (const name of sheetNames) {
    const ws = workbook.Sheets[name];
    csvBySheet[name] = XLSX.utils.sheet_to_csv(ws, {
      FS: opts.FS ?? ",",
      RS: opts.RS ?? "\n",
    });
  }
  return { sheetNames, csvBySheet, firstCsv: csvBySheet[sheetNames[0]] || "" };
}

/**
 * JSON -> CSV (rapide)
 */
export function jsonToCsv(rows, { FS = ",", RS = "\n" } = {}) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r || {}).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );

  const esc = (v) => {
    const s = v == null ? "" : String(v);
    if (s.includes('"') || s.includes(FS) || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [];
  lines.push(headers.map(esc).join(FS));
  for (const r of rows) {
    lines.push(headers.map((h) => esc(r?.[h])).join(FS));
  }
  return lines.join(RS);
}

/**
 * Télécharge un CSV
 */
export function downloadCsv(csvString, fileName = "export.csv") {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, fileName);
}

/**
 * Renvoie juste la liste des feuilles d'un fichier Excel
 */
export async function getExcelSheetNames(input, opts = {}) {
  const XLSX = await ensureXLSX(opts.ensure || {});
  const ab = await toArrayBuffer(input);
  const workbook = XLSX.read(ab, { type: "array" });
  return workbook.SheetNames.slice();
}

/**
 * AOA (Array of Arrays) -> download Excel (utile si tu veux contrôler l'ordre des colonnes)
 */
export async function aoaToExcelDownload(aoa, opts = {}) {
  const XLSX = await ensureXLSX(opts.ensure || {});
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa ?? []);
  XLSX.utils.book_append_sheet(wb, ws, opts.sheetName ?? "Sheet1");

  const out = XLSX.write(wb, { type: "array", bookType: opts.bookType ?? "xlsx" });
  const blob = new Blob([out], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, opts.fileName ?? "export.xlsx");
}

/**
 * Lit un Excel (File/Blob/ArrayBuffer) et renvoie un tableau de tableaux (AOA).
 * Chaque feuille est convertie en Array of Arrays.
 * @param {File|Blob|ArrayBuffer} input - Fichier Excel
 * @param {Object} opts - Options
 * @returns {Promise<{sheetNames: string[], sheets: Record<string, any[][]>, firstSheet: any[][]}>}
 */
export async function excelFileToAoa(input, opts = {}) {
  const XLSX = await ensureXLSX(opts.ensure || {});
  const ab = await toArrayBuffer(input);

  const workbook = XLSX.read(ab, {
    type: "array",
    cellDates: opts.cellDates ?? true,
    cellText: opts.cellText ?? false,
  });

  const sheetNames = workbook.SheetNames.slice();
  const sheets = {};

  for (const name of sheetNames) {
    const ws = workbook.Sheets[name];
    sheets[name] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: opts.defval ?? null });
  }

  const firstSheet = sheets[sheetNames[0]] || [];
  return { sheetNames, sheets, firstSheet };
}
