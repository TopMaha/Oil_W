-- ===============================================================
--  WESCO Assessment - ข้อมูลตั้งต้น (แปลงจาก แบบทดสอบพนักงาน.xlsx)
--  รันด้วย:  npx wrangler d1 execute wesco_assessment --remote --file=./db/seed.sql
-- ===============================================================
PRAGMA foreign_keys = ON;

DELETE FROM choices;
DELETE FROM questions;
DELETE FROM topic_refs;
DELETE FROM topics;
DELETE FROM sqlite_sequence WHERE name IN ('topics','questions','choices','topic_refs');

-- ---- TH-ADM-000 | Quality Manual ----
INSERT INTO topics (code,title,subtitle,category,time_limit_min,practical_max,shuffle,is_active,sort_order) VALUES
  ('TH-ADM-000','Quality Manual','คู่มือคุณภาพ WESCO TLD Holding','ระบบคุณภาพ',15,0,1,1,10);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-ADM-000'),1,'single','WESCO TLD Holding ดำเนินธุรกิจหลักเกี่ยวกับอะไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=1),'A','ออกแบบเครื่องจักรอุตสาหกรรม',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=1),'B','พัฒนาระบบซอฟต์แวร์',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=1),'C','ประสานงานและพัฒนาระบบไฟฟ้าต้นแบบและงานประกอบ',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=1),'D','ขายวัตถุดิบอุตสาหกรรม',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-ADM-000'),2,'single','Quality Policy ของบริษัทคืออะไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=2),'A','Customer First',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=2),'B','Zero Defect Product',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=2),'C','Committed to exceeding customer expectations through continuous process improvement',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=2),'D','Quality Begins with Me',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-ADM-000'),3,'single','หากเครื่องมือวัดเป็นส่วนสำคัญต่อความถูกต้องของผลการวัด จะต้องทำอะไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=3),'A','เก็บในตู้ล็อกเท่านั้น',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=3),'B','สอบเทียบหรือทวนสอบตามระยะเวลาที่กำหนด',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=3),'C','เปลี่ยนเครื่องมือทุกปี',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=3),'D','ใช้เฉพาะฝ่าย QA',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-ADM-000'),4,'single','ข้อใดเป็นวิธีจัดการ Nonconforming Output?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=4),'A','Segregation / Containment',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=4),'B','Correction',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=4),'C','Inform Customer',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=4),'D','ถูกทุกข้อ',1,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-ADM-000'),5,'single','Internal Audit มีวัตถุประสงค์เพื่ออะไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=5),'A','ตรวจจับพนักงานที่ทำผิด',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=5),'B','ประเมินว่า QMS สอดคล้องกับข้อกำหนดและมีการนำไปใช้อย่างมีประสิทธิผล',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=5),'C','ลดจำนวนพนักงาน',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-ADM-000') AND seq=5),'D','ควบคุมต้นทุนการผลิต',0,3);

-- ---- TH-BP-025 | Incoming Process ----
INSERT INTO topics (code,title,subtitle,category,time_limit_min,practical_max,shuffle,is_active,sort_order) VALUES
  ('TH-BP-025','Incoming Process','Incoming Quality Assurance (IQA)','กระบวนการคุณภาพ',15,10,1,1,20);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-025'),1,'single','วัตถุประสงค์หลักของกระบวนการ Incoming Quality Assurance (IQA) คืออะไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=1),'ก','ควบคุมต้นทุนการจัดซื้อวัตถุดิบ',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=1),'ข','ตรวจสอบและควบคุมคุณภาพวัตถุดิบก่อนเข้าสู่กระบวนการผลิต',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=1),'ค','ควบคุมแผนการผลิตประจำวัน',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=1),'ง','ตรวจสอบผลิตภัณฑ์สำเร็จรูปก่อนส่งลูกค้า',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-025'),2,'single','หากพบว่าเอกสารประกอบการจัดส่งไม่ครบถ้วน IQA ต้องดำเนินการอย่างไรเป็นลำดับแรก?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=2),'ก','ย้ายวัสดุเข้าสู่ Store ทันที',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=2),'ข','ส่งคืน Supplier ทันที',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=2),'ค','คัดแยกวัสดุไว้ใน Hold Area และแจ้ง QA Engineer หรือ SQE',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=2),'ง','อนุมัติ Use As Is',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-025'),3,'single','สำหรับ Lot Size = 1,000 ชิ้น ต้องสุ่มตรวจจำนวนกี่ชิ้นตาม AQL Sampling Plan?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=3),'ก','32 ชิ้น',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=3),'ข','50 ชิ้น',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=3),'ค','80 ชิ้น',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=3),'ง','125 ชิ้น',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-025'),4,'single','ในการตรวจสอบ Wire Harness รายการใดถูกจัดเป็น Critical Defect?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=4),'ก','Appearance Inspection',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=4),'ข','Identification Verification',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=4),'ค','Pull Test',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=4),'ง','Document Verification',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-025'),5,'single','เมื่อพบวัตถุดิบไม่เป็นไปตามข้อกำหนด (Reject) ข้อใดไม่ใช่การดำเนินการของ IQA?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=5),'ก','ติดฉลาก Reject Report',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=5),'ข','จัดทำ NCR',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=5),'ค','แยกวัสดุไว้ในพื้นที่ MRB',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-025') AND seq=5),'ง','นำวัสดุเข้าคลัง Store ทันที',1,3);

