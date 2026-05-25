require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));

const STUDENT_FIELDS = `
  s.id, s.nis, s.nisn, s.nama, s.class_id,
  COALESCE(c.nama, s.kelas) AS kelas, c.tingkat,
  DATE_FORMAT(s.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
  s.status, s.keterangan, s.created_at, s.updated_at
`;
const STUDENT_JOIN = `FROM students s LEFT JOIN classes c ON s.class_id = c.id`;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pengumuman_kelulusan_smp_pusri",
  waitForConnections: true,
  connectionLimit: 10,
});

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

function sendSuccess(res, data, status = 200, pagination = null) {
  const body = { success: true, data };
  if (pagination) body.pagination = pagination;
  return res.status(status).json(body);
}

function sendError(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}

function sanitizeString(value, maxLen = 255) {
  if (value === undefined || value === null) return "";
  return String(value).trim().slice(0, maxLen);
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return sendError(res, "Token tidak valid", 401);
  }
  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return sendError(res, "Token kedaluwarsa atau tidak valid", 401);
  }
}

async function seedDefaultAdmin() {
  const [rows] = await pool.query("SELECT id FROM admins LIMIT 1");
  if (rows.length > 0) return;
  const hash = await bcrypt.hash("admin123", 10);
  await pool.query(
    "INSERT INTO admins (username, password, name) VALUES (?, ?, ?)",
    ["admin", hash, "Administrator SMP PUSRI"]
  );
  console.log("Default admin created: username=admin, password=admin123");
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS classes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(50) NOT NULL UNIQUE,
      tingkat VARCHAR(20) NULL,
      keterangan VARCHAR(255) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  try {
    await pool.query(
      "ALTER TABLE students ADD COLUMN class_id INT NULL AFTER nama"
    );
  } catch (e) {
    if (e.code !== "ER_DUP_FIELDNAME") throw e;
  }
  try {
    await pool.query(
      "ALTER TABLE students ADD COLUMN tanggal_lahir DATE NULL AFTER kelas"
    );
  } catch (e) {
    if (e.code !== "ER_DUP_FIELDNAME") throw e;
  }
  const [classRows] = await pool.query("SELECT COUNT(*) AS c FROM classes");
  if (classRows[0].c === 0) {
    const defaults = [
      ["VII A", "VII"],
      ["VII B", "VII"],
      ["VIII A", "VIII"],
      ["VIII B", "VIII"],
      ["IX A", "IX"],
      ["IX B", "IX"],
      ["IX C", "IX"],
    ];
    for (const [nama, tingkat] of defaults) {
      await pool.query(
        "INSERT IGNORE INTO classes (nama, tingkat) VALUES (?, ?)",
        [nama, tingkat]
      );
    }
  }
}

async function resolveClass(body) {
  const classId = parseInt(body.class_id, 10);
  if (classId) {
    const [rows] = await pool.query(
      "SELECT id, nama FROM classes WHERE id = ?",
      [classId]
    );
    if (rows.length) return { class_id: rows[0].id, kelas: rows[0].nama };
    return { error: "Kelas tidak ditemukan" };
  }
  const kelasName = sanitizeString(body.kelas, 50);
  if (!kelasName) return { error: "Kelas wajib dipilih" };
  const [rows] = await pool.query(
    "SELECT id, nama FROM classes WHERE nama = ?",
    [kelasName]
  );
  if (rows.length) return { class_id: rows[0].id, kelas: rows[0].nama };
  return { error: `Kelas "${kelasName}" belum terdaftar. Tambahkan di menu Manajemen Kelas.` };
}

function parseStatus(value) {
  const v = sanitizeString(value, 30).toLowerCase().replace(/\s+/g, "_");
  if (["lulus", "l", "ya", "yes"].includes(v)) return "lulus";
  if (["tidak_lulus", "tidak", "belum_lulus", "gagal", "no"].includes(v))
    return "tidak_lulus";
  return null;
}

