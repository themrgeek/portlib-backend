const moment = require("moment");
const db = require("../config/database");
const EmailService = require("./email.service");
const emailConfig = require("../config/email");

const REMINDER_INTERVAL_MINUTES =
  parseInt(process.env.REMINDER_INTERVAL_MINUTES || "30", 10) || 30;
const DUE_SOON_THRESHOLD_HOURS =
  parseInt(process.env.REMINDER_DUE_SOON_HOURS || "24", 10) || 24;

class ReminderService {
  constructor() {
    this.intervalRef = null;
  }

  async fetchBorrowWindows() {
    const now = moment().toISOString();
    const soon = moment().add(DUE_SOON_THRESHOLD_HOURS, "hours").toISOString();

    const baseSelect = `
      id,
      due_date,
      status,
      students:student_id(full_name,email),
      book_copies(
        barcode,
        status,
        books(title,author,description)
      )
    `;

    const overduePromise = db
      .getClient()
      .from("borrow_records")
      .select(baseSelect)
      .eq("status", "borrowed")
      .lt("due_date", now);

    const dueSoonPromise = db
      .getClient()
      .from("borrow_records")
      .select(baseSelect)
      .eq("status", "borrowed")
      .gte("due_date", now)
      .lte("due_date", soon);

    const [{ data: overdue, error: overdueError }, { data: dueSoon, error }] =
      await Promise.all([overduePromise, dueSoonPromise]);

    if (overdueError) {
      console.error(
        "[ReminderService] Failed to load overdue borrows",
        overdueError
      );
    }
    if (error) {
      console.error("[ReminderService] Failed to load due-soon borrows", error);
    }

    return {
      overdue: overdue || [],
      dueSoon: dueSoon || [],
    };
  }

  async sendReminderEmail(record, type = "due") {
    const student = record.students || {};
    if (!student.email) {
      console.warn(
        "[ReminderService] Skip reminder - missing student email",
        record.id
      );
      return;
    }

    const book = record.book_copies?.books || {};
    const barcode = record.book_copies?.barcode;
    const dueDate = moment(record.due_date).format("MMM D, YYYY");
    const isOverdue = type === "overdue";

    const subject = isOverdue
      ? `Overdue: ${book.title || "Book"} is past due`
      : `Reminder: ${book.title || "Book"} due ${dueDate}`;

    const statusLine = isOverdue
      ? `This item is overdue. Please return it as soon as possible to avoid further fines.`
      : `This item is due soon on ${dueDate}.`;

    const html = `
      <h2>${subject}</h2>
      <p>Hi ${student.full_name || "Student"},</p>
      <p>${statusLine}</p>
      <ul>
        <li><strong>Title:</strong> ${book.title || "Untitled"}</li>
        <li><strong>Author:</strong> ${book.author || "Unknown"}</li>
        <li><strong>Barcode:</strong> ${barcode || "N/A"}</li>
        <li><strong>Due date:</strong> ${dueDate}</li>
      </ul>
      <p>If you have already returned this book, please ignore this email.</p>
      <p>— PortLib</p>
    `;

    try {
      await EmailService.sendMail({
        to: student.email,
        from: emailConfig.from || EmailService.transporter.options?.from,
        subject,
        html,
        text: `${statusLine} Title: ${
          book.title || "Untitled"
        }; Due: ${dueDate}`,
      });
      console.log(
        `[ReminderService] Reminder sent to ${student.email} (${type})`
      );
    } catch (err) {
      console.error(
        `[ReminderService] Failed to send ${type} reminder for borrow ${record.id}`,
        err
      );
    }
  }

  async run() {
    try {
      const { overdue, dueSoon } = await this.fetchBorrowWindows();

      await Promise.all([
        ...overdue.map((record) => this.sendReminderEmail(record, "overdue")),
        ...dueSoon.map((record) => this.sendReminderEmail(record, "due")),
      ]);

      console.log(
        `[ReminderService] Completed cycle: ${dueSoon.length} due-soon, ${overdue.length} overdue`
      );
    } catch (err) {
      console.error("[ReminderService] Error running reminder cycle", err);
    }
  }

  start() {
    if (this.intervalRef) return;
    console.log(
      `[ReminderService] Starting reminder loop every ${REMINDER_INTERVAL_MINUTES} minutes`
    );
    this.run();
    this.intervalRef = setInterval(
      () => this.run(),
      REMINDER_INTERVAL_MINUTES * 60 * 1000
    );
  }

  stop() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }
}

module.exports = new ReminderService();
