-- Admin/Librarian management enhancements

-- Add soft-archive flags to books and copies
ALTER TABLE IF EXISTS books
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL;

ALTER TABLE IF EXISTS book_copies
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL;

-- Reservations table (for holds/queueing)
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_copy_id UUID REFERENCES book_copies(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    notes TEXT,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_reservation_status CHECK (status IN ('active','fulfilled','cancelled'))
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_books_archived ON books(is_archived);
CREATE INDEX IF NOT EXISTS idx_book_copies_book_id_status ON book_copies(book_id, status);
CREATE INDEX IF NOT EXISTS idx_borrow_records_due_date ON borrow_records(due_date);
CREATE INDEX IF NOT EXISTS idx_reservations_student ON reservations(student_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_book_copy ON reservations(book_copy_id, status);

-- Updated_at trigger for reservations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
