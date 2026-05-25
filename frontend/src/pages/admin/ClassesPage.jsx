import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ClassFormModal from "@/components/admin/ClassFormModal";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import Spinner from "@/components/ui/Spinner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  createClass,
  deleteClass,
  getClasses,
  updateClass,
} from "@/services/classService";

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClasses({ page, limit, search: debouncedSearch });
      setClasses(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch {
      toast.error("Gagal memuat data kelas");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleSave = async (formData) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateClass(editing.id, formData);
        toast.success("Kelas berhasil diperbarui");
      } else {
        await createClass(formData);
        toast.success("Kelas berhasil ditambahkan");
      }
      setModalOpen(false);
      setEditing(null);
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    toast(
      (t) => (
        <div className="text-sm">
          <p className="font-medium">Hapus kelas {item.nama}?</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteClass(item.id);
                  toast.success("Kelas dihapus");
                  fetchClasses();
                } catch (err) {
                  toast.error(err.response?.data?.message || "Gagal menghapus");
                }
              }}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-white"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="rounded-lg border px-3 py-1.5"
            >
              Batal
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Kelas</h1>
          <p className="text-sm text-gray-500">
            Kelola kelas dinamis untuk berbagai jenis pengumuman (VII, VIII, IX,
            dll.)
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-pusri-blue px-4 py-2 text-sm font-medium text-white hover:bg-pusri-blue-light"
        >
          <Plus className="h-4 w-4" />
          Tambah Kelas
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kelas atau tingkat..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm"
          />
        </div>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:w-28"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} / hal
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : classes.length === 0 ? (
          <EmptyState message="Belum ada data kelas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nama Kelas</th>
                  <th className="px-4 py-3">Tingkat</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium">{c.nama}</td>
                    <td className="px-4 py-3">{c.tingkat || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          c.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {c.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(c);
                            setModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-gray-500">
          Menampilkan {classes.length} dari {total} kelas
        </p>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ClassFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
        initialData={editing}
        loading={submitting}
      />
    </div>
  );
}
