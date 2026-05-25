import { Link } from "react-router-dom";
import Logo from "@/components/layout/Logo";

export default function PublicLayout({ children }) {
  return (
    <div className="print-page-root flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-amber-50">
      <div className="print-hide-layout absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-pusri-gold via-pusri-orange to-pusri-red" />

      <header className="print-hide-layout relative border-b border-blue-100/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <Logo className="h-16 w-16 sm:h-20 sm:w-20" showText={false} />
          </Link>
          {/* <Link
            to="/admin/login"
            className="no-print rounded-lg border border-pusri-blue/20 px-3 py-2 text-xs font-medium text-pusri-blue hover:bg-pusri-blue hover:text-white sm:text-sm"
          >
            Admin
          </Link> */}
        </div>
      </header>

      <main className="print-main relative mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
        {children}
      </main>

      <footer className="print-hide-layout border-t border-gray-100 py-6 text-center text-xs text-gray-500">
        <p>SMP PUSRI Palembang — Yayasan Sosial Pendidikan</p>
        <p className="mt-1">© {new Date().getFullYear()} Hak cipta dilindungi</p>
      </footer>
    </div>
  );
}
