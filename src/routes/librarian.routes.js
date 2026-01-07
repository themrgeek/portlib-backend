const express = require("express");
const router = express.Router();
const librarianController = require("../controllers/librarian.controller");
const authMiddleware = require("../middleware/auth");
const validatorMiddleware = require("../middleware/validator");
const rateLimiter = require("../middleware/rateLimiter");

// Apply rate limiting and authentication
router.use(rateLimiter.generalRateLimiter);
router.use(
  authMiddleware.authenticate,
  authMiddleware.requireRole("librarian", "admin")
);

// Librarian operations
router.post("/process-return", librarianController.processReturn);
router.get("/pending-returns", librarianController.getPendingReturns);
router.get("/overdue-books", librarianController.getOverdueBooks);
router.post("/scan-book", librarianController.scanBook);
router.post("/complete-borrow", librarianController.completeBorrow);
router.post("/books/:bookId/archive", librarianController.archiveBook);
router.post("/books/:bookId/restore", librarianController.restoreBook);
router.get(
  "/students/:studentId/activity",
  librarianController.getStudentActivity
);

module.exports = router;
