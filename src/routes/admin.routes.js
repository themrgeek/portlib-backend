const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth");
const rateLimiter = require("../middleware/rateLimiter");

// All admin routes are rate-limited and require admin role
router.use(rateLimiter.generalRateLimiter);
router.use(authMiddleware.authenticate, authMiddleware.requireRole("admin"));

// Book management
router.get("/books", adminController.listBooks);
router.post("/books", adminController.addBook);
router.patch("/books/:bookId", adminController.updateBook);
router.post("/books/:bookId/archive", adminController.archiveBook);
router.post("/books/:bookId/restore", adminController.restoreBook);
router.post("/books/:bookId/copies/adjust", adminController.adjustCopies);

// Activity visibility
router.get("/activities/borrows", adminController.getBorrowHistory);
router.get("/activities/overdue", adminController.getOverdueBorrows);
router.get(
  "/activities/students/:studentId",
  adminController.getStudentActivity
);
router.get("/activities/reservations", adminController.listReservations);
router.post("/activities/reservations", adminController.createReservation);
router.post(
  "/activities/reservations/:reservationId/cancel",
  adminController.cancelReservation
);

module.exports = router;
