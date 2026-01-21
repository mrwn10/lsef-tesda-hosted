-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jan 21, 2026 at 11:36 AM
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
  `status` enum('pending','open','ongoing','completed','edited') NOT NULL DEFAULT 'pending',
  `date_created` datetime NOT NULL DEFAULT current_timestamp(),
  `date_updated` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `edit_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`class_id`, `course_id`, `class_title`, `school_year`, `batch`, `schedule`, `days_of_week`, `venue`, `max_students`, `instructor_id`, `instructor_name`, `start_date`, `end_date`, `prerequisites`, `status`, `date_created`, `date_updated`, `edit_reason`) VALUES
(11, 1, 'BOOKING', '2026-2027', '1', 'Monday 6:00 AM-6:00 PM', '{\"Monday\":{\"start\":\"06:00\",\"end\":\"18:00\"}}', 'sda', 25, 2, 'Vincent Octavio', '2026-01-21', '2027-02-03', 'Applicants must have at least completed Senior High School or an equivalent qualification. Basic knowledge of mathematics and the ability to read, write, and understand simple financial documents are required. Computer literacy is an advantage, especially in using spreadsheets and basic accounting software.', 'pending', '2026-01-21 18:00:52', NULL, NULL);

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
(1, 'BOOK-101', 'Bookkeping', 'This course equips learners with the knowledge and skills to record, classify, and summarize financial transactions in accordance with accounting principles and TESDA standards. It covers journalizing, posting to ledgers, preparing trial balances, and generating basic financial reports. The training prepares graduates for entry-level bookkeeping and accounting support roles in various organizations.', 'Skills', 'All Levels', 'Applicants must have at least completed Senior High School or an equivalent qualification. Basic knowledge of mathematics and the ability to read, write, and understand simple financial documents are required. Computer literacy is an advantage, especially in using spreadsheets and basic accounting software.', 'Upon completion of the course, learners will be able to accurately record and classify financial transactions using accepted accounting principles. They can prepare journals, ledgers, trial balances, and basic financial statements. Learners will also demonstrate competence in using bookkeeping tools and software while observing ethical standards and workplace policies.', 256, 0.00, 25, 'active', 1, 1, NULL, '2026-01-11 15:03:26', NULL, '2026-01-11 15:03:26', NULL, NULL);

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
(1, 'admin', '12345', 'adminakoo@gmail.com', 'admin', 'active', 'verified'),
(2, 'niko', '123', 'niko1@gmail.com', 'staff', 'active', 'verified'),
(3, 'marwindalin', 'Marwindalin09!', 'marwindalin10@gmail.com', 'student', 'active', 'verified');

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
(1, 1, 'Metro Manila (NCR)', 'City of Taguig', 'New Lower Bicutan', '09172468147', 'Enrico Ariel', 'T.', 'Ting', '1990-06-03', 'male', '1_1ad7293dcd594a5eb423b0cac628e78c.jpg', 1, '2025-06-05 22:58:27', '1_881260fd21c64829b6458605ecb810db.png'),
(2, 2, 'Leyte', 'City of Tacloban', 'Barangay 109-A', '09108735236', 'Vincent', NULL, 'Octavio', '2000-11-05', 'male', '2_ad6f4478904e46199b30c680096bfb2d.jpeg', 1, '2025-06-08 09:55:38', '2_70a2a5bc8de6481e8dd56e04197a418e.png'),
(3, 3, 'Laguna', 'Pila', 'Pansol', '09474371682', 'Marwin', 'Mejorada', 'Dalin', '2004-03-01', 'male', '20260111150021_Formal_Picture.jpeg', 1, '2026-01-11 15:00:21', NULL);

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
  `status` varchar(50) GENERATED ALWAYS AS (case when `final_grade` >= 96 then 'Excellent (Competent)' when `final_grade` >= 91 then 'Very Satisfactory (Competent)' when `final_grade` >= 86 then 'Satisfactory (Competent)' when `final_grade` >= 81 then 'Fairly Satisfactory (Competent)' when `final_grade` >= 75 then 'Passed (Competent)' when `final_grade` < 75 then 'Failed (Not Yet Competent)' when `final_grade` is null then 'Incomplete' else 'Not Evaluated' end) STORED,
  `remarks` enum('Competent','Not yet competent','Dropped') DEFAULT NULL,
  `date_recorded` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_grades`
--

INSERT INTO `student_grades` (`grade_id`, `enrollment_id`, `prelim_grade`, `midterm_grade`, `final_grade`, `remarks`, `date_recorded`) VALUES
(1, 1, 98.00, 99.00, 99.00, 'Competent', '2026-01-11 15:08:09');

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

--
-- Dumping data for table `student_requirements`
--

INSERT INTO `student_requirements` (`requirement_id`, `user_id`, `barangay_clearance`, `medical_certificate`, `marriage_certificate`, `valid_id`, `transcript_form`, `additional_notes`, `date_uploaded`) VALUES
(1, 3, '3_barangay_clearance_Database_Connection.png', '3_medical_certificate_Formal_Picture.jpeg', NULL, '3_valid_id_Desktop.jpg', '3_transcript_form_Desktop.jpg', 'please accept.', '2026-01-11 15:05:59');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `class_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `course_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `enrollment`
--
ALTER TABLE `enrollment`
  MODIFY `enrollment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `login`
--
ALTER TABLE `login`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `materials`
--
ALTER TABLE `materials`
  MODIFY `material_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_information`
--
ALTER TABLE `personal_information`
  MODIFY `info_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student_grades`
--
ALTER TABLE `student_grades`
  MODIFY `grade_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `student_requirements`
--
ALTER TABLE `student_requirements`
  MODIFY `requirement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
