import jwt from "jsonwebtoken";
import axios from "axios";

const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No authentication token, access denied!",
      });
    }

    const token = authHeader.split(" ")[1];

    // 1. Verifikasi token secara lokal di Book Service
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * PERUBAHAN KRUSIAL UNTUK MICROSERVICES (UAS Syarat No. 3):
     * Kita tidak menggunakan 'User.findById' karena database user ada di Auth Service.
     * Kita memanggil API Auth Service menggunakan Axios.
     */
    try {
      const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/user/${decoded.userId}`);

      const user = response.data;

      if (!user) {
        return res.status(401).json({
          message: "User not found, access denied!",
        });
      }

      // Simpan data user ke request agar bisa digunakan di controller/routes
      req.user = user;
      next();
    } catch (apiError) {
      console.error("Error connecting to Auth Service:", apiError.message);
      return res.status(401).json({ message: "Failed to verify user with Auth Service" });
    }
  } catch (error) {
    console.log("Authentication error:", error.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

export default protectRoute;
