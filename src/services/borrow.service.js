const BorrowModel = require("../models/Borrow");
const BookModel = require("../models/Book");
const User = require("../models/User");
const db = require("../config/database");

class BorrowService {
  formatBorrow(record) {
    const book = record?.book_copies?.books || {};
    const cover =
      book.cover_image ||
      book.cover ||
      book.image_url ||
      book.thumbnail ||
      null;

    return {
      id: record.id,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        barcode: record?.book_copies?.barcode,
        copyId: record?.book_copies?.id,
        cover: cover,
        coverImage: cover,
        dueDate: record.due_date,
        fineAmount: record.fine_amount ?? 0,
        availability: record?.book_copies?.status,
        category: book.genre || book.category,
        description: book.description,
      },
      borrowDate: record.borrow_date,
      dueDate: record.due_date,
      status: record.status,
      fine: record.fine_amount ?? 0,
    };
  }

  async fetchBorrowWithRelations(borrowId) {
    const { data, error } = await db
      .getClient()
      .from("borrow_records")
      .select(
        `
        *,
        book_copies(*, books(*))
      `
      )
      .eq("id", borrowId)
      .single();

    if (error) throw error;
    return data;
  }

  // Borrow a book
  async borrowBook(studentId, barcode, durationDays, librarianId = null) {
    try {
      // Get book by barcode
      const bookCopy = await BookModel.findByBarcode(barcode);
      if (!bookCopy) {
        throw new Error("Book not found");
      }

      if (bookCopy.status !== "available") {
        throw new Error("Book is not available for borrowing");
      }

      // Create borrow record
      const borrowRecord = await BorrowModel.create({
        studentId,
        bookCopyId: bookCopy.id,
        borrowDurationDays: durationDays,
        librarianId,
      });

      const hydrated = await this.fetchBorrowWithRelations(borrowRecord.id);
      return this.formatBorrow(hydrated);
    } catch (error) {
      console.error("Borrow book error:", error);
      throw error;
    }
  }

  // Return a book
  async returnBook(borrowId, librarianId) {
    try {
      const borrowRecord = await BorrowModel.returnBook(borrowId, librarianId);

      let message = "Book returned successfully";
      if (borrowRecord.fine_amount > 0) {
        message += `. Fine applied: $${borrowRecord.fine_amount}`;
      }

      return {
        success: true,
        message,
        borrowRecord,
      };
    } catch (error) {
      console.error("Return book error:", error);
      throw error;
    }
  }

  // Get student's current borrows
  async getStudentBorrows(studentId) {
    try {
      const borrows = await BorrowModel.getCurrentBorrows(studentId);

      return borrows.map((borrow) => this.formatBorrow(borrow));
    } catch (error) {
      console.error("Get student borrows error:", error);
      throw error;
    }
  }

  // Get student's borrow history
  async getBorrowHistory(studentId, page = 1, limit = 50) {
    try {
      const history = await BorrowModel.getStudentBorrows(studentId);

      const formattedHistory = history.map((record) =>
        this.formatBorrow(record)
      );
      const offset = (page - 1) * limit;
      return formattedHistory.slice(offset, offset + limit);
    } catch (error) {
      console.error("Get borrow history error:", error);
      throw error;
    }
  }

  // Check overdue books for student
  async checkOverdue(studentId) {
    try {
      const borrows = await BorrowModel.getStudentBorrows(
        studentId,
        "borrowed"
      );
      const now = new Date();

      const overdueBooks = borrows.filter(
        (borrow) => new Date(borrow.due_date) < now
      );

      const overdueInfo = overdueBooks.map((book) => {
        const diffTime = Math.abs(now - new Date(book.due_date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const fine = diffDays * 2.0;
        const base = this.formatBorrow(book);

        return {
          ...base,
          fine: fine,
          daysOverdue: diffDays,
          book: {
            ...base.book,
            fineAmount: fine,
          },
        };
      });

      return overdueInfo;
    } catch (error) {
      console.error("Check overdue error:", error);
      throw error;
    }
  }

  // Admin: list borrows with filters
  async getAdminBorrowHistory({
    page = 1,
    limit = 10,
    status,
    studentId,
    overdueOnly,
  }) {
    try {
      const result = await BorrowModel.getBorrows({
        status,
        studentId,
        overdueOnly,
        page,
        limit,
      });
      return { success: true, ...result };
    } catch (error) {
      console.error("Get admin borrow history error:", error);
      throw error;
    }
  }

  // Admin: overdue list
  async getOverdueList() {
    try {
      const records = await BorrowModel.getOverdueList();
      const enriched = records.map((record) => {
        const diffTime = Math.abs(new Date() - new Date(record.due_date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...record,
          daysOverdue: diffDays,
          calculatedFine: diffDays * 2.0,
        };
      });
      return { success: true, overdue: enriched };
    } catch (error) {
      console.error("Get overdue list error:", error);
      throw error;
    }
  }

  // Admin: student activity (borrows, reservations, fines)
  async getStudentActivity(studentId) {
    if (!studentId) {
      throw new Error("studentId is required");
    }
    try {
      const borrows = await BorrowModel.getStudentBorrows(studentId);

      const { data: reservations } = await db
        .getClient()
        .from("reservations")
        .select(
          `
            *,
            book_copies(*, books(*))
          `
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      const { data: fines } = await db
        .getClient()
        .from("fines")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      return {
        success: true,
        borrows,
        reservations: reservations || [],
        fines: fines || [],
      };
    } catch (error) {
      console.error("Get student activity error:", error);
      throw error;
    }
  }

  // Pay fine for a borrow record
  async payFine(fineId, amount, borrowId = null) {
    try {
      const now = new Date().toISOString();
      // Fetch fine
      let fine = null;
      if (fineId) {
        const { data, error: fineError } = await db
          .getClient()
          .from("fines")
          .select("*")
          .eq("id", fineId)
          .single();
        if (fineError) throw fineError;
        fine = data;
      } else if (borrowId) {
        const { data, error } = await db
          .getClient()
          .from("fines")
          .select("*")
          .eq("borrow_record_id", borrowId)
          .eq("status", "pending")
          .maybeSingle();
        if (error) throw error;
        fine = data;
      }

      if (!fine) {
        throw new Error("Fine not found");
      }

      const paidAmount = Number.isFinite(amount) ? amount : fine.amount || 0;

      // Mark fine as paid
      const { error: updateError } = await db
        .getAdminClient()
        .from("fines")
        .update({
          status: "paid",
          amount: paidAmount,
          paid_at: now,
          updated_at: now,
        })
        .eq("id", fineId);

      if (updateError) throw updateError;

      // Mark borrow record fine as paid
      if (fine.borrow_record_id) {
        await db
          .getAdminClient()
          .from("borrow_records")
          .update({
            fine_paid: true,
            updated_at: now,
          })
          .eq("id", fine.borrow_record_id);
      }

      // Reduce student's outstanding fine total
      if (fine.student_id) {
        const { data: profile } = await db
          .getClient()
          .from("student_profiles")
          .select("fine_amount")
          .eq("user_id", fine.student_id)
          .single();

        if (profile) {
          const newFineAmount = Math.max(
            0,
            parseFloat(profile.fine_amount || 0) - parseFloat(paidAmount || 0)
          );
          await db
            .getAdminClient()
            .from("student_profiles")
            .update({
              fine_amount: newFineAmount,
              updated_at: now,
            })
            .eq("user_id", fine.student_id);
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Pay fine error:", error);
      throw error;
    }
  }
}

module.exports = new BorrowService();
