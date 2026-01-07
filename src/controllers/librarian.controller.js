const LibrarianService = require("../services/librarian.service");
const BorrowService = require("../services/borrow.service");
const BookService = require("../services/book.service");
const errorHandler = require("../middleware/errorHandler");

const librarianController = {
  // Process book return
  processReturn: errorHandler.asyncHandler(async (req, res) => {
    const { borrowId } = req.body;
    const librarianId = req.user.id;

    if (!borrowId) {
      return res.status(400).json({
        success: false,
        message: "Borrow ID is required",
      });
    }

    const result = await LibrarianService.processReturn(borrowId, librarianId);
    res.status(200).json(result);
  }),

  // Get pending returns
  getPendingReturns: errorHandler.asyncHandler(async (req, res) => {
    const result = await LibrarianService.getPendingReturns();
    res.status(200).json(result);
  }),

  // Get overdue books
  getOverdueBooks: errorHandler.asyncHandler(async (req, res) => {
    const result = await LibrarianService.getOverdueBooks();
    res.status(200).json(result);
  }),

  // Scan book for processing
  scanBook: errorHandler.asyncHandler(async (req, res) => {
    const { barcode, action, durationDays } = req.body;
    const librarianId = req.user.id;

    if (!barcode || !action) {
      return res.status(400).json({
        success: false,
        message: "Barcode and action are required",
      });
    }

    if (action === "borrow" && !durationDays) {
      return res.status(400).json({
        success: false,
        message: "Duration days required for borrowing",
      });
    }

    const result = await LibrarianService.scanAndProcess(
      barcode,
      action,
      librarianId,
      durationDays
    );
    res.status(200).json(result);
  }),

  // Complete borrow process (after scanning student)
  completeBorrow: errorHandler.asyncHandler(async (req, res) => {
    const { barcode, studentId, durationDays } = req.body;
    const librarianId = req.user.id;

    if (!barcode || !studentId || !durationDays) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const result = await BorrowService.borrowBook(
      studentId,
      barcode,
      durationDays,
      librarianId
    );
    res.status(200).json(result);
  }),

  // Soft-remove book copy (archive book)
  archiveBook: errorHandler.asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const result = await BookService.setArchiveState(bookId, true);
    res.status(200).json(result);
  }),

  // Restore archived book
  restoreBook: errorHandler.asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const result = await BookService.setArchiveState(bookId, false);
    res.status(200).json(result);
  }),

  // View student activity (borrow/reservation/fines)
  getStudentActivity: errorHandler.asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const result = await BorrowService.getStudentActivity(studentId);
    res.status(200).json(result);
  }),
};

module.exports = librarianController;
