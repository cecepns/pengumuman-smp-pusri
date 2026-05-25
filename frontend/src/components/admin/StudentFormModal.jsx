import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { getClassOptions } from "@/services/classService";

const emptyForm = {
  nis: "",
  nisn: "",
  nama: "",
  class_id: "",
  tanggal_lahir: "",
  status: "lulus",
  keterangan: "",
};

export default function StudentFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingClasses(true);
    getClassOptions()
      .then((res) => setClasses(res.data))
      .catch(() => setClasses([]))
      .finally(() => setLoadingClasses(false));
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setForm({
        nis: initialData.nis || "",
        nisn: initialData.nisn || "",
        nama: initialData.nama || "",
        class_id: String(initialData.class_id || ""),
        tanggal_lahir: initialData.tanggal_lahir || "",
        status: initialData.status || "lulus",
        keterangan: initialData.keterangan || "",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [initialData, open]);

  const validate = () => {
    const e = {};
    if (!form.nis.trim()) e.nis = "NIS wajib diisi";
    if (!form.nisn.trim()) e.nisn = "NISN wajib diisi";
    if (!form.nama.trim()) e.nama = "Nama wajib diisi";
    if (!form.class_id) e.class_id = "Kelas wajib dipilih";
    if (!form.tanggal_lahir) e.tanggal_lahir = "Tanggal lahir wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      nis: form.nis.trim(),
      nisn: form.nisn.trim(),
      nama: form.nama.trim(),
      class_id: Number(form.class_id),
      tanggal_lahir: form.tanggal_lahir,
      status: form.status,
      keterangan: form.keterangan || null,
    });
  };

  const field = (name, label, props = {}) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        name={name}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pusri-blue/30 ${
          errors[name] ? "border-red-400" : "border-gray-200"
        }`}
        {...props}
      />
      {errors[name] && (
        <p className="mt-1 text-xs text-red-500">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? "Edit Siswa" : "Tambah Siswa"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("nis", "NIS", { placeholder: "2024001" })}
          {field("nisn", "NISN", { placeholder: "0051234567" })}
        </div>
        {field("nama", "Nama Lengkap")}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Kelas
            </label>
            <select
              value={form.class_id}
              onChange={(e) =>
                setForm({ ...form, class_id: e.target.value })
              }
              disabled={loadingClasses}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                errors.class_id ? "border-red-400" : "border-gray-200"
              }`}
            >
              <option value="">Pilih kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                  {c.tingkat ? ` (${c.tingkat})` : ""}
                </option>
              ))}
            </select>
            {errors.class_id && (
              <p className="mt-1 text-xs text-red-500">{errors.class_id}</p>
            )}
            {!loadingClasses && classes.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Belum ada kelas. Tambahkan di menu Manajemen Kelas.
              </p>
            )}
          </div>
          {field("tanggal_lahir", "Tanggal Lahir", { type: "date" })}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="lulus">Lulus</option>
              <option value="tidak_lulus">Tidak Lulus</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Keterangan (opsional)
          </label>
          <textarea
            value={form.keterangan}
            onChange={(e) =>
              setForm({ ...form, keterangan: e.target.value })
            }
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Predikat / catatan..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-pusri-blue px-4 py-2 text-sm font-medium text-white hover:bg-pusri-blue-light disabled:opacity-60"
          >
            {loading && <Spinner className="h-4 w-4 border-2" />}
            Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}