async function bulkInsertStudents(rows) {
  const imported = [];
  const failed = [];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const line = row.line ?? i + 2;
      const nis = sanitizeString(row.nis, 20);
      const nisn = sanitizeString(row.nisn, 20);
      const nama = sanitizeString(row.nama, 150);
      const kelasRaw = sanitizeString(row.kelas, 50);
      const tanggal_lahir = sanitizeString(row.tanggal_lahir, 20);
      const status = parseStatus(row.status);
      const keterangan = row.keterangan
        ? sanitizeString(row.keterangan, 500)
        : null;

      if (!nis || !nisn || !nama || !kelasRaw || !tanggal_lahir) {
        failed.push({ line, reason: "NIS, NISN, Nama, Kelas, Tanggal Lahir wajib diisi" });
        continue;
      }
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(tanggal_lahir)) {
        failed.push({ line, reason: `Format Tanggal Lahir "${tanggal_lahir}" tidak valid (harus YYYY-MM-DD)` });
        continue;
      }
      if (!status) {
        failed.push({
          line,
          reason: "Status tidak valid (gunakan lulus/tidak_lulus)",
        });
        continue;
      }

      const [classRows] = await conn.query(
        "SELECT id, nama FROM classes WHERE nama = ? AND is_active = 1",
        [kelasRaw]
      );
      if (!classRows.length) {
        failed.push({ line, reason: `Kelas "${kelasRaw}" tidak ditemukan` });
        continue;
      }

      try {
        await conn.query(
          `INSERT INTO students (nis, nisn, nama, class_id, kelas, tanggal_lahir, status, keterangan)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nis,
            nisn,
            nama,
            classRows[0].id,
            classRows[0].nama,
            tanggal_lahir,
            status,
            keterangan,
          ]
        );
        imported.push({ line, nis, nama });
      } catch (e) {
        if (e.code === "ER_DUP_ENTRY") {
          failed.push({ line, reason: "NIS atau NISN duplikat" });
        } else {
          failed.push({ line, reason: e.message });
        }
      }
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  return { imported, failed };
}

// --- Auth ---
app.post("/api/auth/login", async (req, res) => {
  try {
    const username = sanitizeString(req.body.username, 50);
    const password = sanitizeString(req.body.password, 100);
    if (!username || !password) {
      return sendError(res, "Username dan password wajib diisi");
    }
    const [rows] = await pool.query(
      "SELECT id, username, password, name FROM admins WHERE username = ? LIMIT 1",
      [username]
    );
    if (rows.length === 0) {
      return sendError(res, "Username atau password salah", 401);
    }
    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return sendError(res, "Username atau password salah", 401);
    }
    const token = jwt.sign(
      { id: admin.id, username: admin.username, name: admin.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    return sendSuccess(res, {
      token,
      user: { id: admin.id, username: admin.username, name: admin.name },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal login", 500);
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  return sendSuccess(res, { user: req.user });
});

// --- Settings (public read) ---
app.get("/api/settings", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM settings"
    );
    const settings = {};
    rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });
    return sendSuccess(res, settings);
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal memuat pengaturan", 500);
  }
});

app.put("/api/settings", authMiddleware, async (req, res) => {
  try {
    const allowed = [
      "tahun_ajaran",
      "judul_pengumuman",
      "tanggal_pengumuman",
      "pesan_lulus",
      "pesan_tidak_lulus",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        await pool.query(
          `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [key, sanitizeString(req.body[key], 500)]
        );
      }
    }
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM settings"
    );
    const settings = {};
    rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });
    return sendSuccess(res, settings);
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal menyimpan pengaturan", 500);
  }
});