-- ---- TH-BP-024 | General In-Process & Final Inspection ----
INSERT INTO topics (code,title,subtitle,category,time_limit_min,practical_max,shuffle,is_active,sort_order) VALUES
  ('TH-BP-024','General In-Process & Final Inspection','การตรวจสอบระหว่างกระบวนการและขั้นสุดท้าย','กระบวนการคุณภาพ',15,10,1,1,30);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-024'),1,'single','วัตถุประสงค์ของกระบวนการนี้คืออะไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=1),'ก','กำหนดระบบการจัดซื้อวัตถุดิบ',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=1),'ข','กำหนดระบบการตรวจสอบระหว่างกระบวนการผลิตสำหรับงานประกอบทั้งหมด',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=1),'ค','กำหนดระบบการจัดการคลังสินค้า',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=1),'ง','กำหนดระบบการส่งมอบสินค้าให้ลูกค้า',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-024'),2,'single','การตรวจสอบ IPQA/OQA ต้องดำเนินการตามเอกสารใดเป็นหลัก?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=2),'ก','Packing List',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=2),'ข','Purchase Order',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=2),'ค','Inspection Checklist ที่เกี่ยวข้อง',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=2),'ง','NCR',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-024'),3,'single','ข้อใดต่อไปนี้ถือเป็นตัวอย่างของ Critical Issue?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=3),'ก','สีซีดเล็กน้อยที่ไม่มีผลต่อการใช้งาน',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=3),'ข','เอกสารจัดเก็บไม่เป็นระเบียบ',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=3),'ค','Wrong Part หรือ Missing Components',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=3),'ง','ป้ายระบุพื้นที่ชำรุด',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-024'),4,'single','หากผลการตรวจสอบไม่ผ่านและเป็น Non-Critical Issue ต้องดำเนินการอย่างไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=4),'ก','หยุดไลน์การผลิตทันที',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=4),'ข','ออก 8D ทันที',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=4),'ค','ดำเนินการ Containment Action และกลับไปขั้นตอนการตรวจสอบ',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=4),'ง','Scrap ผลิตภัณฑ์ทั้งหมด',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-024'),5,'single','กรณีพบ Recurring Issue หรือปัญหาที่ส่งผลกระทบต่อลูกค้า QA ต้องออกเอกสารใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=5),'ก','COC',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=5),'ข','CAR เท่านั้น',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=5),'ค','NCR',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-024') AND seq=5),'ง','8D Report',1,3);

