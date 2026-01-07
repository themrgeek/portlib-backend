const BookService = require("./book.service");
const BorrowService = require("./borrow.service");
const ReservationService = require("./reservation.service");

class AdminService {
  async listBooks({ page, limit, query, includeArchived }) {
    return await BookService.listBooks(page, limit, query, includeArchived);
  }

  async addBook(bookData, createdBy) {
    return await BookService.addBook(bookData, createdBy);
  }

  async updateBook(bookId, updates) {
    return await BookService.updateBook(bookId, updates);
  }

  async setArchiveState(bookId, archived) {
    return await BookService.setArchiveState(bookId, archived);
  }

  async adjustCopies(bookId, delta) {
    return await BookService.adjustCopies(bookId, delta);
  }

  async getBorrowHistory({ page, limit, status, studentId, overdueOnly }) {
    return await BorrowService.getAdminBorrowHistory({
      page,
      limit,
      status,
      studentId,
      overdueOnly,
    });
  }

  async getOverdueBorrows() {
    return await BorrowService.getOverdueList();
  }

  async getStudentActivity(studentId) {
    return await BorrowService.getStudentActivity(studentId);
  }

  async listReservations(filters) {
    return await ReservationService.listReservations(filters);
  }

  async createReservation(input) {
    return await ReservationService.createReservation(input);
  }

  async cancelReservation(reservationId, staffId) {
    return await ReservationService.cancelReservation(reservationId, staffId);
  }
}

module.exports = new AdminService();