// --- Dashboard ---
app.get("/api/dashboard/stats", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'lulus' THEN 1 ELSE 0 END) AS lulus,
        SUM(CASE WHEN status = 'tidak_lulus' THEN 1 ELSE 0 END) AS tidak_lulus
      FROM students
    `);
    return sendSuccess(res, rows[0]);
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal memuat statistik", 500);
  }
});

// --- Classes CRUD ---
app.get("/api/classes/options", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nama, tingkat FROM classes WHERE is_active = 1 ORDER BY tingkat, nama"
    );
    return sendSuccess(res, rows);
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal memuat daftar kelas", 500);
  }
});

app.get("/api/classes", authMiddleware, async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = sanitizeString(req.query.search, 100);
    const tingkat = sanitizeString(req.query.tingkat, 20);
    const conditions = [];
    const params = [];
    if (search) {
      conditions.push("(nama LIKE ? OR tingkat LIKE ? OR keterangan LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (tingkat) {
      conditions.push("tingkat = ?");
      params.push(tingkat);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM classes ${where}`,
      params
    );
    const total = countRows[0].total;
    const [rows] = await pool.query(
      `SELECT id, nama, tingkat, keterangan, is_active, created_at, updated_at
       FROM classes ${where}
       ORDER BY tingkat ASC, nama ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return sendSuccess(res, rows, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal memuat kelas", 500);
  }
});

app.post("/api/classes", authMiddleware, async (req, res) => {
  try {
    const nama = sanitizeString(req.body.nama, 50);
    const tingkat = sanitizeString(req.body.tingkat, 20) || null;
    const keterangan = sanitizeString(req.body.keterangan, 255) || null;
    if (!nama) return sendError(res, "Nama kelas wajib diisi");
    const [result] = await pool.query(
      "INSERT INTO classes (nama, tingkat, keterangan) VALUES (?, ?, ?)",
      [nama, tingkat, keterangan]
    );
    const [rows] = await pool.query("SELECT * FROM classes WHERE id = ?", [
      result.insertId,
    ]);
    return sendSuccess(res, rows[0], 201);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return sendError(res, "Nama kelas sudah ada");
    console.error(err);
    return sendError(res, "Gagal menambah kelas", 500);
  }
});

app.put("/api/classes/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const nama = sanitizeString(req.body.nama, 50);
    const tingkat = sanitizeString(req.body.tingkat, 20) || null;
    const keterangan = sanitizeString(req.body.keterangan, 255) || null;
    const isActive = req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : undefined;
    const [existing] = await pool.query("SELECT id, nama FROM classes WHERE id = ?", [id]);
    if (!existing.length) return sendError(res, "Kelas tidak ditemukan", 404);

    await pool.query(
      `UPDATE classes SET
        nama = COALESCE(NULLIF(?, ''), nama),
        tingkat = ?,
        keterangan = ?,
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [nama, tingkat, keterangan, isActive, id]
    );

    if (nama) {
      await pool.query("UPDATE students SET kelas = ? WHERE class_id = ?", [
        nama,
        id,
      ]);
    } else if (existing[0].nama) {
      await pool.query("UPDATE students SET kelas = ? WHERE class_id = ?", [
        existing[0].nama,
        id,
      ]);
    }

    const [rows] = await pool.query("SELECT * FROM classes WHERE id = ?", [id]);
    return sendSuccess(res, rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return sendError(res, "Nama kelas sudah digunakan");
    console.error(err);
    return sendError(res, "Gagal memperbarui kelas", 500);
  }
});

app.delete("/api/classes/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [used] = await pool.query(
      "SELECT COUNT(*) AS c FROM students WHERE class_id = ?",
      [id]
    );
    if (used[0].c > 0) {
      return sendError(
        res,
        `Kelas masih digunakan oleh ${used[0].c} siswa. Pindahkan siswa terlebih dahulu.`
      );
    }
    const [result] = await pool.query("DELETE FROM classes WHERE id = ?", [id]);
    if (!result.affectedRows) return sendError(res, "Kelas tidak ditemukan", 404);
    return sendSuccess(res, { id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal menghapus kelas", 500);
  }
});

