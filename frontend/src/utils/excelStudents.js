import * as XLSX from "xlsx";

function findColumnIndex(header, names) {
  for (const n of names) {
    const i = header.findIndex((h) => h.includes(n));
    if (i >= 0) return i;
  }
  return -1;
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

/**
 * Parse file Excel → array { line, nis, nisn, nama, kelas, status, keterangan }
 */
export function parseStudentExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array", cellDates: true, dateNF: "yyyy-mm-dd" });
        const sheetName =
          wb.SheetNames.find((n) => n.toLowerCase().includes("data")) ||
          wb.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
          header: 1,
          defval: "",
        });

        if (rows.length < 2) {
          reject(new Error("File kosong atau hanya berisi header"));
          return;
        }

        const header = rows[0].map((h) => String(h).trim().toLowerCase());
        const iNis = findColumnIndex(header, ["nis"]);
        const iNisn = findColumnIndex(header, ["nisn"]);
        const iNama = findColumnIndex(header, ["nama"]);
        const iKelas = findColumnIndex(header, ["kelas"]);
        const iTglLahir = findColumnIndex(header, ["tanggal lahir", "tanggallahir", "tanggal_lahir", "tgl lahir", "birth", "dob"]);
        const iStatus = findColumnIndex(header, ["status"]);
        const iKet = findColumnIndex(header, ["keterangan", "ket"]);

        if (iNis < 0 || iNisn < 0 || iNama < 0 || iKelas < 0 || iTglLahir < 0 || iStatus < 0) {
          reject(
            new Error(
              "Header wajib: NIS, NISN, Nama, Kelas, Tanggal Lahir, Status (gunakan template)"
            )
          );
          return;
        }

        const students = [];
        const parseErrors = [];

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.every((c) => !String(c).trim())) continue;
          const line = r + 1;
          const nis = String(row[iNis] ?? "").trim();
          const nisn = String(row[iNisn] ?? "").trim();
          const nama = String(row[iNama] ?? "").trim();
          const kelas = String(row[iKelas] ?? "").trim();
          
          let tanggal_lahir = "";
          const rawTgl = row[iTglLahir];
          if (rawTgl instanceof Date) {
            const y = rawTgl.getFullYear();
            const m = String(rawTgl.getMonth() + 1).padStart(2, "0");
            const d = String(rawTgl.getDate()).padStart(2, "0");
            tanggal_lahir = `${y}-${m}-${d}`;
          } else if (typeof rawTgl === "number") {
            const dateObj = new Date(Math.round((rawTgl - 25569) * 86400 * 1000));
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, "0");
            const d = String(dateObj.getDate()).padStart(2, "0");
            tanggal_lahir = `${y}-${m}-${d}`;
          } else {
            let tStr = String(rawTgl ?? "").trim();
            if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(tStr)) {
              const parts = tStr.split(/[-/]/);
              tStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            tanggal_lahir = tStr;
          }

          const status = parseStatusLocal(row[iStatus]);
          const keterangan =
            iKet >= 0 && row[iKet] ? String(row[iKet]).trim() : null;

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
              reason: `Tanggal Lahir "${tanggal_lahir}" tidak valid (harus format YYYY-MM-DD, contoh: 2008-12-31)`,
            });
            continue;
          }

          students.push({ line, nis, nisn, nama, kelas, tanggal_lahir, status, keterangan });
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
 * Generate template Excel blob di browser
 */
export function buildStudentTemplateBlob(classes = []) {
  const wb = XLSX.utils.book_new();
  const headers = ["NIS", "NISN", "Nama", "Kelas", "Tanggal Lahir", "Status", "Keterangan"];
  const example = [
    "2024001",
    "0051234567",
    "Ahmad Rizki Pratama",
    classes[0]?.nama || "IX A",
    "2008-12-31",
    "lulus",
    "Opsional",
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 28 },
    { wch: 10 },
    { wch: 15 },
    { wch: 14 },
    { wch: 30 },
  ];
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
    ["Status: lulus atau tidak_lulus"],
    ["Tanggal Lahir: Gunakan format YYYY-MM-DD (contoh: 2008-12-31)"],
    ["Kelas harus sama persis dengan sheet Daftar Kelas"],
    ["Jangan ubah baris header pada sheet Data Siswa"],
  ]);
  XLSX.utils.book_append_sheet(wb, note, "Petunjuk");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
