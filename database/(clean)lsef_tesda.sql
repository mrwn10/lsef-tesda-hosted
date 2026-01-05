-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 05, 2026 at 11:33 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
  `verified` enum('pending','verified') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login`
--

INSERT INTO `login` (`user_id`, `username`, `password`, `email`, `role`, `account_status`, `verified`) VALUES
(1, 'admin', '12345', 'adminako@gmail.com', 'admin', 'active', 'verified'),
(2, 'Niko', '123', 'niko@gmail.com', 'staff', 'active', 'verified');

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
(1, 1, 'Metro Manila (NCR)', 'City of Taguig', 'New Lower Bicutan', '09474371682', 'Admin', 'M', 'Ako', '2025-06-03', 'male', NULL, 1, '2025-06-05 22:58:27', NULL),
(2, 2, 'Leyte', 'City of Tacloban', 'Barangay 109-A', '09474371623', 'Niko', 'N', 'Nonoy', '2000-11-05', 'male', NULL, 1, '2025-06-08 09:55:38', NULL);

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
  MODIFY `class_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `course_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `enrollment`
--
ALTER TABLE `enrollment`
  MODIFY `enrollment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login`
--
ALTER TABLE `login`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `materials`
--
ALTER TABLE `materials`
  MODIFY `material_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_information`
--
ALTER TABLE `personal_information`
  MODIFY `info_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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