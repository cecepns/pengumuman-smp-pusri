import { NavLink } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  School,
  Settings,
  Users,
  X,
} from "lucide-react";
import logoImg from "@/assets/logo.png";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/siswa", icon: Users, label: "Data Siswa" },
  { to: "/admin/kelas", icon: School, label: "Manajemen Kelas" },
  { to: "/admin/pengaturan", icon: Settings, label: "Pengaturan" },
];

export default function AdminSidebar({ open, onClose, user, onLogout }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-pusri-blue text-white shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <img
              src={logoImg}
              alt="Logo SMP PUSRI"
              className="h-10 w-10 rounded-lg bg-white p-0.5 object-contain"
            />
            <div>
              <p className="text-xs text-blue-200">Admin Panel</p>
              <p className="text-sm font-semibold">SMP PUSRI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-pusri-blue"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-blue-100">
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span className="truncate">{user?.name || user?.username}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
