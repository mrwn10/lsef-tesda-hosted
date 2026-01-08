-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jan 08, 2026 at 03:22 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lsef_tesda`
--

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` int(11) NOT NULL,
  `enrollment_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `course` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `cert_hash` varchar(66) DEFAULT NULL,
  `tx_hash` varchar(66) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `class_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL COMMENT 'Foreign key from courses table',
  `class_title` varchar(100) NOT NULL,
  `school_year` varchar(20) NOT NULL,
  `batch` varchar(50) DEFAULT NULL,
  `schedule` varchar(100) NOT NULL COMMENT 'e.g. Mon-Fri 9AM-12PM',
  `days_of_week` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`days_of_week`)),
  `venue` varchar(100) NOT NULL,
  `max_students` int(11) NOT NULL,
  `available_slots` int(11) GENERATED ALWAYS AS (`max_students`) STORED COMMENT 'Calculated as max_students minus enrolled students (to be updated separately)',
  `instructor_id` int(11) NOT NULL COMMENT 'user_id of the instructor (staff)',
  `instructor_name` varchar(100) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `prerequisites` text DEFAULT NULL COMMENT 'Fetched from courses table for reference',
  `status` enum('Draft','active','pending','edited') NOT NULL DEFAULT 'Draft',
  `date_created` datetime NOT NULL DEFAULT current_timestamp(),
  `date_updated` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `edit_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`class_id`, `course_id`, `class_title`, `school_year`, `batch`, `schedule`, `days_of_week`, `venue`, `max_students`, `instructor_id`, `instructor_name`, `start_date`, `end_date`, `prerequisites`, `status`, `date_created`, `date_updated`, `edit_reason`) VALUES
(15, 9, 'FOOD 102', '2025 - 2026', 'Batch 1', '', '{\"Thursday\": {\"start\": \"10:00\", \"end\": \"18:00\"}, \"Tuesday\": {\"start\": \"08:00\", \"end\": \"16:00\"}}', 'LSEF TESDA', 25, 10, 'Vincent Octavio', '2025-10-01', '2026-09-08', 'Before entering the Food and Beverages field, students should have a basic understanding of food safety, hygiene practices, and customer service. A keen interest in culinary arts, attention to detail, and good communication skills are also essential for success in this area.', 'active', '2025-10-22 19:42:25', '2025-11-27 20:08:00', 'okay'),
(21, 17, 'HOUSE 101', '2025 - 2026', '2025', 'Wednesday 08:00-15:00', '{\"Monday\": {\"start\": \"06:00\", \"end\": \"13:00\"}, \"Tuesday\": {\"start\": \"06:00\", \"end\": \"13:00\"}, \"Wednesday\": {\"start\": \"08:00\", \"end\": \"15:00\"}}', 'LSEF TESDA', 25, 10, 'Lebron James', '2025-11-08', '2026-11-08', 'Applicants must be able to read and communicate in basic English and Filipino and possess good physical condition to perform housekeeping duties. No previous experience is required, but completion of high school or equivalent is recommended.', 'active', '2025-11-08 11:49:12', '2025-11-08 11:55:00', NULL),
(22, 18, 'BREAD 101', '2025 - 2026', '2025', 'Friday 10:00-15:00', '{\"Monday\": {\"start\": \"11:00\", \"end\": \"17:00\"}, \"Wednesday\": {\"start\": \"11:00\", \"end\": \"17:00\"}, \"Friday\": {\"start\": \"10:00\", \"end\": \"15:00\"}}', 'LSEF TESDA', 25, 10, 'James Harden', '2025-11-08', '2026-11-08', 'Applicants should be able to communicate in basic English and Filipino and be in good physical and mental condition. No prior baking experience is required, but having basic cooking knowledge is an advantage.', 'active', '2025-11-08 11:50:09', '2025-11-08 11:54:58', NULL),
(23, 19, 'BOOK 101', '2025 - 2026', '2025', 'Friday 10:00-18:00', '{\"Monday\": {\"start\": \"06:00\", \"end\": \"15:00\"}, \"Wednesday\": {\"start\": \"06:00\", \"end\": \"15:00\"}, \"Friday\": {\"start\": \"10:00\", \"end\": \"18:00\"}}', 'LSEF TESDA', 25, 10, 'James Harden', '2025-11-08', '2026-11-08', 'Before starting bookkeeping, it\'s important to have a basic understanding of accounting principles, familiarity with financial documents (like invoices and receipts), and proficiency in using spreadsheets or accounting software. Attention to detail and basic math skills are also essential for maintaining accurate financial records.', 'active', '2025-11-08 11:51:18', '2025-11-08 11:54:55', NULL),
(24, 20, 'ICT 101', '2025 - 2026', '2025', 'Saturday 10:00-16:00', '{\"Tuesday\": {\"start\": \"06:00\", \"end\": \"10:00\"}, \"Thursday\": {\"start\": \"06:00\", \"end\": \"10:00\"}, \"Saturday\": {\"start\": \"10:00\", \"end\": \"16:00\"}}', 'LSEF TESDA', 25, 10, 'Megan Young', '2025-11-08', '2026-11-08', 'Must be able to read and write; basic computer literacy and knowledge of electronic components are recommended. Some training centers may require completion of a basic ICT-related course.', 'active', '2025-11-08 11:52:17', '2025-11-08 11:54:51', NULL),
(25, 21, 'EIM 101', '2025 - 2026', '2025', 'Thursday 10:00-16:00', '{\"Monday\": {\"start\": \"08:00\", \"end\": \"16:00\"}, \"Tuesday\": {\"start\": \"08:00\", \"end\": \"15:00\"}, \"Thursday\": {\"start\": \"10:00\", \"end\": \"16:00\"}}', 'LSEF TESDA', 25, 10, 'Elon Musk', '2025-11-08', '2026-11-08', 'Must be able to read and write; basic knowledge of mathematics and electricity is recommended. Some institutions may require completion of a basic electrical course or equivalent experience.', 'active', '2025-11-08 11:54:19', '2025-11-08 11:54:48', NULL),
(26, 21, 'EIM !03', '2026-2027', '2025', 'Monday 6:00 AM-10:00 AM, Thursday 6:00 AM-10:00 AM, Tuesday 6:00 AM-10:00 AM, Wednesday 6:00 AM-10:0', '{\"Monday\": {\"start\": \"06:00\", \"end\": \"10:00\"}, \"Thursday\": {\"start\": \"06:00\", \"end\": \"10:00\"}, \"Tuesday\": {\"start\": \"06:00\", \"end\": \"10:00\"}, \"Wednesday\": {\"start\": \"06:00\", \"end\": \"10:00\"}}', 'LSEF', 25, 1, 'Pilip Mansai', '2025-12-10', '2027-12-10', 'Must be able to read and write; basic knowledge of mathematics and electricity is recommended. Some institutions may require completion of a basic electrical course or equivalent experience.', 'active', '2025-11-11 10:56:46', '2025-11-11 10:57:41', NULL),
(27, 20, 'Fundamentals', '2025-2026', 'batch 2025', 'Thursday 07:00-11:00', '{\"Monday\": {\"start\": \"07:00\", \"end\": \"11:00\"}, \"Tuesday\": {\"start\": \"07:00\", \"end\": \"11:00\"}, \"Wednesday\": {\"start\": \"07:00\", \"end\": \"11:00\"}, \"Thursday\": {\"start\": \"07:00\", \"end\": \"11:00\"}}', 'LSEF ', 25, 10, 'Vincent Octabio', '2025-11-28', '2026-07-29', 'Must be able to read and write; basic computer literacy and knowledge of electronic components are recommended. Some training centers may require completion of a basic ICT-related course.', 'active', '2025-11-27 20:06:09', '2025-11-27 20:08:32', NULL),
(28, 9, 'Food and Beverages', '2025 - 2026', 'batch 2025', 'Monday 6:00 AM-10:00 AM, Tuesday 6:00 AM-10:00 AM, Wednesday 6:00 AM-10:00 AM, Thursday 6:00 AM-10:0', '{\"Monday\":{\"start\":\"06:00\",\"end\":\"10:00\"},\"Tuesday\":{\"start\":\"06:00\",\"end\":\"10:00\"},\"Wednesday\":{\"start\":\"06:00\",\"end\":\"10:00\"},\"Thursday\":{\"start\":\"06:00\",\"end\":\"10:00\"}}', 'LSEF sta.cruz', 25, 20, 'Nadine Lustre', '2025-12-20', '2026-06-24', 'Before entering the Food and Beverages field, students should have a basic understanding of food safety, hygiene practices, and customer service. A keen interest in culinary arts, attention to detail, and good communication skills are also essential for success in this area.', 'active', '2025-12-19 11:12:31', NULL, NULL),
(29, 17, 'Fundamentals', '2025-2027', 'batch 2025', 'Wednesday 06:00-11:00', '{\"Monday\": {\"start\": \"06:00\", \"end\": \"11:00\"}, \"Tuesday\": {\"start\": \"06:00\", \"end\": \"11:00\"}, \"Wednesday\": {\"start\": \"06:00\", \"end\": \"11:00\"}}', 'LSEF sta.cruz', 25, 90, 'Christine Dela Cruz', '2025-12-22', '2027-07-21', 'Applicants must be able to read and communicate in basic English and Filipino and possess good physical condition to perform housekeeping duties. No previous experience is required, but completion of high school or equivalent is recommended.', 'pending', '2025-12-20 10:28:24', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `course_id` int(11) NOT NULL,
  `course_code` varchar(20) NOT NULL,
  `course_title` varchar(100) NOT NULL,
  `course_description` text NOT NULL,
  `course_category` enum('Technical','Vocational','Skills','Safety','Other') NOT NULL,
  `target_audience` enum('Beginner','Intermediate','Advanced','All Levels') NOT NULL,
  `prerequisites` text DEFAULT NULL,
  `learning_outcomes` text DEFAULT NULL,
  `duration_hours` int(11) NOT NULL,
  `course_fee` decimal(10,2) DEFAULT 0.00,
  `max_students` int(11) DEFAULT NULL,
  `course_status` enum('active','inactive','pending','edited') NOT NULL DEFAULT 'pending',
  `published` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=draft, 1=published',
  `created_by` int(11) NOT NULL COMMENT 'user_id of creator (staff/admin)',
  `approved_by` int(11) DEFAULT NULL COMMENT 'user_id of admin who approved',
  `date_created` datetime NOT NULL DEFAULT current_timestamp(),
  `date_updated` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `date_published` datetime DEFAULT NULL,
  `date_modified` datetime DEFAULT NULL,
  `edit_reason` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`course_id`, `course_code`, `course_title`, `course_description`, `course_category`, `target_audience`, `prerequisites`, `learning_outcomes`, `duration_hours`, `course_fee`, `max_students`, `course_status`, `published`, `created_by`, `approved_by`, `date_created`, `date_updated`, `date_published`, `date_modified`, `edit_reason`) VALUES
(9, 'FOOD 106', 'FOOD AND BEVERAGES', 'This program provides the knowledge and skills needed to deliver professional food and beverage service in restaurants, hotels, resorts, and other hospitality establishments.', 'Skills', 'All Levels', 'Before entering the Food and Beverages field, students should have a basic understanding of food safety, hygiene practices, and customer service. A keen interest in culinary arts, attention to detail, and good communication skills are also essential for success in this area.', 'Prepare dining areas for service\nWelcome guests and take food/beverage orders\nServe food and beverages professionally\nProvide room service\nHandle guest complaints\nProcess payments', 256, 0.00, 25, 'active', 1, 1, NULL, '2025-10-11 12:29:44', '2025-11-03 19:11:54', '2025-10-11 12:29:44', NULL, NULL),
(17, 'HOUSE 105', 'HOUSEKEEPING', 'The Housekeeping course provides learners with the skills and knowledge needed to perform housekeeping services in hotels, resorts, and other lodging establishments. It covers cleaning guest rooms, public areas, and facilities while ensuring quality standards and guest satisfaction.', 'Vocational', 'Beginner', 'Applicants must be able to read and communicate in basic English and Filipino and possess good physical condition to perform housekeeping duties. No previous experience is required, but completion of high school or equivalent is recommended.', 'After completing the course, trainees will be able to prepare guest rooms, clean public areas and facilities, provide laundry services, and maintain workplace safety and sanitation standards. They will also develop professionalism, attention to detail, and customer service skills essential in the hospitality industry.', 436, 0.00, 25, 'active', 1, 1, NULL, '2025-10-12 20:22:25', '2025-11-03 19:11:31', '2025-10-12 20:22:25', NULL, NULL),
(18, 'BREAD 104', 'BREAD AND PASTRY PRODUCTION', 'The Bread and Pastry Production course equips learners with the knowledge and practical skills to prepare and produce a variety of bakery and pastry products. It includes training in baking bread, cakes, pastries, and other desserts following industry standards of quality and safety.', 'Vocational', 'Beginner', 'Applicants should be able to communicate in basic English and Filipino and be in good physical and mental condition. No prior baking experience is required, but having basic cooking knowledge is an advantage.', 'Upon completion, trainees will be able to prepare, bake, and present bread and pastry products professionally. They will also learn food safety practices, sanitation, and the use of baking tools and equipment essential in bakery or pastry shop operations.', 141, 0.00, 25, 'active', 1, 1, NULL, '2025-10-12 20:26:32', NULL, '2025-10-12 20:26:32', NULL, NULL),
(19, 'BOOK 103', 'BOOKKEEPING', 'This program covers the competencies required to maintain books of accounts, prepare financial reports, and review internal control systems in various business environments.', 'Vocational', 'All Levels', 'Before starting bookkeeping, it\'s important to have a basic understanding of accounting principles, familiarity with financial documents (like invoices and receipts), and proficiency in using spreadsheets or accounting software. Attention to detail and basic math skills are also essential for maintaining accurate financial records.', 'Post transactions to the general ledger\nPrepare trial balance and basic financial statements\nReview internal control systems\nProcess payroll and tax documents\nUse accounting software applications', 350, 0.00, 25, 'active', 1, 10, 1, '2025-10-13 08:07:55', '2025-11-03 19:11:22', '2025-10-13 14:06:46', '2025-10-22 19:47:23', NULL),
(20, 'ICT 102', 'COMPUTER SYSTEM SERVICING', 'This course trains learners to install, configure, and maintain computer systems and networks. It covers hardware troubleshooting, software installation, and network setup to ensure computers function efficiently and securely.', 'Skills', 'Intermediate', 'Must be able to read and write; basic computer literacy and knowledge of electronic components are recommended. Some training centers may require completion of a basic ICT-related course.', 'Learners will be able to assemble and disassemble computer hardware, install operating systems and software, configure local area networks (LAN), and perform preventive maintenance and repair on computer systems.', 280, 0.00, 25, 'active', 1, 1, NULL, '2025-10-13 14:41:20', '2025-11-03 19:14:50', '2025-10-13 14:41:20', NULL, NULL),
(21, 'EIM 101', 'ELECTRICAL INSTALLATION AND MAINTENANCE', 'This course provides learners with the knowledge and skills to install, maintain, and repair electrical wiring, lighting, and power systems in residential, commercial, and industrial settings. It also covers safety procedures and the proper use of electrical tools and equipment.', 'Technical', 'Intermediate', 'Must be able to read and write; basic knowledge of mathematics and electricity is recommended. Some institutions may require completion of a basic electrical course or equivalent experience.', 'Learners will be able to perform electrical installation, maintenance, and troubleshooting according to industry standards and safety regulations. They will gain competencies in interpreting electrical plans, using measuring instruments, and ensuring proper circuit function.', 196, 0.00, 25, 'active', 1, 10, 1, '2025-10-22 19:44:04', '2025-11-27 20:09:30', '2025-10-22 19:47:35', '2025-10-22 19:47:35', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `enrollment`
--

CREATE TABLE `enrollment` (
  `enrollment_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'Foreign key from login table (students only)',
  `class_id` int(11) NOT NULL COMMENT 'Foreign key from classes table',
  `enrollment_date` datetime NOT NULL DEFAULT current_timestamp(),
  `status` enum('enrolled','pending','cancelled','completed','rejected','dropped') NOT NULL DEFAULT 'enrolled'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login`
--

CREATE TABLE `login` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('admin','staff','student') DEFAULT NULL,
  `account_status` enum('active','inactive','pending') NOT NULL DEFAULT 'pending',
  `verified` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login`
