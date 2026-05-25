import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Users, UserX } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { getDashboardStats } from "@/services/dashboardService";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats({ total: 0, lulus: 0, tidak_lulus: 0 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const cards = [
    {
      label: "Total Siswa",
      value: stats?.total ?? 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: "Lulus",
      value: stats?.lulus ?? 0,
      icon: GraduationCap,
      color: "bg-emerald-500",
    },
    {
      label: "Belum Lulus",
      value: stats?.tidak_lulus ?? 0,
      icon: UserX,
      color: "bg-amber-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Ringkasan data pengumuman kelulusan
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className={`mb-4 inline-flex rounded-xl ${color} p-3 text-white`}>
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="font-semibold text-pusri-blue">Kelola Data Siswa</h2>
        <p className="mt-1 text-sm text-gray-600">
          Tambah, edit, atau hapus data siswa dan status kelulusan.
        </p>
        <Link
          to="/admin/siswa"
          className="mt-4 inline-block rounded-lg bg-pusri-blue px-4 py-2 text-sm font-medium text-white hover:bg-pusri-blue-light"
        >
          Buka Data Siswa
        </Link>
      </div>
    </div>
  );
}