-- ---- TH-BP-07.01 | Final Test and Inspection ----
INSERT INTO topics (code,title,subtitle,category,time_limit_min,practical_max,shuffle,is_active,sort_order) VALUES
  ('TH-BP-07.01','Final Test and Inspection','การทดสอบและตรวจสอบขั้นสุดท้าย','กระบวนการคุณภาพ',15,10,1,1,40);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.01'),1,'single','ก่อนเริ่ม Final Inspection ต้องตรวจสอบข้อมูลใดใน Work Order ให้ถูกต้อง?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=1),'ก','ราคาสินค้าและต้นทุนการผลิต',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=1),'ข','Assembly Item และ Revision ให้ตรงกับเอกสารการผลิต',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=1),'ค','รายชื่อ Supplier',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=1),'ง','เลขที่ Invoice',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.01'),2,'single','หากสถานะ FAI ใน Work Order ระบุว่าต้องดำเนินการ FAI ผู้ตรวจสอบต้องทำอย่างไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=2),'ก','ข้ามขั้นตอน FAI ได้',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=2),'ข','แจ้งผู้รับผิดชอบ FAI เพื่อสร้าง Operation Sequence 35',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=2),'ค','ส่งงานเข้าบรรจุภัณฑ์ทันที',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=2),'ง','ปิด Work Order',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.01'),3,'single','ข้อใดเป็นหนึ่งในรายการที่ต้องตรวจสอบระหว่าง Final Inspection?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=3),'ก','ตรวจสอบตำแหน่งและข้อมูลบนฉลาก',1,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=3),'ข','ตรวจสอบราคาวัตถุดิบ',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=3),'ค','ตรวจสอบใบเสนอราคา',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=3),'ง','ตรวจสอบการคัดเลือก Supplier',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.01'),4,'single','มาตรฐานใดที่ใช้ในการตรวจสอบคุณภาพงานประกอบ?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=4),'ก','ISO 9001',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=4),'ข','IPC/WHMA-A-620',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=4),'ค','ANSI Z1.4',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=4),'ง','ISO 14001',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.01'),5,'single','เมื่อการทดสอบและการตรวจสอบเสร็จสิ้น ผู้ตรวจสอบต้องดำเนินการข้อใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=5),'ก','ลงนามใน Work Order พร้อมวันที่และอักษรย่อผู้ตรวจสอบ',1,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=5),'ข','ลบข้อมูลการทดสอบออกจากระบบ',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=5),'ค','ส่ง Work Order กลับไป Production โดยไม่บันทึกผล',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.01') AND seq=5),'ง','ทำลายเอกสารการตรวจสอบ',0,3);

-- ---- TH-BP-07.02 | Wire Run List Interpretation ----
INSERT INTO topics (code,title,subtitle,category,time_limit_min,practical_max,shuffle,is_active,sort_order) VALUES
  ('TH-BP-07.02','Wire Run List Interpretation','การอ่านและตีความ Wire Run List','การผลิต',15,10,1,1,50);
INSERT INTO topic_refs (topic_id,title,image_url,html,sort_order) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.02'),'Run List BOM & Label Orientation Detail','/assets/ref/bom-label-detail.png',NULL,0);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.02'),1,'single','Wire Run List คืออะไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=1),'ก','เอกสารควบคุมที่ประกอบด้วย Run List BOM และ Wire Sheet',1,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=1),'ข','เอกสารจัดซื้อวัตถุดิบ',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=1),'ค','เอกสารตรวจรับสินค้า',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=1),'ง','เอกสารอนุมัติการผลิต',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.02'),2,'single','ก่อนเริ่มงาน ผู้ประกอบต้องตรวจสอบข้อมูลใดให้ตรงกับ Work Order?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=2),'ก','ราคาและต้นทุนผลิตภัณฑ์',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=2),'ข','Assembly Item และ Revision',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=2),'ค','ชื่อ Supplier',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=2),'ง','เลข Invoice',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.02'),3,'single','ใน Run List BOM ช่อง QTY (Quantity) หมายถึงอะไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=3),'ก','หมายเลขชิ้นส่วน',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=3),'ข','หน่วยนับ',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=3),'ค','จำนวนชิ้นส่วนหรือวัสดุที่ต้องใช้',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=3),'ง','รายละเอียดของวัสดุ',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.02'),4,'single','หาก Label Location ระบุเป็น [L, 0.5] ต้องติดฉลากอย่างไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=4),'ก','ด้านขวาของขั้วต่อ ระยะ 0.5 นิ้ว',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=4),'ข','ด้านซ้ายของขั้วต่อ ระยะ 0.5 นิ้ว',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=4),'ค','กลางสายไฟ ระยะ 0.5 นิ้ว',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=4),'ง','ด้านซ้ายของขั้วต่อ ระยะ 5 นิ้ว',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.02'),5,'single','หากความยาวสายไฟ (Cut Length) ไม่ตรงตามที่ระบุใน Wire Run List ผู้ปฏิบัติงานต้องทำอย่างไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=5),'ก','ตัดสายและประกอบต่อได้ทันที',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=5),'ข','ปรับความยาวตามความเหมาะสม',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=5),'ค','แจ้งหัวหน้างานก่อนดำเนินการต่อ',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-07.02') AND seq=5),'ง','เปลี่ยนสายไฟใหม่เอง',0,3);

