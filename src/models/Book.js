const db = require("../config/database");

class Book {
  // Create a new book
  static async create(bookData, createdBy) {
    const {
      isbn,
      title,
      author,
      publisher,
      publication_year,
      genre,
      description,
      total_copies,
      language,
      pages,
      cover_image,
      location,
      price,
    } = bookData;

    try {
      const { data, error } = await db
        .getAdminClient()
        .from("books")
        .insert({
          isbn,
          title,
          author,
          publisher,
          publication_year,
          genre,
          description,
          total_copies: total_copies || 1,
          available_copies: total_copies || 1,
          language: language || "English",
          pages,
          cover_image,
          location,
          price,
          status: "available",
          is_archived: false,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create book copies
      if (total_copies > 0) {
        for (let i = 1; i <= total_copies; i++) {
          await this.createCopy(data.id, i);
        }
      }

      return data;
    } catch (error) {
      console.error("Book.create error:", error);
      throw new Error(error.message || "Failed to create book");
    }
  }

  // Generate barcode/QR string for a book copy
  static generateBarcode(bookId, copyNumber) {
    const prefix = bookId ? bookId.substring(0, 8) : "UNKNOWN";
    return `BK-${prefix}-${copyNumber}`;
  }

  // Create book copy
  static async createCopy(bookId, copyNumber) {
    try {
      const barcode = this.generateBarcode(bookId, copyNumber);

      const { data, error } = await db
        .getAdminClient()
        .from("book_copies")
        .insert({
          book_id: bookId,
          copy_number: `Copy ${copyNumber}`,
          barcode,
          qr_code: barcode,
          status: "available",
          condition: "good",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Book.createCopy error:", error);
      throw error;
    }
  }

  // Get book by barcode
  static async findByBarcode(barcode) {
    try {
      const { data, error } = await db
        .getClient()
        .from("book_copies")
        .select("*, books!inner(*)")
        .eq("barcode", barcode)
        .eq("books.is_archived", false)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Book.findByBarcode error:", error);
      throw error;
    }
  }

  // Get available books
  static async getAvailableBooks(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await db
        .getClient()
        .from("books")
        .select("*", { count: "exact" })
        .eq("status", "available")
        .eq("is_archived", false)
        .gt("available_copies", 0)
        .range(offset, offset + limit - 1)
        .order("title");

      if (error) throw error;

      return {
        books: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error("Book.getAvailableBooks error:", error);
      throw error;
    }
  }

  // Search books
  static async search(query, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await db
        .getClient()
        .from("books")
        .select("*", { count: "exact" })
        .or(
          `title.ilike.%${query}%,author.ilike.%${query}%,isbn.ilike.%${query}%`
        )
        .eq("is_archived", false)
        .range(offset, offset + limit - 1)
        .order("title");

      if (error) throw error;

      return {
        books: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error("Book.search error:", error);
      throw error;
    }
  }

  // List books with optional search and archived filter
  static async list({ page = 1, limit = 10, query = null, includeArchived }) {
    const offset = (page - 1) * limit;
    let qb = db
      .getClient()
      .from("books")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1)
      .order("title");

    if (!includeArchived) {
      qb = qb.eq("is_archived", false);
    }

    if (query && query.trim().length > 0) {
      qb = qb.or(
        `title.ilike.%${query}%,author.ilike.%${query}%,isbn.ilike.%${query}%`
      );
    }

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      books: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Update book metadata
  static async updateById(bookId, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await db
      .getAdminClient()
      .from("books")
      .update(payload)
      .eq("id", bookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Archive / restore book
  static async setArchiveState(bookId, archived) {
    const now = new Date().toISOString();
    const { data, error } = await db
      .getAdminClient()
      .from("books")
      .update({
        is_archived: archived,
        archived_at: archived ? now : null,
        status: archived ? "inactive" : "available",
        updated_at: now,
      })
      .eq("id", bookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Adjust copies (increment/decrement available copies)
  static async adjustCopies(bookId, delta) {
    if (!delta || delta === 0) {
      throw new Error("Delta must be non-zero");
    }

    // Determine current copy count for numbering
    const { count: existingCopies } = await db
      .getClient()
      .from("book_copies")
      .select("*", { count: "exact", head: true })
      .eq("book_id", bookId);

    if (delta > 0) {
      // Add copies
      for (let i = 0; i < delta; i++) {
        await this.createCopy(bookId, existingCopies + i + 1);
      }
    } else {
      // Remove available copies
      const removeCount = Math.abs(delta);
      const { data: availableCopies, error: fetchError } = await db
        .getClient()
        .from("book_copies")
        .select("id")
        .eq("book_id", bookId)
        .eq("status", "available")
        .limit(removeCount);

      if (fetchError) throw fetchError;
      if (!availableCopies || availableCopies.length < removeCount) {
        throw new Error("Not enough available copies to remove");
      }

      const ids = availableCopies.map((c) => c.id);
      const { error: deleteError } = await db
        .getAdminClient()
        .from("book_copies")
        .delete()
        .in("id", ids);

      if (deleteError) throw deleteError;
    }

    // Refresh counts
    const { count: totalCopies } = await db
      .getClient()
      .from("book_copies")
      .select("*", { count: "exact", head: true })
      .eq("book_id", bookId);

    const { count: availableCopies } = await db
      .getClient()
      .from("book_copies")
      .select("*", { count: "exact", head: true })
      .eq("book_id", bookId)
      .eq("status", "available");

    await db
      .getAdminClient()
      .from("books")
      .update({
        total_copies: totalCopies,
        available_copies: availableCopies,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookId);

    const { data: updated } = await db
      .getClient()
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();

    return updated;
  }
}

module.exports = Book;
