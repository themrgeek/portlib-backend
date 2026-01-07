const BorrowService = require("../services/borrow.service");
const errorHandler = require("../middleware/errorHandler");

const borrowController = {
  // Borrow a book
  borrowBook: errorHandler.asyncHandler(async (req, res) => {
    const { barcode, durationDays } = req.body;
    const studentId = req.user.id;

    if (!barcode || !durationDays) {
      return res.status(400).json({
        success: false,
        message: "Barcode and duration are required",
      });
    }

    if (durationDays < 1 || durationDays > 30) {
      return res.status(400).json({
        success: false,
        message: "Duration must be between 1 and 30 days",
      });
    }

    const result = await BorrowService.borrowBook(
      studentId,
      barcode,
      durationDays
    );
    res.status(200).json(result);
  }),

  // Get current borrows
  getCurrentBorrows: errorHandler.asyncHandler(async (req, res) => {
    const studentId = req.user.id;

    const borrows = await BorrowService.getStudentBorrows(studentId);
    res.status(200).json(borrows);
  }),

  // Get borrow history
  getBorrowHistory: errorHandler.asyncHandler(async (req, res) => {
    const studentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const history = await BorrowService.getBorrowHistory(
      studentId,
      parseInt(page),
      parseInt(limit)
    );
    res.status(200).json(history);
  }),

  // Check overdue status
  checkOverdue: errorHandler.asyncHandler(async (req, res) => {
    const studentId = req.user.id;

    const overdue = await BorrowService.checkOverdue(studentId);
    res.status(200).json(overdue);
  }),

  // Request return (student initiates return)
  requestReturn: errorHandler.asyncHandler(async (req, res) => {
    const { borrowId } = req.body;
    const studentId = req.user.id;

    if (!borrowId) {
      return res.status(400).json({
        success: false,
        message: "Borrow ID is required",
      });
    }

    // In a real app, this would create a return request
    // For now, just acknowledge the request
    res.status(200).json({
      success: true,
      message:
        "Return request submitted. Please bring the book to the librarian.",
      borrowId,
    });
  }),

  // Pay fine
  payFine: errorHandler.asyncHandler(async (req, res) => {
    const { fineId, amount, borrowId } = req.body;

    if (!fineId && !borrowId) {
      return res.status(400).json({
        success: false,
        message: "Fine ID or Borrow ID is required",
      });
    }

    const result = await BorrowService.payFine(fineId, amount, borrowId);
    res.status(200).json(result);
  }),
};

module.exports = borrowController;
