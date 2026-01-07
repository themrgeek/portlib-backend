const ReservationModel = require("../models/Reservation");

class ReservationService {
  async listReservations({ status, page, limit }) {
    try {
      const result = await ReservationModel.list({ status, page, limit });
      return { success: true, ...result };
    } catch (error) {
      console.error("List reservations error:", error);
      throw error;
    }
  }

  async createReservation({ studentId, bookCopyId, notes, staffId }) {
    if (!studentId || !bookCopyId) {
      throw new Error("studentId and bookCopyId are required");
    }
    try {
      const reservation = await ReservationModel.create({
        studentId,
        bookCopyId,
        staffId,
        notes,
      });
      return {
        success: true,
        message: "Reservation created",
        reservation,
      };
    } catch (error) {
      console.error("Create reservation error:", error);
      throw error;
    }
  }

  async cancelReservation(reservationId, staffId) {
    if (!reservationId) {
      throw new Error("reservationId is required");
    }
    try {
      const reservation = await ReservationModel.cancel(reservationId, staffId);
      return {
        success: true,
        message: "Reservation cancelled",
        reservation,
      };
    } catch (error) {
      console.error("Cancel reservation error:", error);
      throw error;
    }
  }
}

module.exports = new ReservationService();
