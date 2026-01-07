const express = require("express");
const router = express.Router();
const borrowController = require("../controllers/borrow.controller");
const authMiddleware = require("../middleware/auth");
const validatorMiddleware = require("../middleware/validator");
const rateLimiter = require("../middleware/rateLimiter");

// Apply rate limiting
router.use(rateLimiter.generalRateLimiter);

// Student routes (require authentication and student role)
router.use(authMiddleware.authenticate, authMiddleware.requireRole("student"));

router.post("/borrow", borrowController.borrowBook);
router.get("/current", borrowController.getCurrentBorrows);
router.get("/history", borrowController.getBorrowHistory);
router.get("/overdue", borrowController.checkOverdue);
router.post("/request-return", borrowController.requestReturn);
router.post("/pay-fine", borrowController.payFine);

module.exports = router;
