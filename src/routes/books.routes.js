const express = require("express");
const router = express.Router();
const bookController = require("../controllers/book.controller");
const authMiddleware = require("../middleware/auth");
const validatorMiddleware = require("../middleware/validator");
const rateLimiter = require("../middleware/rateLimiter");

// Apply rate limiting
router.use(rateLimiter.generalRateLimiter);

// Public routes
router.get("/available", bookController.getAvailableBooks);
router.get("/search", bookController.searchBooks);
router.get("/barcode/:barcode", bookController.getBookByBarcode);

// Protected routes (require authentication)
router.use(authMiddleware.authenticate);

// Librarian/Admin only routes
router.post(
  "/add",
  authMiddleware.requireRole("librarian", "admin"),
  bookController.addBook
);

router.post(
  "/generate-barcode",
  authMiddleware.requireRole("librarian", "admin"),
  bookController.generateBarcode
);

router.post(
  "/scan",
  authMiddleware.requireRole("student", "librarian", "admin"),
  bookController.scanBook
);

module.exports = router;