-- ---- TH-BP-012 | Control of Nonconforming Product ----
INSERT INTO topics (code,title,subtitle,category,time_limit_min,practical_max,shuffle,is_active,sort_order) VALUES
  ('TH-BP-012','Control of Nonconforming Product','การควบคุมผลิตภัณฑ์ที่ไม่เป็นไปตามข้อกำหนด','กระบวนการคุณภาพ',15,10,1,1,60);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-012'),1,'single','เมื่อพบผลิตภัณฑ์ที่ไม่เป็นไปตามข้อกำหนด ขั้นตอนแรกที่ต้องดำเนินการคือข้อใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=1),'ก','ส่งสินค้าให้ลูกค้าตรวจสอบ',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=1),'ข','ออก Rejection Report หรือแจ้งหัวหน้างานเพื่อออก Reject ในระบบ',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=1),'ค','ทำลายสินค้าโดยทันที',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=1),'ง','อนุมัติ Use As Is',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-012'),2,'single','การระบุผลิตภัณฑ์ที่ไม่เป็นไปตามข้อกำหนดต้องใช้วิธีใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=2),'ก','ติด Pass Tag',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=2),'ข','ติด NCMR Tag และทำ Transaction ใน Oracle',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=2),'ค','ติดฉลากเหลือง',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=2),'ง','ไม่ต้องติดป้ายใดๆ',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-012'),3,'single','Disposition แบบ UAI (Use As Is) สามารถใช้ได้ในกรณีใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=3),'ก','ข้อบกพร่องมีผลต่อ Function ของผลิตภัณฑ์',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=3),'ข','ข้อบกพร่องมีผลต่อ Fit ของผลิตภัณฑ์',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=3),'ค','ข้อบกพร่องไม่มีผลต่อ Form, Fit และ Function ของผลิตภัณฑ์',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=3),'ง','ทุกกรณีสามารถใช้ UAI ได้',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-012'),4,'single','สำหรับชิ้นส่วนที่ผ่านการ Sorting หรือ Rework แล้ว ต้องมีการระบุสถานะอย่างไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=4),'ก','ติด Pass Label',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=4),'ข','ติด Reject Label',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=4),'ค','ติด Tag PII',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=4),'ง','ไม่ต้องติดป้าย',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-012'),5,'single','NCMR จะสามารถปิดได้เมื่อใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=5),'ก','เมื่อออก Rejection Report แล้ว',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=5),'ข','เมื่อแยกกักผลิตภัณฑ์แล้ว',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=5),'ค','เมื่อดำเนินการครบถ้วนและได้รับการอนุมัติเรียบร้อยแล้ว',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-012') AND seq=5),'ง','เมื่อ QA ลงนามเพียงคนเดียว',0,3);