// --- Public check graduation ---
app.get("/api/students/check", async (req, res) => {
  try {
    const nis = sanitizeString(req.query.nis, 20);
    const nisn = sanitizeString(req.query.nisn, 20);
    const tanggal_lahir = sanitizeString(req.query.tanggal_lahir, 20);
    
    if (!nis && !nisn) {
      return sendError(res, "Masukkan NIS atau NISN");
    }
    if (!tanggal_lahir) {
      return sendError(res, "Masukkan tanggal lahir");
    }

    let sql = `SELECT s.nis, s.nisn, s.nama, COALESCE(c.nama, s.kelas) AS kelas, DATE_FORMAT(s.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir, s.status, s.keterangan ${STUDENT_JOIN} WHERE `;
    const params = [];
    if (nis) {
      sql += "s.nis = ? AND (s.tanggal_lahir = ? OR s.tanggal_lahir IS NULL)";
      params.push(nis, tanggal_lahir);
    } else {
      sql += "s.nisn = ? AND (s.tanggal_lahir = ? OR s.tanggal_lahir IS NULL)";
      params.push(nisn, tanggal_lahir);
    }
    sql += " LIMIT 1";
    const [rows] = await pool.query(sql, params);
    if (rows.length === 0) {
      return sendError(res, "Data siswa tidak ditemukan. Periksa kembali NIS/NISN dan Tanggal Lahir Anda.", 404);
    }
    return sendSuccess(res, rows[0]);
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal memeriksa kelulusan", 500);
  }
});

// --- Students CRUD (admin) ---
app.get("/api/students", authMiddleware, async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = sanitizeString(req.query.search, 100);
    const status = sanitizeString(req.query.status, 20);
    const kelas = sanitizeString(req.query.kelas, 50);
    const classId = parseInt(req.query.class_id, 10);
    const sort = sanitizeString(req.query.sort, 30) || "nama";
    const order =
      sanitizeString(req.query.order, 4).toLowerCase() === "desc"
        ? "DESC"
        : "ASC";

    const allowedSort = ["nama", "nis", "nisn", "kelas", "status", "created_at"];
    const sortCol = allowedSort.includes(sort) ? sort : "nama";

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(s.nama LIKE ? OR s.nis LIKE ? OR s.nisn LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status && ["lulus", "tidak_lulus"].includes(status)) {
      conditions.push("s.status = ?");
      params.push(status);
    }
    if (classId) {
      conditions.push("s.class_id = ?");
      params.push(classId);
    } else if (kelas) {
      conditions.push("(c.nama = ? OR s.kelas = ?)");
      params.push(kelas, kelas);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total ${STUDENT_JOIN} ${where}`,
      params
    );
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit) || 1;

    const sortMap = {
      nama: "s.nama",
      nis: "s.nis",
      nisn: "s.nisn",
      kelas: "kelas",
      status: "s.status",
      created_at: "s.created_at",
    };
    const orderCol = sortMap[sortCol] || "s.nama";

    const [rows] = await pool.query(
      `SELECT ${STUDENT_FIELDS} ${STUDENT_JOIN} ${where}
       ORDER BY ${orderCol} ${order}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return sendSuccess(res, rows, 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal memuat data siswa", 500);
  }
});

// Bulk import (data sudah diparse di frontend dari Excel)
app.post("/api/students/import", authMiddleware, async (req, res) => {
  try {
    const students = req.body.students;
    if (!Array.isArray(students) || students.length === 0) {
      return sendError(res, "Data siswa kosong");
    }
    if (students.length > 2000) {
      return sendError(res, "Maksimal 2000 baris per import");
    }
    const { imported, failed } = await bulkInsertStudents(students);
    return sendSuccess(res, {
      imported: imported.length,
      failed: failed.length,
      details: { imported, failed },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal import data", 500);
  }
});

app.get("/api/students/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query(
      `SELECT ${STUDENT_FIELDS} ${STUDENT_JOIN} WHERE s.id = ?`,
      [id]
    );
    if (rows.length === 0) return sendError(res, "Siswa tidak ditemukan", 404);
    return sendSuccess(res, rows[0]);
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal memuat siswa", 500);
  }
});

