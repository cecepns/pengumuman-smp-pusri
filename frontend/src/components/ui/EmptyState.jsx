import { Inbox } from "lucide-react";

export default function EmptyState({ title = "Tidak ada data", message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="mb-4 h-12 w-12 text-gray-300" />
      <p className="font-medium text-gray-700">{title}</p>
      {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
    </div>
  );
}