-- ---- TH-BP-017 | Calibration ----
INSERT INTO topics (code,title,subtitle,category,time_limit_min,practical_max,shuffle,is_active,sort_order) VALUES
  ('TH-BP-017','Calibration','การสอบเทียบเครื่องมือวัด','ระบบคุณภาพ',15,10,1,1,70);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-017'),1,'single','ความถี่ในการสอบเทียบเครื่องมือและอุปกรณ์โดยทั่วไปกำหนดไว้เท่าใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=1),'ก','ทุก 6 เดือน',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=1),'ข','ทุก 9 เดือน',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=1),'ค','ปีละ 1 ครั้ง',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=1),'ง','ทุก 2 ปี',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-017'),2,'single','ข้อมูลใดต่อไปนี้ต้องปรากฏบนป้ายการสอบเทียบ (Calibration Tag)?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=2),'ก','ชื่อผู้สอบเทียบ วันที่สอบเทียบ วันที่ครบกำหนดครั้งถัดไป และหมายเลขเครื่องมือ',1,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=2),'ข','ชื่อ Supplier และราคาเครื่องมือ',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=2),'ค','ชื่อผู้ใช้งานและแผนก',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=2),'ง','วันที่ซื้อและเลข PO',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-017'),3,'single','คำว่า OOT (Out of Tolerance) หมายถึงข้อใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=3),'ก','เครื่องมือถูกเก็บไว้นานเกินไป',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=3),'ข','เครื่องมืออยู่ระหว่างการสอบเทียบ',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=3),'ค','เครื่องมือมีค่าการวัดอยู่นอกช่วงความคลาดเคลื่อนที่ยอมรับได้',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=3),'ง','เครื่องมือใหม่ที่ยังไม่เคยใช้งาน',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-017'),4,'single','ระยะผ่อนผันหลังวันครบกำหนดสอบเทียบที่อนุญาตคือกี่วัน?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=4),'ก','7 วัน',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=4),'ข','15 วัน',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=4),'ค','30 วัน',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=4),'ง','60 วัน',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-017'),5,'single','Wesco ใช้มาตรฐานใดเป็นหลักอ้างอิงสำหรับผู้ให้บริการสอบเทียบภายนอก?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=5),'ก','ISO 14001',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=5),'ข','IPC-A-620',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=5),'ค','NIST',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-BP-017') AND seq=5),'ง','UL',0,3);

-- ---- TH-QA-016 | Pullout Test Values ----
INSERT INTO topics (code,title,subtitle,category,time_limit_min,practical_max,shuffle,is_active,sort_order) VALUES
  ('TH-QA-016','Pullout Test Values','ค่าแรงดึงมาตรฐานสำหรับ Pull Test','มาตรฐาน',10,0,1,1,80);
INSERT INTO topic_refs (topic_id,title,image_url,html,sort_order) VALUES ((SELECT id FROM topics WHERE code='TH-QA-016'),'ตารางค่าแรงดึงมาตรฐาน (Test Values for Pullout Test)',NULL,'<table><thead><tr><th>AWG / kcmil</th><th>IPC/WHMA-A-620B (19-16)<br>UL486A Table 12.1 — lbs</th><th>Ferrules only<br>DIN 46228 — lbs</th></tr></thead><tbody><tr><td>30</td><td>1-1.5</td><td>N/A</td></tr><tr><td>28</td><td>2</td><td>N/A</td></tr><tr><td>26</td><td>3</td><td>2.7</td></tr><tr><td>24</td><td>5</td><td>3.37</td></tr><tr><td>22</td><td>8</td><td>4.5</td></tr><tr><td>20</td><td>13</td><td>6.7</td></tr><tr><td>18</td><td>20</td><td>6.7</td></tr><tr><td>16</td><td>30</td><td>9</td></tr><tr><td>14</td><td>50</td><td>11.2</td></tr><tr><td>12</td><td>70</td><td>11.2</td></tr><tr><td>10</td><td>80</td><td>13.5</td></tr><tr><td>8</td><td>90</td><td>18</td></tr><tr><td>6</td><td>100</td><td>20.2</td></tr><tr><td>4</td><td>140</td><td>22.5</td></tr><tr><td>3</td><td>160</td><td>N/A</td></tr><tr><td>2</td><td>180</td><td>27</td></tr><tr><td>1</td><td>200</td><td>31.5</td></tr><tr><td>1/0</td><td>250</td><td>N/A</td></tr><tr><td>2/0</td><td>300</td><td>N/A</td></tr><tr><td>3/0</td><td>350</td><td>N/A</td></tr><tr><td>4/0</td><td>450</td><td>N/A</td></tr><tr><td>250MCM</td><td>500</td><td>N/A</td></tr><tr><td>300MCM</td><td>550</td><td>N/A</td></tr><tr><td>350MCM</td><td>600</td><td>N/A</td></tr><tr><td>400MCM</td><td>650</td><td>N/A</td></tr><tr><td>500MCM</td><td>800</td><td>N/A</td></tr><tr><td>600MCM</td><td>900</td><td>N/A</td></tr><tr><td>700-2000MCM</td><td>1000</td><td>N/A</td></tr></tbody></table>',0);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-QA-016'),1,'single','สายขนาด 300 MCM ต้องผ่านแรงดึงขั้นต่ำเท่าใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=1),'A','500 lbf',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=1),'B','550 lbf',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=1),'C','600 lbf',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=1),'D','650 lbf',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-QA-016'),2,'single','หากทดสอบสาย 350 MCM ได้ค่าแรงดึง 590 lbf ผลการทดสอบเป็นอย่างไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=2),'A','Pass',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=2),'B','Fail',1,1);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-QA-016'),3,'single','ขนาดสายใดต่อไปนี้ต้องการแรงดึงมากที่สุด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=3),'A','400 MCM',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=3),'B','500 MCM',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=3),'C','600 MCM',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=3),'D','700-2000 MCM',1,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-QA-016'),4,'single','วัตถุประสงค์หลักของ Pull Test คืออะไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=4),'A','ตรวจสอบสีของสายไฟ',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=4),'B','ตรวจสอบความแข็งแรงของการย้ำ Terminal/Ferrule กับสายไฟ',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=4),'C','ตรวจสอบความยาวสาย',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='TH-QA-016') AND seq=4),'D','ตรวจสอบฉนวนสายไฟ',0,3);

