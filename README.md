# Pengumuman Kelulusan SMP PUSRI Palembang

Website pengumuman kelulusan siswa **SMP PUSRI Palembang** (Yayasan Sosial Pendidikan).

## Fitur

### Halaman Publik
- Cek status kelulusan dengan **NIS** atau **NISN**
- Tampilan resmi dengan logo sekolah
- Pesan kelulusan dapat dikustomisasi admin

### Admin Panel
- Login admin (JWT)
- Dashboard statistik (total, lulus, belum lulus)
- CRUD data siswa (modal create/edit, confirm delete)
- Pencarian realtime (debounce 300ms)
- Pagination dari API (10/25/50/100)
- Pengaturan teks pengumuman

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, PWA, Lucide React, react-hot-toast
- **Backend:** Express.js, MySQL
- **API:** REST — endpoint terpusat di `frontend/src/utils/endpoints.js` (tanpa proxy Vite)

## Struktur Project

```bash
web-pengumuman-siswa/
├── frontend/          # React + Vite
├── backend/           # Express API
│   └── sql/database.sql
├── logo.jpeg
└── README.md
```

## Instalasi

### 1. Database MySQL

```bash
mysql -u root -p < backend/sql/database.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env sesuai konfigurasi MySQL Anda
npm install
npm run dev
```

Server berjalan di `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`

## Login Admin Default

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

> Ganti password setelah deploy production.

## Data Sample

Contoh NIS untuk uji cek kelulusan:

| NIS     | Status        |
|---------|---------------|
| 2024001 | Lulus         |
| 2024004 | Tidak Lulus   |

## Environment

**Backend** (`backend/.env`):

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pengumuman_kelulusan_smp_pusri
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

## Build Production

```bash
cd frontend && npm run build
cd ../backend && npm start
```

Serve folder `frontend/dist` dengan nginx atau static hosting; arahkan API ke backend Express.
# pengumuman-smp-pusri
