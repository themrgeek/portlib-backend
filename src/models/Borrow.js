const db = require("../config/database");

class Borrow {
  // Create borrow record
  static async create(borrowData) {
    const { studentId, bookCopyId, borrowDurationDays, librarianId } =
      borrowData;

    try {
      // Check student's current borrow limit
      const { data: studentProfile } = await db
        .getClient()
        .from("student_profiles")
        .select("max_borrow_limit, current_borrowed, total_books_borrowed")
        .eq("user_id", studentId)
        .single();

      if (studentProfile.current_borrowed >= studentProfile.max_borrow_limit) {
        throw new Error(
          "Borrow limit reached. Please return some books first."
        );
      }

      // Check if student has pending fines
      const { data: pendingFines } = await db
        .getClient()
        .from("fines")
        .select("amount")
        .eq("student_id", studentId)
        .eq("status", "pending");

      const totalPendingFine = pendingFines.reduce(
        (sum, fine) => sum + parseFloat(fine.amount),
        0
      );
      if (totalPendingFine > 0) {
        throw new Error(
          `You have pending fines of $${totalPendingFine}. Please clear them first.`
        );
      }

      const borrowDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + borrowDurationDays);

      const { data, error } = await db
        .getAdminClient()
        .from("borrow_records")
        .insert({
          student_id: studentId,
          book_copy_id: bookCopyId,
          librarian_id: librarianId,
          borrow_date: borrowDate.toISOString(),
          due_date: dueDate.toISOString(),
          status: "borrowed",
          borrow_duration_days: borrowDurationDays,
          fine_amount: 0.0,
          fine_paid: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update book copy status
      await db
        .getAdminClient()
        .from("book_copies")
        .update({
          status: "borrowed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookCopyId);

      // Update student's borrowed count
      await db
        .getAdminClient()
        .from("student_profiles")
        .update({
          current_borrowed: (studentProfile.current_borrowed || 0) + 1,
          total_books_borrowed: (studentProfile.total_books_borrowed || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", studentId);

      // Update book available copies
      await this.updateBookCopiesCount(bookCopyId);

      return data;
    } catch (error) {
      console.error("Borrow.create error:", error);
      throw error;
    }
  }

  // Return book
  static async returnBook(borrowId, librarianId) {
    try {
      const returnDate = new Date();

      // Get borrow record
      const { data: borrowRecord, error: fetchError } = await db
        .getClient()
        .from("borrow_records")
        .select("*")
        .eq("id", borrowId)
        .single();

      if (fetchError) throw fetchError;

      // Fetch student profile for counts
      const { data: studentProfile } = await db
        .getClient()
        .from("student_profiles")
        .select("current_borrowed,fine_amount")
        .eq("user_id", borrowRecord.student_id)
        .single();

      // Calculate fine ($2 per day)
      let fineAmount = 0;
      if (returnDate > new Date(borrowRecord.due_date)) {
        const diffTime = Math.abs(returnDate - new Date(borrowRecord.due_date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        fineAmount = diffDays * 2.0;
      }

      // Update borrow record
      const { data, error } = await db
        .getAdminClient()
        .from("borrow_records")
        .update({
          return_date: returnDate.toISOString(),
          returned_to_librarian: librarianId,
          status: "returned",
          fine_amount: fineAmount,
          fine_paid: fineAmount === 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", borrowId)
        .select()
        .single();

      if (error) throw error;

      // Update book copy status
      await db
        .getAdminClient()
        .from("book_copies")
        .update({
          status: "available",
          updated_at: new Date().toISOString(),
        })
        .eq("id", borrowRecord.book_copy_id);

      // Update student's borrowed count
      await db
        .getAdminClient()
        .from("student_profiles")
        .update({
          current_borrowed: Math.max(
            0,
            (studentProfile?.current_borrowed || 1) - 1
          ),
          fine_amount: (
            (studentProfile?.fine_amount || 0) + fineAmount
          ).toFixed(2),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", borrowRecord.student_id);

      // Update book available copies
      await this.updateBookCopiesCount(borrowRecord.book_copy_id);

      // Create fine record if applicable
      if (fineAmount > 0) {
        await this.createFineRecord(borrowRecord, fineAmount);
      }

      return data;
    } catch (error) {
      console.error("Borrow.returnBook error:", error);
      throw error;
    }
  }

  // Get borrow records for student
  static async getStudentBorrows(studentId, status = null) {
    try {
      let query = db
        .getClient()
        .from("borrow_records")
        .select(
          `
                    *,
                    book_copies (
                        *,
                        books (*)
                    )
                `
        )
        .eq("student_id", studentId)
        .order("borrow_date", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Borrow.getStudentBorrows error:", error);
      throw error;
    }
  }

  // Get current borrows (not returned)
  static async getCurrentBorrows(studentId) {
    return await this.getStudentBorrows(studentId, "borrowed");
  }

  // Admin view: borrow list with filters
  static async getBorrows({
    status,
    studentId,
    overdueOnly,
    page = 1,
    limit = 10,
  }) {
    const offset = (page - 1) * limit;
    let query = db
      .getClient()
      .from("borrow_records")
      .select(
        `
          *,
          students:student_id(full_name,email),
          book_copies(*, books(*))
        `,
        { count: "exact" }
      )
      .range(offset, offset + limit - 1)
      .order("borrow_date", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }
    if (studentId) {
      query = query.eq("student_id", studentId);
    }
    if (overdueOnly) {
      query = query
        .lt("due_date", new Date().toISOString())
        .neq("status", "returned");
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      borrows: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Admin view: overdue list
  static async getOverdueList() {
    const { data, error } = await db
      .getClient()
      .from("borrow_records")
      .select(
        `
          *,
          students:student_id(full_name,email),
          book_copies(*, books(*))
        `
      )
      .eq("status", "borrowed")
      .lt("due_date", new Date().toISOString())
      .order("due_date");

    if (error) throw error;
    return data;
  }

  static async updateBookCopiesCount(bookCopyId) {
    try {
      // Get book ID from copy
      const { data: copy, error: copyError } = await db
        .getClient()
        .from("book_copies")
        .select("book_id")
        .eq("id", bookCopyId)
        .single();

      if (copyError) throw copyError;

      // Update book copies count
      const { count: totalCopies } = await db
        .getClient()
        .from("book_copies")
        .select("*", { count: "exact", head: true })
        .eq("book_id", copy.book_id);

      const { count: availableCopies } = await db
        .getClient()
        .from("book_copies")
        .select("*", { count: "exact", head: true })
        .eq("book_id", copy.book_id)
        .eq("status", "available");

      await db
        .getAdminClient()
        .from("books")
        .update({
          total_copies: totalCopies,
          available_copies: availableCopies,
          updated_at: new Date().toISOString(),
        })
        .eq("id", copy.book_id);
    } catch (error) {
      console.error("Borrow.updateBookCopiesCount error:", error);
      throw error;
    }
  }

  static async createFineRecord(borrowRecord, amount) {
    try {
      const { data, error } = await db
        .getAdminClient()
        .from("fines")
        .insert({
          student_id: borrowRecord.student_id,
          borrow_record_id: borrowRecord.id,
          amount: amount,
          reason: "Late return",
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Borrow.createFineRecord error:", error);
      throw error;
    }
  }
}

module.exports = Borrow;