-- ---- COSMETIC-INS | Cosmetic Inspection ----
INSERT INTO topics (code,title,subtitle,category,time_limit_min,practical_max,shuffle,is_active,sort_order) VALUES
  ('COSMETIC-INS','Cosmetic Inspection','0250-01019 Appendix D — Cosmetic Standard','มาตรฐาน',20,10,1,1,90);
INSERT INTO topic_refs (topic_id,title,image_url,html,sort_order) VALUES ((SELECT id FROM topics WHERE code='COSMETIC-INS'),'Table 1 — Viewing Time & Distance (T&D)','/assets/ref/cosmetic-td-table.png',NULL,0);
INSERT INTO topic_refs (topic_id,title,image_url,html,sort_order) VALUES ((SELECT id FROM topics WHERE code='COSMETIC-INS'),'Table 10 — Cosmetic Reference Standard','/assets/ref/cosmetic-table10.png',NULL,1);
INSERT INTO topic_refs (topic_id,title,image_url,html,sort_order) VALUES ((SELECT id FROM topics WHERE code='COSMETIC-INS'),'ตัวอย่าง Drawing Notes','/assets/ref/drawing-notes.png',NULL,2);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='COSMETIC-INS'),1,'single','หากพบ scratches ขนาดกว้าง 0.01mm x 12.12mm จำนวน 3 จุด ผลการตรวจสอบคือข้อใด','/assets/ref/cosmetic-table10.png',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=1),'A','Accept',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=1),'B','Reject',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=1),'C','UAI',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=1),'D','ถูกทุกข้อ',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='COSMETIC-INS'),2,'single','หาก Drawing ไม่ได้ระบุ Cosmetic Code ให้ใช้ Code ใดในการตรวจ?','/assets/ref/drawing-notes.png',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=2),'A','I-A',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=2),'B','II-A',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=2),'C','III-B',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=2),'D','III-C',1,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='COSMETIC-INS'),3,'single','ผู้ตรวจ Cosmetic ควรมีสายตาอย่างน้อยเท่าใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=3),'A','20/40',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=3),'B','20/30',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=3),'C','20/25',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=3),'D','20/20',1,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='COSMETIC-INS'),4,'single','ข้อใดคือ Cosmetic Allowance ที่โดยทั่วไปยอมรับได้?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=4),'A','Manufacturing Process Marks',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=4),'B','Grain Marks',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=4),'C','Tool Marks',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=4),'D','ถูกทุกข้อ',1,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='COSMETIC-INS'),5,'single','Cosmetic Inspection ใช้วิธีใดในการประเมินเบื้องต้น?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=5),'A','Microscope Inspection',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=5),'B','Dimension Measurement',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=5),'C','Time & Distance (T&D) Inspection',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=5),'D','CMM Inspection',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='COSMETIC-INS'),6,'single','Code II-B ต้องตรวจที่ระยะและเวลาเท่าใด?','/assets/ref/cosmetic-td-table.png',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=6),'A','10" / 10 sec',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=6),'B','18" / 5 sec',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=6),'C','18" / 10 sec',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=6),'D','24" / 3 sec',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='COSMETIC-INS'),7,'single','หากพบ Defect ภายใน Time & Distance ที่กำหนด ต้องทำอย่างไรต่อ?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=7),'A','Reject ทันที',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=7),'B','วัด Defect เท่านั้น',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=7),'C','อ้างอิง Appendix ที่เกี่ยวข้องเพื่อตัดสิน Accept/Reject',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='COSMETIC-INS') AND seq=7),'D','แจ้ง Supplier ทันที',0,3);

