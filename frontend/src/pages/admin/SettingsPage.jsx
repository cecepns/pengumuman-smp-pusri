import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "@/components/ui/Spinner";
import { getSettings, updateSettings } from "@/services/settingsService";

export default function SettingsPage() {
  const [form, setForm] = useState({
    tahun_ajaran: "",
    judul_pengumuman: "",
    tanggal_pengumuman: "",
    pesan_lulus: "",
    pesan_tidak_lulus: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((res) => setForm((f) => ({ ...f, ...res.data })))
      .catch(() => toast.error("Gagal memuat pengaturan"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success("Pengaturan disimpan");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const fields = [
    { key: "tahun_ajaran", label: "Tahun Ajaran", type: "text" },
    { key: "judul_pengumuman", label: "Judul Pengumuman", type: "text" },
    { key: "tanggal_pengumuman", label: "Tanggal Pengumuman", type: "date" },
    { key: "pesan_lulus", label: "Pesan untuk Siswa Lulus", type: "textarea" },
    {
      key: "pesan_tidak_lulus",
      label: "Pesan untuk Siswa Belum Lulus",
      type: "textarea",
    },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
      <p className="mt-1 text-sm text-gray-500">
        Atur teks pengumuman yang tampil di halaman publik
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        {fields.map(({ key, label, type }) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {label}
            </label>
            {type === "textarea" ? (
              <textarea
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            ) : (
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-pusri-blue px-4 py-2 text-sm font-medium text-white hover:bg-pusri-blue-light disabled:opacity-60"
        >
          {saving ? (
            <Spinner className="h-4 w-4 border-2 border-white/30 border-t-white" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan Pengaturan
        </button>
      </form>
    </div>
  );
}
