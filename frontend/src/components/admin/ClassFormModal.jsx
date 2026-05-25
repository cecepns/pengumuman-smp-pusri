import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";

const emptyForm = {
  nama: "",
  tingkat: "",
  keterangan: "",
  is_active: true,
};

export default function ClassFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        nama: initialData.nama || "",
        tingkat: initialData.tingkat || "",
        keterangan: initialData.keterangan || "",
        is_active: initialData.is_active !== 0,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [initialData, open]);

  const validate = () => {
    const e = {};
    if (!form.nama.trim()) e.nama = "Nama kelas wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      nama: form.nama.trim(),
      tingkat: form.tingkat.trim() || null,
      keterangan: form.keterangan.trim() || null,
      is_active: form.is_active ? 1 : 0,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? "Edit Kelas" : "Tambah Kelas"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nama Kelas
          </label>
          <input
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            placeholder="Contoh: IX A, VII B"
            className={`w-full rounded-lg border px-3 py-2 text-sm ${
              errors.nama ? "border-red-400" : "border-gray-200"
            }`}
          />
          {errors.nama && (
            <p className="mt-1 text-xs text-red-500">{errors.nama}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tingkat (opsional)
          </label>
          <input
            value={form.tingkat}
            onChange={(e) => setForm({ ...form, tingkat: e.target.value })}
            placeholder="VII, VIII, IX, X, ..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Keterangan (opsional)
          </label>
          <textarea
            value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        {initialData && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            Kelas aktif
          </label>
        )}
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