-- ---- WORKMANSHIP | Workmanship Standards ----
INSERT INTO topics (code,title,subtitle,category,time_limit_min,practical_max,shuffle,is_active,sort_order) VALUES
  ('WORKMANSHIP','Workmanship Standards','IPC-A-620 / IPC-A-610','มาตรฐาน',20,10,1,1,100);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='WORKMANSHIP'),1,'single','วัตถุประสงค์ของ Workmanship Standards คืออะไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=1),'A','ใช้กำหนดราคาสินค้า',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=1),'B','กำหนดมาตรฐานขั้นต่ำด้านฝีมือการผลิตสำหรับ Manufacturing, Engineering และ QA',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=1),'C','ใช้สำหรับการจัดซื้อวัตถุดิบ',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=1),'D','ใช้สำหรับ Audit Supplier เท่านั้น',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='WORKMANSHIP'),2,'single','หากเกิดข้อขัดแย้งระหว่าง Drawing กับ Workmanship Standard ต้องยึดตามอะไรเป็นอันดับแรก?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=2),'A','Workmanship Standard',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=2),'B','WI ของ Operator',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=2),'C','Engineering Drawing / Specification / Build Instruction',1,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=2),'D','ประสบการณ์ของผู้ตรวจ',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='WORKMANSHIP'),3,'single','หาก Drawing ไม่ได้ระบุข้อกำหนดเกี่ยวกับ Label ไว้ ควรดำเนินการอย่างไร?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=3),'A','ไม่ต้องติด Label',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=3),'B','ให้เป็นไปตามข้อกำหนดขั้นต่ำของ Workmanship Standard',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=3),'C','ให้ Production ตัดสินใจเอง',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=3),'D','ส่งถามลูกค้าก่อนเสมอ',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='WORKMANSHIP'),4,'single','ข้อใดเป็นวัตถุประสงค์ของ Workmanship Standards?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=4),'A','เพิ่มความสม่ำเสมอของคุณภาพผลิตภัณฑ์',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=4),'B','ส่งเสริมความปลอดภัย',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=4),'C','เพิ่มความน่าเชื่อถือของผลิตภัณฑ์',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=4),'D','ถูกทุกข้อ',1,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='WORKMANSHIP'),5,'single','มาตรฐาน IPC-A-620 เกี่ยวข้องกับเรื่องใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=5),'A','PCB Assembly',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=5),'B','Cable & Wire Harness Acceptance Requirements',1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=5),'C','Calibration System',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=5),'D','Cosmetic Inspection',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='WORKMANSHIP'),6,'single','มาตรฐาน IPC-A-610 เกี่ยวข้องกับเรื่องใด?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=6),'A','Acceptability of Electronic Assemblies',1,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=6),'B','Calibration Laboratory',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=6),'C','ESD Control',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=6),'D','Helium Leak Test',0,3);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='WORKMANSHIP'),7,'single','ข้อใดเป็นลักษณะของพนักงานที่มี Good Workmanship?',NULL,1,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=7),'A','มีทักษะในการทำงาน',0,0);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=7),'B','ใส่ใจรายละเอียดด้านคุณภาพ',0,1);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=7),'C','มีทัศนคติเชิงบวกและมีวินัยด้านความปลอดภัย',0,2);
INSERT INTO choices (question_id,label,text,is_correct,sort_order) VALUES ((SELECT id FROM questions WHERE topic_id=(SELECT id FROM topics WHERE code='WORKMANSHIP') AND seq=7),'D','ถูกทุกข้อ',1,3);

