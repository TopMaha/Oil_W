-- ล้างประวัติการสอบทั้งหมด (คงข้อสอบ / พนักงาน / แอดมิน ไว้)
DELETE FROM attempt_answers;
DELETE FROM attempts;
DELETE FROM sqlite_sequence WHERE name IN ('attempts','attempt_answers');
