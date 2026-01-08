import express from "express";
import axios from "axios";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// ==========================================
// 1. CREATE BOOK
// ==========================================
router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;

    if (!title || !caption || !rating || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;

    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      // req.user didapat dari middleware yang sudah memanggil Auth Service
      user: req.user.id || req.user._id,
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 2. GET ALL BOOKS (DENGAN KOMUNIKASI MICROSERVICES)
// ==========================================
router.get("/", protectRoute, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const books = await Book.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

    /**
     * PERUBAHAN MICROSERVICES:
     * Mengganti .populate() dengan memanggil Auth Service via REST API (JSON)
     */
    const booksWithUserDetails = await Promise.all(
      books.map(async (book) => {
        try {
          // Memanggil Auth Service untuk mendapatkan profil user per buku
          const userResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/user/${book.user}`);
          return { ...book._doc, user: userResponse.data };
        } catch (error) {
          // Jika Auth Service gagal, kembalikan data user minimal
          return { ...book._doc, user: { username: "Unknown User", profileImage: "" } };
        }
      })
    );

    const totalBooks = await Book.countDocuments();

    res.send({
      books: booksWithUserDetails,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.error("Error in get all books route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ==========================================
// 3. GET USER'S BOOKS
// ==========================================
router.get("/user", protectRoute, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const books = await Book.find({ user: userId }).sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    console.error("Get user books error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ==========================================
// 4. DELETE BOOK
// ==========================================
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const userId = req.user.id || req.user._id;
    if (book.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error("Error deleting image from cloudinary:", deleteError);
      }
    }

    await book.deleteOne();
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ==========================================
// 5. UPDATE BOOK
// ==========================================
router.put("/:id", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) return res.status(404).json({ message: "Book Not Found" });

    const userId = req.user.id || req.user._id;
    if (book.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this book" });
    }

    let imageUrl = book.image;
    if (image && image.startsWith("data:image")) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, { title, caption, rating, image: imageUrl }, { new: true });

    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