-- ---- TH-BP-07.021 | Wire Run List — ภาคปฏิบัติ ----
INSERT INTO topics (code,title,subtitle,category,time_limit_min,practical_max,shuffle,is_active,sort_order) VALUES
  ('TH-BP-07.021','Wire Run List — ภาคปฏิบัติ','แบบทดสอบภาคปฏิบัติ อ้างอิง TH-BP-07.02','การผลิต',45,10,1,1,110);
INSERT INTO topic_refs (topic_id,title,image_url,html,sort_order) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),'Work Order 297482','/assets/ref/work-order.png',NULL,0);
INSERT INTO topic_refs (topic_id,title,image_url,html,sort_order) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),'Run List BOM & Label Orientation Detail','/assets/ref/bom-label-detail.png',NULL,1);
INSERT INTO topic_refs (topic_id,title,image_url,html,sort_order) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),'Wire Run List CBC02','/assets/ref/wire-run-list.png',NULL,2);
INSERT INTO topic_refs (topic_id,title,image_url,html,sort_order) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),'แบบสายไฟสำหรับวาดตำแหน่งฉลาก (A)','/assets/ref/wire-blank-a.png',NULL,3);
INSERT INTO topic_refs (topic_id,title,image_url,html,sort_order) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),'แบบสายไฟสำหรับวาดตำแหน่งฉลาก (B)','/assets/ref/wire-blank-b.png',NULL,4);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),1,'text','ตอนที่ 1 (ดู Work Order) — หมายเลขชิ้นส่วนของชุดประกอบ (Assembly Item) คืออะไร?','/assets/ref/work-order.png',1,1);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),2,'text','ตอนที่ 1 (ดู Work Order) — Revision ภายใน (Bill Rev / Route Rev) คือเท่าใด?','/assets/ref/work-order.png',1,1);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),3,'text','ตอนที่ 1 (ดู Work Order) — จำนวนที่ต้องผลิตทั้งหมด (Start Qty) คือเท่าใด?','/assets/ref/work-order.png',1,1);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),4,'text','ตอนที่ 1 (ดู Work Order) — จำนวนส่วนประกอบหรือชิ้นส่วนที่ใช้สำหรับชุดสายไฟนี้มีกี่รายการ?','/assets/ref/work-order.png',1,1);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),5,'text','ตอนที่ 2 (ดู Run List BOM) — Revision ล่าสุดของชุดประกอบคืออะไร?','/assets/ref/bom-label-detail.png',1,1);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),6,'text','ตอนที่ 2 (ดู Run List BOM) — มีการเปลี่ยนแปลงอะไรบ้างสำหรับ Revision CBC02?','/assets/ref/bom-label-detail.png',1,1);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),7,'text','ตอนที่ 2 — อธิบายตำแหน่งการติดฉลาก S050X075VA1Y ตามข้อมูล [R, 0.75] (ฉลากกว้าง 0.75 นิ้ว) ว่าต้องติดด้านใดของขั้วต่อและห่างเท่าใด','/assets/ref/bom-label-detail.png',1,1);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),8,'text','ตอนที่ 3 (ดู Wire Run List) — ระบุหมายเลขชิ้นส่วนของ Terminal ที่ใช้กับสายไฟเส้นที่ 3','/assets/ref/wire-run-list.png',1,1);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),9,'text','ตอนที่ 3 (ดู Wire Run List) — ฉลากด้านขวา (R) ของสายไฟเส้นที่ 2 ต้องระบุข้อความว่าอะไร (บรรทัดที่ 1 และบรรทัดที่ 2)','/assets/ref/wire-run-list.png',1,1);
INSERT INTO questions (topic_id,seq,qtype,text,image_url,points,is_active) VALUES ((SELECT id FROM topics WHERE code='TH-BP-07.021'),10,'text','ตอนที่ 3 (ดู Wire Run List) — งานประกอบนี้ต้องใช้สายไฟขนาด 14 Gauge จำนวนกี่เส้น และแต่ละเส้นมีความยาวตัด (Cut Length) เท่าใด','/assets/ref/wire-run-list.png',1,1);
