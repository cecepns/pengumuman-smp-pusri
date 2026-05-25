import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Search, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import PublicLayout from "@/layouts/PublicLayout";
import Spinner from "@/components/ui/Spinner";
import { checkGraduation } from "@/services/studentService";
import { getSettings } from "@/services/settingsService";

export default function HomePage() {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState("nis");
  const [query, setQuery] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings()
      .then((res) => setSettings(res.data))
      .catch(() => {});
  }, []);

  const handleCheck = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      toast.error("Masukkan NIS atau NISN terlebih dahulu");
      return;
    }
    if (!dob) {
      toast.error("Masukkan tanggal lahir terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const params =
        searchType === "nis"
          ? { nis: trimmed, tanggal_lahir: dob }
          : { nisn: trimmed, tanggal_lahir: dob };
      const res = await checkGraduation(params);
      navigate(`/pengumuman/${searchType}/${encodeURIComponent(trimmed)}/${encodeURIComponent(dob)}`, {
        state: { result: res.data, settings },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Data tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mb-8 text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pusri-blue/10 px-4 py-1 text-xs font-semibold text-pusri-blue">
          <ShieldCheck className="h-4 w-4" />
          Pengumuman Resmi
        </div>
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {settings?.judul_pengumuman ||
            "Pengumuman Kelulusan SMP PUSRI Palembang"}
        </h2>
        {settings?.tahun_ajaran && (
          <p className="mt-2 text-gray-600">
            Tahun Ajaran {settings.tahun_ajaran}
          </p>
        )}
        {settings?.tanggal_pengumuman && (
          <p className="text-sm text-gray-500">
            {new Date(settings.tanggal_pengumuman).toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-blue-900/5 sm:p-8">
        <p className="mb-6 text-center text-sm text-gray-600">
          Masukkan <strong>NIS</strong> atau <strong>NISN</strong> Anda untuk
          melihat pengumuman kelulusan.
        </p>

        <div className="mb-4 flex rounded-xl bg-gray-100 p-1">
          {["nis", "nisn"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setSearchType(type);
                setQuery("");
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                searchType === type
                  ? "bg-white text-pusri-blue shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        <form onSubmit={handleCheck} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider pl-1">
              {searchType.toUpperCase()}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchType === "nis"
                    ? "Contoh: 2024001"
                    : "Contoh: 0051234567"
                }
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-pusri-blue focus:ring-2 focus:ring-pusri-blue/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider pl-1">
              Tanggal Lahir
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-pusri-blue focus:ring-2 focus:ring-pusri-blue/20"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-pusri-blue py-3 text-sm font-semibold text-white transition hover:bg-pusri-blue-light disabled:opacity-60"
          >
            {loading ? (
              <Spinner className="h-5 w-5 border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <Search className="h-4 w-4" />
                Cek Kelulusan
              </>
            )}
          </button>
        </form>
      </div>
    </PublicLayout>
  );
}