function validateStudentBody(body, isUpdate = false) {
  const errors = [];
  const nis = sanitizeString(body.nis, 20);
  const nisn = sanitizeString(body.nisn, 20);
  const nama = sanitizeString(body.nama, 150);
  const class_id = body.class_id;
  const kelas = sanitizeString(body.kelas, 50);
  const tanggal_lahir = sanitizeString(body.tanggal_lahir, 20);
  const status = sanitizeString(body.status, 20);
  const keterangan = body.keterangan
    ? sanitizeString(body.keterangan, 500)
    : null;

  if (!isUpdate) {
    if (!nis) errors.push("NIS wajib diisi");
    if (!nisn) errors.push("NISN wajib diisi");
    if (!nama) errors.push("Nama wajib diisi");
    if (!class_id && !kelas) errors.push("Kelas wajib dipilih");
    if (!tanggal_lahir) errors.push("Tanggal lahir wajib diisi");
  }
  if (tanggal_lahir) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(tanggal_lahir)) {
      errors.push("Format tanggal lahir tidak valid (harus YYYY-MM-DD)");
    }
  }
  if (status && !["lulus", "tidak_lulus"].includes(status)) {
    errors.push("Status harus lulus atau tidak_lulus");
  }
  return {
    errors,
    data: { nis, nisn, nama, class_id, kelas, tanggal_lahir, status, keterangan },
  };
}

app.post("/api/students", authMiddleware, async (req, res) => {
  try {
    const { errors, data } = validateStudentBody(req.body);
    if (errors.length) return sendError(res, errors.join(", "));

    const classInfo = await resolveClass(data);
    if (classInfo.error) return sendError(res, classInfo.error);

    const status = data.status || "lulus";
    const [result] = await pool.query(
      `INSERT INTO students (nis, nisn, nama, class_id, kelas, tanggal_lahir, status, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nis,
        data.nisn,
        data.nama,
        classInfo.class_id,
        classInfo.kelas,
        data.tanggal_lahir,
        status,
        data.keterangan,
      ]
    );
    const [rows] = await pool.query(
      `SELECT ${STUDENT_FIELDS} ${STUDENT_JOIN} WHERE s.id = ?`,
      [result.insertId]
    );
    return sendSuccess(res, rows[0], 201);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return sendError(res, "NIS atau NISN sudah terdaftar");
    }
    console.error(err);
    return sendError(res, "Gagal menambah siswa", 500);
  }
});

app.put("/api/students/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { errors, data } = validateStudentBody(req.body, true);
    if (errors.length) return sendError(res, errors.join(", "));

    const [existing] = await pool.query("SELECT id FROM students WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) return sendError(res, "Siswa tidak ditemukan", 404);

    let classId = null;
    let kelasName = null;
    if (data.class_id || data.kelas) {
      const classInfo = await resolveClass(data);
      if (classInfo.error) return sendError(res, classInfo.error);
      classId = classInfo.class_id;
      kelasName = classInfo.kelas;
    }

    await pool.query(
      `UPDATE students SET
        nis = COALESCE(NULLIF(?, ''), nis),
        nisn = COALESCE(NULLIF(?, ''), nisn),
        nama = COALESCE(NULLIF(?, ''), nama),
        class_id = COALESCE(?, class_id),
        kelas = COALESCE(NULLIF(?, ''), kelas),
        tanggal_lahir = COALESCE(NULLIF(?, ''), tanggal_lahir),
        status = COALESCE(NULLIF(?, ''), status),
        keterangan = ?
       WHERE id = ?`,
      [
        data.nis,
        data.nisn,
        data.nama,
        classId,
        kelasName,
        data.tanggal_lahir,
        data.status,
        data.keterangan,
        id,
      ]
    );
    const [rows] = await pool.query(
      `SELECT ${STUDENT_FIELDS} ${STUDENT_JOIN} WHERE s.id = ?`,
      [id]
    );
    return sendSuccess(res, rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return sendError(res, "NIS atau NISN sudah digunakan siswa lain");
    }
    console.error(err);
    return sendError(res, "Gagal memperbarui siswa", 500);
  }
});

app.delete("/api/students/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query("DELETE FROM students WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return sendError(res, "Siswa tidak ditemukan", 404);
    }
    return sendSuccess(res, { id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Gagal menghapus siswa", 500);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API Pengumuman Kelulusan SMP PUSRI" });
});

async function start() {
  try {
    await pool.query("SELECT 1");
    await ensureSchema();
    await seedDefaultAdmin();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    console.error("Pastikan MySQL berjalan dan database sudah di-import dari sql/database.sql");
    process.exit(1);
  }
}

start();
