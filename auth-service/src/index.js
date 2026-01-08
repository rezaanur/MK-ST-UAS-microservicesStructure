import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./lib/db.js";

const app = express();
// Gunakan port 3001 untuk Auth Service di lokal
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// Jalankan koneksi database
// Ini akan mengambil MONGO_URI dari file .env lokal Anda
connectDB();

// Endpoint Authentication
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Auth Service RekamBuku (Lokal) is running...");
});

// Langsung jalankan listen tanpa syarat Vercel
app.listen(PORT, () => {
  console.log(`Server Auth Service berjalan di: http://localhost:${PORT}`);
});

export default app;
