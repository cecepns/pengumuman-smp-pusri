import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AdminLayout from "@/layouts/AdminLayout";
import HomePage from "@/pages/HomePage";
import GraduationDetailPage from "@/pages/GraduationDetailPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import DashboardPage from "@/pages/admin/DashboardPage";
import StudentsPage from "@/pages/admin/StudentsPage";
import ClassesPage from "@/pages/admin/ClassesPage";
import SettingsPage from "@/pages/admin/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/pengumuman/:type/:value/:dob"
          element={<GraduationDetailPage />}
        />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="siswa" element={<StudentsPage />} />
          <Route path="kelas" element={<ClassesPage />} />
          <Route path="pengaturan" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
