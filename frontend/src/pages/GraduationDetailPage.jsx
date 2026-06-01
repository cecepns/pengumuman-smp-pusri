import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  Printer,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import PublicLayout from "@/layouts/PublicLayout";
import Spinner from "@/components/ui/Spinner";
import { checkGraduation } from "@/services/studentService";
import { getSettings } from "@/services/settingsService";
import { formatDateId } from "@/utils/dateFormat";

export default function GraduationDetailPage() {
  const { type, value, dob } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [result, setResult] = useState(location.state?.result ?? null);
  const [settings, setSettings] = useState(location.state?.settings ?? null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!["nis", "nisn"].includes(type) || !value?.trim()) {
      navigate("/", { replace: true });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        if (!settings) {
          const settingsRes = await getSettings();
          if (!cancelled) setSettings(settingsRes.data);
        }
        if (!result) {
          const decoded = decodeURIComponent(value);
          const decodedDob = decodeURIComponent(dob || "");
          const params = type === "nis"
            ? { nis: decoded, tanggal_lahir: decodedDob }
            : { nisn: decoded, tanggal_lahir: decodedDob };
          const res = await checkGraduation(params);
          if (!cancelled) setResult(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Data tidak ditemukan");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, value, dob, navigate]);

  const isLulus = result?.status === "lulus";
  const judul =
    settings?.judul_pengumuman ||
    "Pengumuman Kelulusan SMP PUSRI Palembang";
  const tanggalLabel = settings?.tanggal_pengumuman
    ? new Date(settings.tanggal_pengumuman).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <Spinner />
          <p className="mt-4 text-sm text-gray-500">Memuat pengumuman...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !result) {
    return (
      <PublicLayout>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-4 font-medium text-red-800">
            {error || "Data tidak ditemukan"}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-pusri-blue px-4 py-2 text-sm font-medium text-white hover:bg-pusri-blue-light"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Pencarian
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Link
        to="/"
        className="no-print mb-6 inline-flex items-center gap-2 text-sm font-medium text-pusri-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Cek siswa lain
      </Link>

      {/* Judul — hanya tampil di layar */}
      <div className="no-print mb-6 text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pusri-blue/10 px-4 py-1 text-xs font-semibold text-pusri-blue">
          <ShieldCheck className="h-4 w-4" />
          Pengumuman Kelulusan
        </div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{judul}</h1>
        {settings?.tahun_ajaran && (
          <p className="mt-1 text-sm text-gray-600">
            Tahun Ajaran {settings.tahun_ajaran}
          </p>
        )}
        {tanggalLabel && (
          <p className="text-xs text-gray-500">{tanggalLabel}</p>
        )}
      </div>

      {/* Dokumen cetak — satu halaman A4 */}
      <div className="print-document">
        <div className="print-only print-document-header">
          <img src={logoImg} alt="Logo SMP PUSRI" />
          <p className="text-xs font-medium uppercase tracking-wider text-pusri-gold">
            Yayasan Sosial Pendidikan
          </p>
          <h1>SMP PUSRI Palembang</h1>
          <p className="print-subtitle">{judul}</p>
          {settings?.tahun_ajaran && (
            <p className="print-subtitle">Tahun Ajaran {settings.tahun_ajaran}</p>
          )}
          {tanggalLabel && <p className="print-date">{tanggalLabel}</p>}
        </div>

        <article
          className={`print-certificate overflow-hidden rounded-2xl border-2 shadow-xl ${
            isLulus
              ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
              : "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
          }`}
        >
          <div
            className={`print-certificate-banner flex items-center justify-center gap-3 px-6 py-5 ${
              isLulus
                ? "lulus bg-emerald-600 text-white"
                : "tidak-lulus bg-amber-600 text-white"
            }`}
          >
            {isLulus ? (
              <Award className="h-8 w-8 no-print" />
            ) : (
              <XCircle className="h-8 w-8 no-print" />
            )}
            <span>{isLulus ? "LULUS" : "BELUM LULUS"}</span>
          </div>

          <div className="print-certificate-body space-y-5 p-6 sm:p-8">
            <div className="print-student-name text-center">
              <p className="label text-xs uppercase tracking-wider text-gray-500">
                Nama Siswa
              </p>
              <p className="value mt-1 text-2xl font-bold text-gray-900">
                {result.nama}
              </p>
            </div>

            <div className="print-info-grid grid gap-3 sm:grid-cols-2">
              <InfoRow label="NIS" value={result.nis} />
              <InfoRow label="NISN" value={result.nisn} />
              <InfoRow label="Kelas" value={result.kelas} />
              <InfoRow
                label="Tanggal Lahir"
                value={formatDateId(result.tanggal_lahir)}
              />
              <InfoRow
                label="Status"
                value={isLulus ? "Lulus" : "Belum Lulus"}
                highlight={isLulus ? "emerald" : "amber"}
              />
            </div>

            <div
              className={`print-message rounded-xl p-5 text-center text-sm font-medium leading-relaxed ${
                isLulus
                  ? "lulus bg-emerald-100 text-emerald-800"
                  : "tidak-lulus bg-amber-100 text-amber-800"
              }`}
            >
              {isLulus
                ? settings?.pesan_lulus || "Selamat! Anda dinyatakan LULUS."
                : settings?.pesan_tidak_lulus ||
                  "Mohon maaf, Anda belum dinyatakan lulus."}
            </div>

            {result.keterangan && (
              <div className="print-keterangan rounded-xl border border-gray-100 bg-white/80 p-4">
                <p className="label text-xs font-medium uppercase text-gray-500">
                  Keterangan
                </p>
                <p className="value mt-1 text-sm text-gray-700">
                  {result.keterangan}
                </p>
              </div>
            )}

            <p className="print-doc-footer text-center text-xs text-gray-400">
              Dokumen pengumuman resmi SMP PUSRI Palembang
            </p>
          </div>
        </article>
      </div>

      <div className="no-print mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Printer className="h-4 w-4" />
          Cetak Pengumuman
        </button>
        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-xl bg-pusri-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-pusri-blue-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      </div>
    </PublicLayout>
  );
}

function InfoRow({ label, value, highlight }) {
  const highlightClass =
    highlight === "emerald"
      ? "emerald text-emerald-700"
      : highlight === "amber"
        ? "amber text-amber-700"
        : "text-gray-900";

  return (
    <div className="print-info-item rounded-xl border border-gray-100 bg-white/90 px-4 py-3">
      <span className="label text-xs text-gray-500">{label}</span>
      <p className={`value font-semibold ${highlightClass}`}>{value}</p>
    </div>
  );
}
