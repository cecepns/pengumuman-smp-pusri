import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, LogIn, User } from "lucide-react";
import toast from "react-hot-toast";
import Logo from "@/components/layout/Logo";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { login } from "@/services/authService";

export default function AdminLoginPage() {
  const { isAuthenticated, setAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error("Username dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const res = await login(form);
      setAuth(res.data.token, res.data.user);
      toast.success("Login berhasil");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pusri-blue to-blue-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <Logo className="h-24 w-24" showText={false} />
        </div>
        <h1 className="mb-1 text-center text-xl font-bold text-gray-900">
          Admin Panel
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Pengumuman Kelulusan SMP PUSRI
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm"
                placeholder="admin"
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-pusri-blue py-2.5 text-sm font-semibold text-white hover:bg-pusri-blue-light disabled:opacity-60"
          >
            {loading ? (
              <Spinner className="h-5 w-5 border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Masuk
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
