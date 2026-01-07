const db = require("../config/database");

class Reservation {
  static async create({ studentId, bookCopyId, staffId, notes }) {
    const now = new Date().toISOString();
    const { data, error } = await db
      .getAdminClient()
      .from("reservations")
      .insert({
        student_id: studentId,
        book_copy_id: bookCopyId,
        staff_id: staffId,
        notes,
        status: "active",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async cancel(reservationId, staffId) {
    const now = new Date().toISOString();
    const { data, error } = await db
      .getAdminClient()
      .from("reservations")
      .update({
        status: "cancelled",
        cancelled_by: staffId,
        cancelled_at: now,
        updated_at: now,
      })
      .eq("id", reservationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async list({ status, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let query = db
      .getClient()
      .from("reservations")
      .select(
        `
          *,
          students:student_id(full_name,email),
          book_copies(*, books(*))
        `,
        { count: "exact" }
      )
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      reservations: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

module.exports = Reservation;
