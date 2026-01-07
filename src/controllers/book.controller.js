const BookService = require("../services/book.service");
const errorHandler = require("../middleware/errorHandler");

const bookController = {
  // Add new book
  addBook: errorHandler.asyncHandler(async (req, res) => {
    const bookData = req.body;
    const createdBy = req.user.id;

    const result = await BookService.addBook(bookData, createdBy);
    res.status(201).json(result);
  }),

  // Get available books
  getAvailableBooks: errorHandler.asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const { books, pagination } = await BookService.getAvailableBooks(
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      items: books || [],
      total: pagination?.total ?? books?.length ?? 0,
      nextPage:
        pagination && pagination.page * pagination.limit < pagination.total
          ? pagination.page + 1
          : null,
    });
  }),

  // Search books
  searchBooks: errorHandler.asyncHandler(async (req, res) => {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const { books, pagination } = await BookService.searchBooks(
      q,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      items: books || [],
      total: pagination?.total ?? books?.length ?? 0,
      nextPage:
        pagination && pagination.page * pagination.limit < pagination.total
          ? pagination.page + 1
          : null,
    });
  }),

  // Scan book barcode/QR
  scanBook: errorHandler.asyncHandler(async (req, res) => {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: "Barcode is required",
      });
    }

    const result = await BookService.scanBook(barcode);
    res.status(200).json(result);
  }),

  // Get book details by barcode
  getBookByBarcode: errorHandler.asyncHandler(async (req, res) => {
    const { barcode } = req.params;

    const result = await BookService.getBookByBarcode(barcode);
    const bookCopy = result.book;
    res.status(200).json({
      id: bookCopy?.books?.id || bookCopy?.book_id,
      title: bookCopy?.books?.title,
      author: bookCopy?.books?.author,
      coverImage: bookCopy?.books?.cover_image,
      availability: bookCopy?.status,
      dueDate: bookCopy?.due_date || null,
      category: bookCopy?.books?.genre,
      barcode: bookCopy?.barcode,
      description: bookCopy?.books?.description,
    });
  }),

  // Generate barcode for a book copy (does not create the copy)
  generateBarcode: errorHandler.asyncHandler(async (req, res) => {
    const { bookId, copyNumber = 1 } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "bookId is required",
      });
    }

    const parsedCopyNumber = parseInt(copyNumber, 10);
    if (Number.isNaN(parsedCopyNumber) || parsedCopyNumber < 1) {
      return res.status(400).json({
        success: false,
        message: "copyNumber must be a positive integer",
      });
    }

    const result = BookService.generateBarcode(bookId, parsedCopyNumber);
    res.status(200).json(result);
  }),
};

module.exports = bookController;
