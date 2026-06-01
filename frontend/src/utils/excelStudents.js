import * as XLSX from "xlsx";

const EXCEL_EPOCH_OFFSET = 25569;
const NISN_LENGTH = 10;

function findColumnIndex(header, names) {
  for (const n of names) {
    const i = header.findIndex((h) => h.includes(n));
    if (i >= 0) return i;
  }
  return -1;
}

/** Baca nilai sel sebagai teks — pertahankan tampilan Excel (leading zero, tanggal) */
function getCellText(sheet, row, col, { padNumericLength } = {}) {
  const ref = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[ref];
  if (!cell) return "";

  if (cell.w != null && String(cell.w).trim() !== "") {
    let text = String(cell.w).trim();
    if (text.startsWith("'")) text = text.slice(1);
    return text;
  }

  if (cell.t === "s") return String(cell.v).trim();

  if (cell.t === "n") {
    const num = Number(cell.v);
    if (padNumericLength != null && Number.isFinite(num)) {
      return String(Math.trunc(num)).padStart(padNumericLength, "0");
    }
    if (Number.isFinite(num) && num === Math.trunc(num)) {
      return String(Math.trunc(num));
    }
    return String(cell.v).trim();
  }

  if (cell.t === "d" && cell.v instanceof Date) {
    return excelDateToYMD(cell.v);
  }

  return String(cell.v ?? "").trim();
}

