import { useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { getClassOptions } from "@/services/classService";
import { importStudentsBulk } from "@/services/studentService";
import { downloadBlob } from "@/utils/downloadFile";
import {
  buildStudentTemplateBlob,
  parseStudentExcelFile,
} from "@/utils/excelStudents";

export default function ImportStudentsModal({ open, onClose, onSuccess }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const res = await getClassOptions();
      const blob = buildStudentTemplateBlob(res.data);
      downloadBlob(blob, "template-import-siswa.xlsx");
      toast.success("Template berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh template");
    } finally {
      setDownloading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Pilih file Excel terlebih dahulu");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { students, parseErrors } = await parseStudentExcelFile(file);
      if (students.length === 0) {
        toast.error("Tidak ada data valid untuk diimport");
        setResult({
          imported: 0,
          failed: parseErrors.length,
          details: { imported: [], failed: parseErrors },
        });
        return;
      }

      const res = await importStudentsBulk(students);
      const merged = {
        ...res.data,
        details: {
          imported: res.data.details?.imported || [],
          failed: [
            ...parseErrors,
            ...(res.data.details?.failed || []),
          ],
        },
        failed:
          parseErrors.length + (res.data.failed || 0),
        imported: res.data.imported || 0,
      };
      setResult(merged);
      toast.success(`${merged.imported} data berhasil diimport`);
      if (merged.imported > 0) onSuccess?.();
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || "Gagal import");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Data Siswa" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Excel diproses di perangkat Anda. Unduh template, isi data, lalu upload.
          Kolom wajib: NIS, NISN (10 digit, awalan 0 tetap), Nama, Kelas, Tanggal
          Lahir (YYYY-MM-DD), Status (lulus / tidak_lulus). Unduh template terbaru
          agar format NIS/NISN benar.
        </p>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
        >
          {downloading ? (
            <Spinner className="h-4 w-4 border-2" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          Download Template Excel
        </button>

        <div
          className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) setFile(f);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {file ? file.name : "Seret file Excel atau klik untuk memilih"}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-pusri-blue shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
          >
            Pilih File
          </button>
        </div>

        {result && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
            <p className="font-medium text-gray-900">Hasil Import</p>
            <p className="mt-1 text-emerald-700">
              Berhasil: {result.imported} baris
            </p>
            {result.failed > 0 && (
              <p className="text-amber-700">Gagal: {result.failed} baris</p>
            )}
            {result.details?.failed?.length > 0 && (
              <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-gray-600">
                {result.details.failed.slice(0, 10).map((f, idx) => (
                  <li key={`${f.line}-${idx}`}>
                    Baris {f.line}: {f.reason}
                  </li>
                ))}
                {result.details.failed.length > 10 && (
                  <li>...dan {result.details.failed.length - 10} lainnya</li>
                )}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || !file}
            className="flex items-center gap-2 rounded-lg bg-pusri-blue px-4 py-2 text-sm font-medium text-white hover:bg-pusri-blue-light disabled:opacity-60"
          >
            {loading && <Spinner className="h-4 w-4 border-2" />}
            Import Sekarang
          </button>
        </div>
      </div>
    </Modal>
  );
}
