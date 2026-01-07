const BookModel = require("../models/Book");
const { ROLES } = require("../utils/constants");

class BookService {
  // Add new book
  async addBook(bookData, createdBy) {
    try {
      const book = await BookModel.create(bookData, createdBy);

      return {
        success: true,
        message: "Book added successfully",
        book,
      };
    } catch (error) {
      console.error("Add book error:", error);
      throw error;
    }
  }

  async listBooks(page = 1, limit = 10, query = null, includeArchived = false) {
    try {
      const result = await BookModel.list({
        page,
        limit,
        query,
        includeArchived,
      });
      return { success: true, ...result };
    } catch (error) {
      console.error("List books error:", error);
      throw error;
    }
  }

  async updateBook(bookId, updates) {
    try {
      const book = await BookModel.updateById(bookId, updates);
      return { success: true, message: "Book updated", book };
    } catch (error) {
      console.error("Update book error:", error);
      throw error;
    }
  }

  async setArchiveState(bookId, archived) {
    try {
      const book = await BookModel.setArchiveState(bookId, archived);
      return {
        success: true,
        message: archived ? "Book archived" : "Book restored",
        book,
      };
    } catch (error) {
      console.error("Archive/restore book error:", error);
      throw error;
    }
  }

  async adjustCopies(bookId, delta) {
    try {
      const book = await BookModel.adjustCopies(bookId, delta);
      return {
        success: true,
        message: "Book copies adjusted",
        book,
      };
    } catch (error) {
      console.error("Adjust copies error:", error);
      throw error;
    }
  }

  // Get available books
  async getAvailableBooks(page = 1, limit = 10) {
    try {
      const result = await BookModel.getAvailableBooks(page, limit);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error("Get available books error:", error);
      throw error;
    }
  }

  // Search books
  async searchBooks(query, page = 1, limit = 10) {
    try {
      const result = await BookModel.search(query, page, limit);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error("Search books error:", error);
      throw error;
    }
  }

  // Get book by barcode
  async getBookByBarcode(barcode) {
    try {
      const bookCopy = await BookModel.findByBarcode(barcode);

      if (!bookCopy) {
        throw new Error("Book not found");
      }

      return {
        success: true,
        message: "Book found",
        book: bookCopy,
      };
    } catch (error) {
      console.error("Get book by barcode error:", error);
      throw error;
    }
  }

  // Scan book QR/barcode
  async scanBook(barcode) {
    try {
      const bookCopy = await BookModel.findByBarcode(barcode);

      if (!bookCopy) {
        throw new Error("Invalid barcode. Book not found.");
      }

      const bookInfo = {
        id: bookCopy.id,
        bookId: bookCopy.books.id,
        title: bookCopy.books.title,
        author: bookCopy.books.author,
        isbn: bookCopy.books.isbn,
        barcode: bookCopy.barcode,
        status: bookCopy.status,
        condition: bookCopy.condition,
        available: bookCopy.status === "available",
      };

      return {
        success: true,
        message: "Book scanned successfully",
        book: bookInfo,
      };
    } catch (error) {
      console.error("Scan book error:", error);
      throw error;
    }
  }

  // Generate barcode for a given book/copy without creating it
  generateBarcode(bookId, copyNumber = 1) {
    const barcode = BookModel.generateBarcode(bookId, copyNumber);
    return {
      success: true,
      barcode,
    };
  }
}

module.exports = new BookService();
