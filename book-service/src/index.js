import express from "express";
import cors from "cors";
import "dotenv/config";

// PERUBAHAN 1: Hanya import bookRoutes
// Hapus authRoutes karena sekarang sudah berada di service terpisah
import bookRoutes from "./routes/bookRoutes.js";
import { connectDB } from "./lib/db.js";

const app = express();

/**
 * PERUBAHAN 2: Gunakan PORT 3002
 * Sesuai rencana .env, Book Service berjalan di port 3002 agar tidak bentrok dengan Auth Service (3001)
 */
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(cors());

/**
 * PERUBAHAN 3: Koneksi Database
 * Ini akan menghubungkan ke 'uas_book_db' sesuai konfigurasi .env di folder ini
 */
connectDB();

/**
 * PERUBAHAN 4: Hanya gunakan Endpoint Books
 * Endpoint /api/auth dihapus karena sudah dikelola oleh Auth Service
 */
app.use("/api/books", bookRoutes);

// Root endpoint untuk pengecekan status service
app.get("/", (req, res) => {
  res.send("Book Service RekamBuku (UAS Microservices) is running on port 3002...");
});

/**
 * PERUBAHAN 5: Jalankan Server Lokal
 * Menghapus logika pengecekan Vercel agar bisa langsung jalan di komputer Anda
 */
app.listen(PORT, () => {
  console.log(`Book Service is running on port ${PORT}`);
});

export default app;
