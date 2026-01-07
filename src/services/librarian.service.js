const BorrowModel = require("../models/Borrow");
const BookModel = require("../models/Book");
const db = require("../config/database");

class LibrarianService {
  // Process book return
  async processReturn(borrowId, librarianId) {
    try {
      // Get borrow record
      const { data: borrowRecord, error } = await db
        .getClient()
        .from("borrow_records")
        .select("*")
        .eq("id", borrowId)
        .single();

      if (error) throw error;

      if (borrowRecord.status === "returned") {
        throw new Error("Book already returned");
      }

      // Process return
      const result = await BorrowModel.returnBook(borrowId, librarianId);

      return {
        success: true,
        message: result.message,
        borrowRecord: result.borrowRecord,
      };
    } catch (error) {
      console.error("Process return error:", error);
      throw error;
    }
  }

  // Get all pending returns
  async getPendingReturns() {
    try {
      const { data, error } = await db
        .getClient()
        .from("borrow_records")
        .select(
          `
                    *,
                    students:student_id (
                        full_name,
                        email,
                        phone
                    ),
                    book_copies (
                        barcode,
                        books (
                            title,
                            author
                        )
                    )
                `
        )
        .eq("status", "borrowed")
        .order("due_date");

      if (error) throw error;

      return {
        success: true,
        pendingReturns: data,
      };
    } catch (error) {
      console.error("Get pending returns error:", error);
      throw error;
    }
  }

  // Get overdue books
  async getOverdueBooks() {
    try {
      const { data, error } = await db
        .getClient()
        .from("borrow_records")
        .select(
          `
                    *,
                    students:student_id (
                        full_name,
                        email,
                        phone,
                        student_profiles (
                            student_id
                        )
                    ),
                    book_copies (
                        barcode,
                        books (
                            title,
                            author
                        )
                    )
                `
        )
        .eq("status", "borrowed")
        .lt("due_date", new Date().toISOString())
        .order("due_date");

      if (error) throw error;

      const overdueBooks = data.map((record) => {
        const diffTime = Math.abs(new Date() - new Date(record.due_date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const fine = diffDays * 2.0;

        return {
          ...record,
          daysOverdue: diffDays,
          calculatedFine: fine,
        };
      });

      return {
        success: true,
        overdueBooks,
      };
    } catch (error) {
      console.error("Get overdue books error:", error);
      throw error;
    }
  }

  // Scan and process book
  async scanAndProcess(barcode, action, userId, durationDays = null) {
    try {
      const bookCopy = await BookModel.findByBarcode(barcode);
      if (!bookCopy) {
        throw new Error("Book not found");
      }

      if (action === "borrow") {
        // Find student by scanning student ID or QR
        // This would be extended to scan student ID
        return {
          success: true,
          message: "Book ready for borrowing",
          book: bookCopy,
        };
      } else if (action === "return") {
        // Find borrow record for this book
        const { data: borrowRecord } = await db
          .getClient()
          .from("borrow_records")
          .select("*")
          .eq("book_copy_id", bookCopy.id)
          .eq("status", "borrowed")
          .single();

        if (!borrowRecord) {
          throw new Error("No active borrow record found for this book");
        }

        return {
          success: true,
          message: "Book ready for return",
          book: bookCopy,
          borrowRecord,
        };
      }

      throw new Error("Invalid action");
    } catch (error) {
      console.error("Scan and process error:", error);
      throw error;
    }
  }
}

module.exports = new LibrarianService();
