const AdminService = require("../services/admin.service");
const errorHandler = require("../middleware/errorHandler");

const adminController = {
  // Books
  listBooks: errorHandler.asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, q, includeArchived } = req.query;
    const result = await AdminService.listBooks({
      page: parseInt(page),
      limit: parseInt(limit),
      query: q,
      includeArchived: includeArchived === "true",
    });
    res.status(200).json(result);
  }),

  addBook: errorHandler.asyncHandler(async (req, res) => {
    const createdBy = req.user.id;
    const bookData = req.body;
    const result = await AdminService.addBook(bookData, createdBy);
    res.status(201).json(result);
  }),

  updateBook: errorHandler.asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const updates = req.body;
    const result = await AdminService.updateBook(bookId, updates);
    res.status(200).json(result);
  }),

  archiveBook: errorHandler.asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const result = await AdminService.setArchiveState(bookId, true);
    res.status(200).json(result);
  }),

  restoreBook: errorHandler.asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const result = await AdminService.setArchiveState(bookId, false);
    res.status(200).json(result);
  }),

  adjustCopies: errorHandler.asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const { delta } = req.body;
    const result = await AdminService.adjustCopies(bookId, parseInt(delta));
    res.status(200).json(result);
  }),

  // Activities
  getBorrowHistory: errorHandler.asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, studentId, overdueOnly } = req.query;
    const result = await AdminService.getBorrowHistory({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      studentId,
      overdueOnly: overdueOnly === "true",
    });
    res.status(200).json(result);
  }),

  getOverdueBorrows: errorHandler.asyncHandler(async (req, res) => {
    const result = await AdminService.getOverdueBorrows();
    res.status(200).json(result);
  }),

  getStudentActivity: errorHandler.asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const result = await AdminService.getStudentActivity(studentId);
    res.status(200).json(result);
  }),

  listReservations: errorHandler.asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;
    const result = await AdminService.listReservations({
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.status(200).json(result);
  }),

  createReservation: errorHandler.asyncHandler(async (req, res) => {
    const { studentId, bookCopyId, notes } = req.body;
    const staffId = req.user.id;
    const result = await AdminService.createReservation({
      studentId,
      bookCopyId,
      notes,
      staffId,
    });
    res.status(201).json(result);
  }),

  cancelReservation: errorHandler.asyncHandler(async (req, res) => {
    const { reservationId } = req.params;
    const staffId = req.user.id;
    const result = await AdminService.cancelReservation(reservationId, staffId);
    res.status(200).json(result);
  }),
};

module.exports = adminController;