--

INSERT INTO `login` (`user_id`, `username`, `password`, `email`, `role`, `account_status`, `verified`) VALUES
(1, 'admin', '12345', 'adminako@gmail.com', 'admin', 'active', 'verified'),
(10, 'Niko', '123', 'niko@gmail.com', 'staff', 'active', 'verified');

-- --------------------------------------------------------

--
-- Table structure for table `materials`
--

CREATE TABLE `materials` (
  `material_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL COMMENT 'nullable: announcements/resources may be global',
  `instructor_id` int(11) NOT NULL,
  `instructor_name` varchar(150) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('classwork','announcement','resource') NOT NULL DEFAULT 'classwork',
  `original_filename` varchar(255) DEFAULT NULL,
  `stored_filename` varchar(255) DEFAULT NULL,
  `mimetype` varchar(100) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `date_uploaded` datetime NOT NULL DEFAULT current_timestamp(),
  `submission_start` datetime DEFAULT NULL,
  `submission_end` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `materials`
--

INSERT INTO `materials` (`material_id`, `class_id`, `instructor_id`, `instructor_name`, `title`, `description`, `type`, `original_filename`, `stored_filename`, `mimetype`, `file_size`, `date_uploaded`, `submission_start`, `submission_end`) VALUES
(7, 15, 10, 'niko Nonoy', 'may pasok na sa november', 'gg', 'announcement', 'Screenshot_from_2025-09-20_08-28-28.png', '20251022194922_Screenshot_from_2025-09-20_08-28-28.png', 'image/png', 237858, '2025-10-22 19:49:22', NULL, NULL),
(8, 15, 10, 'niko Nonoy', 'isapa', 'wala ulit pasok', 'classwork', 'Screenshot_from_2025-09-24_09-13-20.png', '20251022195409_Screenshot_from_2025-09-24_09-13-20.png', 'image/png', 97297, '2025-10-22 19:54:09', NULL, NULL),
(9, NULL, 10, 'niko Nonoy', 'Walang pasok', 'may bagyong tino', 'announcement', 'th15_defence_20.jpg', '20251104104201_th15_defence_20.jpg', 'image/jpeg', 1094052, '2025-11-04 10:42:01', NULL, NULL),
(10, 15, 10, 'niko Nonoy', 'Assignment', 'assignement 1', 'classwork', '508497457_1238429944449072_4759415022123866266_n_1.jpg', '20251104104526_508497457_1238429944449072_4759415022123866266_n_1.jpg', 'image/jpeg', 196149, '2025-11-04 10:45:26', '2025-11-04 10:45:00', '2025-11-04 10:47:00'),
(11, NULL, 1, 'Admin Ako', 'walang pasok', 'may bagyo', 'announcement', NULL, NULL, NULL, NULL, '2025-11-27 20:10:37', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `personal_information`
--

CREATE TABLE `personal_information` (
  `info_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `province` varchar(100) NOT NULL,
  `municipality` varchar(100) NOT NULL,
  `baranggay` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `terms_accepted` tinyint(1) NOT NULL DEFAULT 0,
  `date_registered` datetime NOT NULL DEFAULT current_timestamp(),
  `signature` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `personal_information`
--

INSERT INTO `personal_information` (`info_id`, `user_id`, `province`, `municipality`, `baranggay`, `contact_number`, `first_name`, `middle_name`, `last_name`, `date_of_birth`, `gender`, `profile_picture`, `terms_accepted`, `date_registered`, `signature`) VALUES
(1, 1, 'Metro Manila (NCR)', 'City of Taguig', 'New Lower Bicutan', '09474371682', 'Admin', 'M', 'Ako', '2025-06-03', 'male', '1_8b2ec9a12f8e42079e69461f32f360d4.jpg', 1, '2025-06-05 22:58:27', '1_1683365d035b457bbfe3327fbe51064e.png'),
(14, 10, 'Leyte', 'City of Tacloban', 'Barangay 109-A', '09474371623', 'Niko', 'N', 'Nonoy', '2000-11-05', 'male', '10_f45b88d2759c4300b3b0b48bc2e0f517.jpg', 1, '2025-06-08 09:55:38', '10_c9a50b45fc6b461ea678e8d19b9ebbba.png');

-- --------------------------------------------------------

--
-- Table structure for table `student_grades`
--

CREATE TABLE `student_grades` (
  `grade_id` int(11) NOT NULL,
  `enrollment_id` int(11) NOT NULL COMMENT 'Foreign key from enrollment table',
  `prelim_grade` decimal(5,2) DEFAULT NULL,
  `midterm_grade` decimal(5,2) DEFAULT NULL,
  `final_grade` decimal(5,2) DEFAULT NULL,
  `remarks` enum('Competent','Not yet competent','Dropped') DEFAULT NULL,
  `date_recorded` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_requirements`
--

CREATE TABLE `student_requirements` (
  `requirement_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `barangay_clearance` varchar(255) DEFAULT NULL,
  `medical_certificate` varchar(255) DEFAULT NULL,
  `marriage_certificate` varchar(255) DEFAULT NULL,
  `valid_id` varchar(255) DEFAULT NULL,
  `transcript_form` varchar(255) DEFAULT NULL,
  `additional_notes` text DEFAULT NULL,
  `date_uploaded` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `submission_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `stored_filename` varchar(255) DEFAULT NULL,
  `date_submitted` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_archived`
--

CREATE TABLE `user_archived` (
  `archive_id` int(11) NOT NULL,
  `original_user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('admin','staff','student') DEFAULT NULL,
  `account_status` enum('active','inactive','pending') NOT NULL DEFAULT 'pending',
  `province` varchar(100) NOT NULL,
  `municipality` varchar(100) NOT NULL,
  `baranggay` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `terms_accepted` tinyint(1) NOT NULL DEFAULT 0,
  `date_registered` datetime NOT NULL COMMENT 'Original registration date',
  `date_archived` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'When the user was archived',
  `archived_by` int(11) DEFAULT NULL COMMENT 'User ID who performed the archive'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `enrollment_id` (`enrollment_id`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`class_id`),
  ADD KEY `fk_course_id` (`course_id`),
  ADD KEY `fk_instructor_id` (`instructor_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`course_id`),
  ADD UNIQUE KEY `course_code_unique` (`course_code`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `enrollment`
--
ALTER TABLE `enrollment`
  ADD PRIMARY KEY (`enrollment_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `class_id` (`class_id`);

--
-- Indexes for table `login`
--
ALTER TABLE `login`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username_unique` (`username`),
  ADD UNIQUE KEY `email_unique` (`email`);

--
-- Indexes for table `materials`
--
ALTER TABLE `materials`
  ADD PRIMARY KEY (`material_id`),
  ADD KEY `idx_class` (`class_id`),
  ADD KEY `idx_instructor` (`instructor_id`);

--
-- Indexes for table `personal_information`
--
ALTER TABLE `personal_information`
  ADD PRIMARY KEY (`info_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `student_grades`
--
ALTER TABLE `student_grades`
  ADD PRIMARY KEY (`grade_id`),
  ADD KEY `enrollment_id` (`enrollment_id`);

--
-- Indexes for table `student_requirements`
--
ALTER TABLE `student_requirements`
  ADD PRIMARY KEY (`requirement_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `material_id` (`material_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `user_archived`
--
ALTER TABLE `user_archived`
  ADD PRIMARY KEY (`archive_id`),
  ADD KEY `original_user_id` (`original_user_id`),
  ADD KEY `username` (`username`),
  ADD KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `class_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `course_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `enrollment`
--
ALTER TABLE `enrollment`
  MODIFY `enrollment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login`
--
ALTER TABLE `login`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `materials`
--
ALTER TABLE `materials`
  MODIFY `material_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `personal_information`
--
ALTER TABLE `personal_information`
  MODIFY `info_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `student_grades`
--
ALTER TABLE `student_grades`
  MODIFY `grade_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_requirements`
--
ALTER TABLE `student_requirements`
  MODIFY `requirement_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_archived`
--
ALTER TABLE `user_archived`
  MODIFY `archive_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `certificates_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollment` (`enrollment_id`);

--
-- Constraints for table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `fk_course_id` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `login` (`user_id`),
  ADD CONSTRAINT `courses_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `login` (`user_id`);

--
-- Constraints for table `enrollment`
--
ALTER TABLE `enrollment`
  ADD CONSTRAINT `enrollment_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `login` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enrollment_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE;

--
-- Constraints for table `personal_information`
--
ALTER TABLE `personal_information`
  ADD CONSTRAINT `personal_information_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `login` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_grades`
--
ALTER TABLE `student_grades`
  ADD CONSTRAINT `student_grades_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollment` (`enrollment_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_requirements`
--
ALTER TABLE `student_requirements`
  ADD CONSTRAINT `student_requirements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `login` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `materials` (`material_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `login` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