/** Konversi serial Excel → YYYY-MM-DD (UTC, tanpa mundur 1 hari) */
function excelSerialToYMD(serial) {
  const wholeDays = Math.floor(Number(serial));
  const ms = (wholeDays - EXCEL_EPOCH_OFFSET) * 86400 * 1000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function excelDateToYMD(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse tanggal dari sel Excel */
function parseBirthDateFromCell(sheet, row, col) {
  const ref = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[ref];
  if (!cell) return "";

  if (cell.w != null && String(cell.w).trim() !== "") {
    return normalizeDateString(String(cell.w).trim());
  }

  if (cell.t === "n" && typeof cell.v === "number") {
    return excelSerialToYMD(cell.v);
  }

  if (cell.t === "d" && cell.v instanceof Date) {
    return excelDateToYMD(cell.v);
  }

  if (cell.v != null && cell.v !== "") {
    return normalizeDateString(String(cell.v).trim());
  }

  return "";
}

function normalizeDateString(raw) {
  let t = raw.replace(/^'/, "").trim();
  if (!t) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;

  const dmy = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, "0");
    const m = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${m}-${d}`;
  }

  const mdy = t.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (mdy) {
    return `${mdy[1]}-${mdy[2].padStart(2, "0")}-${mdy[3].padStart(2, "0")}`;
  }

  const asNum = Number(t);
  if (!Number.isNaN(asNum) && asNum > 1000 && asNum < 100000) {
    return excelSerialToYMD(asNum);
  }

  return t;
}

export function parseStatusLocal(value) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (["lulus", "l", "ya", "yes"].includes(v)) return "lulus";
  if (["tidak_lulus", "tidak", "belum_lulus", "gagal", "no"].includes(v))
    return "tidak_lulus";
  return null;
}

function setTextCell(ws, ref, value) {
  ws[ref] = { t: "s", v: String(value), w: String(value), z: "@" };
}

function applyTextColumnFormat(ws, colIndex, lastRow) {
  for (let r = 1; r <= lastRow; r++) {
    const ref = XLSX.utils.encode_cell({ r, c: colIndex });
    if (ws[ref]) {
      ws[ref].z = "@";
      if (ws[ref].t === "n") {
        const display = ws[ref].w ?? String(ws[ref].v);
        ws[ref] = { t: "s", v: display, w: display, z: "@" };
      }
    }
  }
}

/**
 * Parse file Excel → array siswa
 */
export function parseStudentExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, {
          type: "array",
          cellDates: true,
          cellNF: true,
          cellText: true,
        });
        const sheetName =
          wb.SheetNames.find((n) => n.toLowerCase().includes("data")) ||
          wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        if (!sheet || !sheet["!ref"]) {
          reject(new Error("Sheet data tidak ditemukan"));
          return;
        }

        const range = XLSX.utils.decode_range(sheet["!ref"]);
        const headerRow = range.s.r;
        const header = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
          header.push(
            getCellText(sheet, headerRow, c).toLowerCase()
          );
        }

        const iNis = findColumnIndex(header, ["nis"]);
        const iNisn = findColumnIndex(header, ["nisn"]);
        const iNama = findColumnIndex(header, ["nama"]);
        const iKelas = findColumnIndex(header, ["kelas"]);
        const iTglLahir = findColumnIndex(header, [
          "tanggal lahir",
          "tanggallahir",
          "tanggal_lahir",
          "tgl lahir",
          "birth",
          "dob",
        ]);
        const iStatus = findColumnIndex(header, ["status"]);
        const iKet = findColumnIndex(header, ["keterangan", "ket"]);

        if (
          iNis < 0 ||
          iNisn < 0 ||
          iNama < 0 ||
          iKelas < 0 ||
          iTglLahir < 0 ||
          iStatus < 0
        ) {
          reject(
            new Error(
              "Header wajib: NIS, NISN, Nama, Kelas, Tanggal Lahir, Status (gunakan template)"
            )
          );
          return;
        }

        const students = [];
        const parseErrors = [];

        for (let r = headerRow + 1; r <= range.e.r; r++) {
          const nis = getCellText(sheet, r, iNis);
          const nisn = getCellText(sheet, r, iNisn, {
            padNumericLength: NISN_LENGTH,
          });
          const nama = getCellText(sheet, r, iNama);
          const kelas = getCellText(sheet, r, iKelas);
          const tanggal_lahir = parseBirthDateFromCell(sheet, r, iTglLahir);
          const status = parseStatusLocal(getCellText(sheet, r, iStatus));
          const keterangan =
            iKet >= 0 ? getCellText(sheet, r, iKet) || null : null;

          if (!nis && !nisn && !nama && !kelas) continue;

          const line = r + 1;

          if (!nis || !nisn || !nama || !kelas || !tanggal_lahir) {
            parseErrors.push({
              line,
              reason: "NIS, NISN, Nama, Kelas, Tanggal Lahir wajib diisi",
            });
            continue;
          }

          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(tanggal_lahir)) {
            parseErrors.push({
              line,
              reason: `Tanggal Lahir "${tanggal_lahir}" tidak valid (gunakan YYYY-MM-DD)`,
            });
            continue;
          }

          if (!status) {
            parseErrors.push({
              line,
              reason: "Status tidak valid (gunakan lulus/tidak_lulus)",
            });
            continue;
          }

          students.push({
            line,
            nis,
            nisn,
            nama,
            kelas,
            tanggal_lahir,
            status,
            keterangan,
          });
        }

        if (students.length === 0 && parseErrors.length === 0) {
          reject(new Error("Tidak ada baris data yang valid"));
          return;
        }

        resolve({ students, parseErrors });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate template Excel — kolom NIS/NISN format teks
 */
export function buildStudentTemplateBlob(classes = []) {
  const wb = XLSX.utils.book_new();
  const headers = [
    "NIS",
    "NISN",
    "Nama",
    "Kelas",
    "Tanggal Lahir",
    "Status",
    "Keterangan",
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const exampleRow = 1;

  setTextCell(ws, "A2", "2024001");
  setTextCell(ws, "B2", "0051234567");
  ws["C2"] = { t: "s", v: "Ahmad Rizki Pratama" };
  ws["D2"] = { t: "s", v: classes[0]?.nama || "IX A" };
  setTextCell(ws, "E2", "2008-12-31");
  ws["F2"] = { t: "s", v: "lulus" };
  ws["G2"] = { t: "s", v: "Opsional" };

  applyTextColumnFormat(ws, 0, exampleRow);
  applyTextColumnFormat(ws, 1, exampleRow);

  ws["!cols"] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 28 },
    { wch: 10 },
    { wch: 15 },
    { wch: 14 },
    { wch: 30 },
  ];
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: exampleRow, c: headers.length - 1 },
  });

  XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");

  const classRows = [
    ["Nama Kelas", "Tingkat"],
    ...classes.map((c) => [c.nama, c.tingkat || ""]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(classRows),
    "Daftar Kelas"
  );

  const note = XLSX.utils.aoa_to_sheet([
    ["Petunjuk Import"],
    ["NIS & NISN: format TEKS — NISN 10 digit (contoh: 0051234567)"],
    ["Tanggal Lahir: YYYY-MM-DD (contoh: 2008-12-31) atau dd/mm/yyyy"],
    ["Status: lulus atau tidak_lulus"],
    ["Kelas harus sama dengan sheet Daftar Kelas"],
  ]);
  XLSX.utils.book_append_sheet(wb, note, "Petunjuk");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
