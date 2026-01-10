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

// Konfigurasi CORS untuk allow frontend dan auth service
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:3173", "https://mk-st-uas-frontend.vercel.app", "https://mk-st-uas-microservices-auth-service.vercel.app", process.env.FRONTEND_URL, process.env.AUTH_SERVICE_URL],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

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

// Konfig Vercel
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
