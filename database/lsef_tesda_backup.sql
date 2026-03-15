-- MySQL dump 10.13  Distrib 8.0.40, for Linux (x86_64)
--
-- Host: marwindalin.mysql.pythonanywhere-services.com    Database: marwindalin$lsef_tesda
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `certificates`
--

DROP TABLE IF EXISTS `certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `enrollment_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `course` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `cert_hash` varchar(66) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tx_hash` varchar(66) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `enrollment_id` (`enrollment_id`),
  CONSTRAINT `certificates_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollment` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificates`
--

LOCK TABLES `certificates` WRITE;
/*!40000 ALTER TABLE `certificates` DISABLE KEYS */;
/*!40000 ALTER TABLE `certificates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `class_id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL COMMENT 'Foreign key from courses table',
  `class_title` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `school_year` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `batch` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `schedule` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'e.g. Mon-Fri 9AM-12PM',
  `days_of_week` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `venue` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `max_students` int NOT NULL,
  `available_slots` int GENERATED ALWAYS AS (`max_students`) STORED COMMENT 'Calculated as max_students minus enrolled students (to be updated separately)',
  `instructor_id` int NOT NULL COMMENT 'user_id of the instructor (staff)',
  `instructor_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `prerequisites` text COLLATE utf8mb4_general_ci COMMENT 'Fetched from courses table for reference',
  `status` enum('pending','open','ongoing','completed','edited') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `edit_reason` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`class_id`),
  KEY `fk_course_id` (`course_id`),
  KEY `fk_instructor_id` (`instructor_id`),
  CONSTRAINT `fk_course_id` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `classes_chk_1` CHECK (json_valid(`days_of_week`))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` (`class_id`, `course_id`, `class_title`, `school_year`, `batch`, `schedule`, `days_of_week`, `venue`, `max_students`, `instructor_id`, `instructor_name`, `start_date`, `end_date`, `prerequisites`, `status`, `date_created`, `date_updated`, `edit_reason`) VALUES (1,4,'BOOKKEEPING','2026-2026','1','Monday 6:00 AM-2:00 PM, Wednesday 8:00 AM-3:00 PM, Friday 8:00 AM-4:00 PM','{\"Monday\":{\"start\":\"06:00\",\"end\":\"14:00\"},\"Wednesday\":{\"start\":\"08:00\",\"end\":\"15:00\"},\"Friday\":{\"start\":\"08:00\",\"end\":\"16:00\"}}','LSEF TESDA',25,2,'Vincent Octavio','2026-03-14','2026-06-17','Basic math and computer skills.','open','2026-03-14 06:07:21','2026-03-14 06:11:11',NULL),(2,1,'BREAD','2026-2026','1','Monday 6:00 AM-3:00 PM, Wednesday 6:00 AM-3:00 PM, Tuesday 6:00 AM-3:00 PM','{\"Monday\":{\"start\":\"06:00\",\"end\":\"15:00\"},\"Wednesday\":{\"start\":\"06:00\",\"end\":\"15:00\"},\"Tuesday\":{\"start\":\"06:00\",\"end\":\"15:00\"}}','LSEF TESDA',25,2,'Vincent Octavio','2026-03-19','2026-06-18','Basic reading and writing skills; interest in baking and food preparation.','open','2026-03-14 06:08:14','2026-03-14 06:11:07',NULL),(3,3,'FOOD AND BEVERAGES','2026-2026','1','Tuesday 8:00 AM-5:00 PM, Wednesday 8:00 AM-5:00 PM, Thursday 8:00 AM-5:00 PM','{\"Tuesday\":{\"start\":\"08:00\",\"end\":\"17:00\"},\"Wednesday\":{\"start\":\"08:00\",\"end\":\"17:00\"},\"Thursday\":{\"start\":\"08:00\",\"end\":\"17:00\"}}','LSEF TESDA',25,2,'Vincent Octavio','2026-03-14','2026-07-22','Basic communication skills and interest in hospitality services.','open','2026-03-14 06:09:03','2026-03-14 06:11:02',NULL),(4,2,'HOUSEKEEPING','2026-2026','1','Wednesday 6:00 AM-3:00 PM, Thursday 6:00 AM-3:00 PM, Friday 6:00 AM-3:00 PM','{\"Wednesday\":{\"start\":\"06:00\",\"end\":\"15:00\"},\"Thursday\":{\"start\":\"06:00\",\"end\":\"15:00\"},\"Friday\":{\"start\":\"06:00\",\"end\":\"15:00\"}}','LSEF TESDA',25,2,'Vincent Octavio','2026-03-14','2026-05-12','Basic literacy and willingness to perform cleaning and maintenance tasks.','open','2026-03-14 06:09:45','2026-03-14 06:10:57',NULL),(5,4,'BOOKING II','2026-2026','2','Monday 10:00 AM-6:00 PM, Wednesday 10:00 AM-6:00 PM, Friday 10:00 AM-6:00 PM','{\"Monday\":{\"start\":\"10:00\",\"end\":\"18:00\"},\"Wednesday\":{\"start\":\"10:00\",\"end\":\"18:00\"},\"Friday\":{\"start\":\"10:00\",\"end\":\"18:00\"}}','LSEF TESDA',25,2,'Vincent Octavio','2026-03-14','2026-05-30','Basic math and computer skills.','open','2026-03-14 06:10:30','2026-03-14 06:10:53',NULL);
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `course_id` int NOT NULL AUTO_INCREMENT,
  `course_code` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `course_title` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `course_description` text COLLATE utf8mb4_general_ci NOT NULL,
  `course_category` enum('Technical','Vocational','Skills','Safety','Other') COLLATE utf8mb4_general_ci NOT NULL,
  `target_audience` enum('Beginner','Intermediate','Advanced','All Levels') COLLATE utf8mb4_general_ci NOT NULL,
  `prerequisites` text COLLATE utf8mb4_general_ci,
  `learning_outcomes` text COLLATE utf8mb4_general_ci,
  `duration_hours` int NOT NULL,
  `course_fee` decimal(10,2) DEFAULT '0.00',
  `max_students` int DEFAULT NULL,
  `course_status` enum('active','inactive','pending','edited') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `published` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0=draft, 1=published',
  `created_by` int NOT NULL COMMENT 'user_id of creator (staff/admin)',
  `approved_by` int DEFAULT NULL COMMENT 'user_id of admin who approved',
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `date_published` datetime DEFAULT NULL,
  `date_modified` datetime DEFAULT NULL,
  `edit_reason` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`course_id`),
  UNIQUE KEY `course_code_unique` (`course_code`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `login` (`user_id`),
  CONSTRAINT `courses_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `login` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'BREAD 101','BREAD','This course provides training in preparing and baking different types of bread and pastry products. It focuses on proper baking techniques, use of baking equipment, and maintaining food safety and sanitation standards in a kitchen environment.','Skills','All Levels','Basic reading and writing skills; interest in baking and food preparation.','- Prepare and bake basic bread and pastry products\n- Use baking tools and equipment properly\n- Apply food safety and sanitation practices\n- Present baked products according to industry standards',141,0.00,25,'active',1,1,NULL,'2026-03-14 05:41:27','2026-03-14 05:41:55','2026-03-14 05:41:27',NULL,NULL),(2,'HOUSEKEEPING 101','HOUSEKEEPING','This course trains learners in maintaining cleanliness, orderliness, and proper sanitation in hospitality establishments such as hotels and resorts. It covers guest room preparation, cleaning procedures, and the proper use of housekeeping tools and materials.','Skills','All Levels','Basic literacy and willingness to perform cleaning and maintenance tasks.','- Perform housekeeping procedures in hotels or establishments\n- Clean and prepare guest rooms and public areas\n- Use housekeeping equipment and cleaning chemicals safely\n- Maintain hygiene and workplace organization',436,0.00,25,'active',1,1,NULL,'2026-03-14 05:43:40',NULL,'2026-03-14 05:43:40',NULL,NULL),(3,'FOOD AND BEVE 101','FOOD AND BEVERAGES','This course focuses on the knowledge and skills needed to provide quality food and beverage service in restaurants, hotels, and similar establishments. It includes table service, customer interaction, dining setup, and proper sanitation practices.','Skills','All Levels','Basic communication skills and interest in hospitality services.','- Provide food and beverage service in hospitality establishments\n- Set up dining areas and table arrangements\n- Communicate effectively with customers\n- Follow proper sanitation and service standards',356,0.00,25,'active',1,1,NULL,'2026-03-14 05:45:27',NULL,'2026-03-14 05:45:27',NULL,NULL),(4,'BOOKKEEPING 101','BOOKKEEPING','This course introduces learners to the basic principles of bookkeeping and financial record management. It covers recording financial transactions, maintaining accounting records, and preparing basic financial reports for small businesses.','Skills','All Levels','Basic math and computer skills.','- Record and classify financial transactions\n- Maintain accurate accounting records\n- Prepare simple financial statements\n- Use bookkeeping tools or basic accounting software',292,0.00,25,'active',1,1,NULL,'2026-03-14 05:46:48',NULL,'2026-03-14 05:46:48',NULL,NULL);
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollment`
--

DROP TABLE IF EXISTS `enrollment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollment` (
  `enrollment_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'Foreign key from login table (students only)',
  `class_id` int NOT NULL COMMENT 'Foreign key from classes table',
  `enrollment_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('enrolled','pending','cancelled','completed','rejected','dropped') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'enrolled',
  PRIMARY KEY (`enrollment_id`),
  KEY `user_id` (`user_id`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `enrollment_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `login` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `enrollment_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollment`
--

LOCK TABLES `enrollment` WRITE;
/*!40000 ALTER TABLE `enrollment` DISABLE KEYS */;
INSERT INTO `enrollment` VALUES (1,3,5,'2026-03-14 13:01:49','enrolled');
/*!40000 ALTER TABLE `enrollment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login`
--

DROP TABLE IF EXISTS `login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('admin','staff','student') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `account_status` enum('active','inactive','pending') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `verified` enum('pending','verified','rejected') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username_unique` (`username`),
  UNIQUE KEY `email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login`
--

LOCK TABLES `login` WRITE;
/*!40000 ALTER TABLE `login` DISABLE KEYS */;
INSERT INTO `login` VALUES (1,'admin','12345','adminakoo@gmail.com','admin','active','verified'),(2,'niko','123','niko1@gmail.com','staff','active','verified'),(3,'marwindalin','Marwindalin09!','marwindalin10@gmail.com','student','active','verified');
/*!40000 ALTER TABLE `login` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materials`
--

DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materials` (
  `material_id` int NOT NULL AUTO_INCREMENT,
  `class_id` int DEFAULT NULL COMMENT 'nullable: announcements/resources may be global',
  `instructor_id` int NOT NULL,
  `instructor_name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `type` enum('classwork','announcement','resource') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'classwork',
  `original_filename` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `stored_filename` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mimetype` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `date_uploaded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `submission_start` datetime DEFAULT NULL,
  `submission_end` datetime DEFAULT NULL,
  PRIMARY KEY (`material_id`),
  KEY `idx_class` (`class_id`),
  KEY `idx_instructor` (`instructor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materials`
--

LOCK TABLES `materials` WRITE;
/*!40000 ALTER TABLE `materials` DISABLE KEYS */;
/*!40000 ALTER TABLE `materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_information`
--

DROP TABLE IF EXISTS `personal_information`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_information` (
  `info_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `province` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `municipality` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `baranggay` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `contact_number` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `middle_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_general_ci NOT NULL,
  `profile_picture` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `terms_accepted` tinyint(1) NOT NULL DEFAULT '0',
  `date_registered` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `signature` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`info_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `personal_information_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `login` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_information`
--

LOCK TABLES `personal_information` WRITE;
/*!40000 ALTER TABLE `personal_information` DISABLE KEYS */;
INSERT INTO `personal_information` VALUES (1,1,'Metro Manila (NCR)','City of Taguig','New Lower Bicutan','09172468147','Enrico Ariel','T.','Ting','1990-06-03','male','1_34727b82a53d43f2a7e0c615a29f9395.jpeg',1,'2025-06-05 22:58:27','1_48f5346a83954f41bed15b4e63aef5a0.png'),(2,2,'Leyte','City of Tacloban','Barangay 109-A','09108735236','Vincent','','Octavio','2000-11-05','male','2_fe82d0d489f74c7baae84c661b7cc1db.jpg',1,'2025-06-08 09:55:38','2_6de1378f08e740f39afe6e56a62ec782.png'),(3,3,'Laguna','Pila','Pansol','09474371682','Marwin','Mejorada','Dalin','2004-03-01','male','20260314061635_Formal_Picture.jpeg',1,'2026-03-14 06:16:35',NULL);
/*!40000 ALTER TABLE `personal_information` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_grades`
--

DROP TABLE IF EXISTS `student_grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_grades` (
  `grade_id` int NOT NULL AUTO_INCREMENT,
  `enrollment_id` int NOT NULL COMMENT 'Foreign key from enrollment table',
  `prelim_grade` decimal(5,2) DEFAULT NULL,
  `midterm_grade` decimal(5,2) DEFAULT NULL,
  `final_grade` decimal(5,2) DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_general_ci GENERATED ALWAYS AS ((case when (`final_grade` >= 96) then _utf8mb4'Excellent (Competent)' when (`final_grade` >= 91) then _utf8mb4'Very Satisfactory (Competent)' when (`final_grade` >= 86) then _utf8mb4'Satisfactory (Competent)' when (`final_grade` >= 81) then _utf8mb4'Fairly Satisfactory (Competent)' when (`final_grade` >= 75) then _utf8mb4'Passed (Competent)' when (`final_grade` < 75) then _utf8mb4'Failed (Not Yet Competent)' when (`final_grade` is null) then _utf8mb4'Incomplete' else _utf8mb4'Not Evaluated' end)) STORED,
  `remarks` enum('Competent','Not yet competent','Dropped','Incomplete') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date_recorded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`grade_id`),
  KEY `enrollment_id` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_grades`
--

LOCK TABLES `student_grades` WRITE;
/*!40000 ALTER TABLE `student_grades` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_requirements`
--

DROP TABLE IF EXISTS `student_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_requirements` (
  `requirement_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `barangay_clearance` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `medical_certificate` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `marriage_certificate` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `valid_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `transcript_form` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `additional_notes` text COLLATE utf8mb4_general_ci,
  `date_uploaded` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`requirement_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `student_requirements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `login` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_requirements`
--

LOCK TABLES `student_requirements` WRITE;
/*!40000 ALTER TABLE `student_requirements` DISABLE KEYS */;
INSERT INTO `student_requirements` VALUES (1,3,'3_barangay_clearance_Barangay_Clearance.jpg','3_medical_certificate_Medical_Certificate.jpg',NULL,'3_valid_id_Valid_ID.jpg','3_transcript_form_Form_137.png','','2026-03-14 13:00:18');
/*!40000 ALTER TABLE `student_requirements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `submissions`
--

DROP TABLE IF EXISTS `submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submissions` (
  `submission_id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `student_id` int NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `stored_filename` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date_submitted` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`submission_id`),
  KEY `material_id` (`material_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `materials` (`material_id`) ON DELETE CASCADE,
  CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `login` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submissions`
--

LOCK TABLES `submissions` WRITE;
/*!40000 ALTER TABLE `submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_archived`
--

DROP TABLE IF EXISTS `user_archived`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_archived` (
  `archive_id` int NOT NULL AUTO_INCREMENT,
  `original_user_id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('admin','staff','student') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `account_status` enum('active','inactive','pending') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `province` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `municipality` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `baranggay` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `contact_number` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `middle_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_general_ci NOT NULL,
  `profile_picture` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `terms_accepted` tinyint(1) NOT NULL DEFAULT '0',
  `date_registered` datetime NOT NULL COMMENT 'Original registration date',
  `date_archived` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the user was archived',
  `archived_by` int DEFAULT NULL COMMENT 'User ID who performed the archive',
  PRIMARY KEY (`archive_id`),
  KEY `original_user_id` (`original_user_id`),
  KEY `username` (`username`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_archived`
--

LOCK TABLES `user_archived` WRITE;
/*!40000 ALTER TABLE `user_archived` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_archived` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-15  2:53:32
