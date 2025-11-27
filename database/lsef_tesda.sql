-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 08, 2025 at 01:07 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

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
(15, 9, 'FOOD 101', '2025 - 2026', 'Batch 1', 'Tuesday 8:00 AM-4:00 PM, Thursday 10:00 AM-6:00 PM', '{\"Tuesday\": {\"start\": \"08:00\", \"end\": \"16:00\"}, \"Thursday\": {\"start\": \"10:00\", \"end\": \"18:00\"}}', 'LSEF TESDA', 25, 10, 'Vincent Octavio', '2025-10-01', '2026-09-08', 'Before entering the Food and Beverages field, students should have a basic understanding of food safety, hygiene practices, and customer service. A keen interest in culinary arts, attention to detail, and good communication skills are also essential for success in this area.', 'active', '2025-10-22 19:42:25', '2025-11-03 19:18:24', NULL),
(21, 17, 'HOUSE 101', '2025 - 2026', '2025', 'Wednesday 08:00-15:00', '{\"Monday\": {\"start\": \"06:00\", \"end\": \"13:00\"}, \"Tuesday\": {\"start\": \"06:00\", \"end\": \"13:00\"}, \"Wednesday\": {\"start\": \"08:00\", \"end\": \"15:00\"}}', 'LSEF TESDA', 25, 10, 'Lebron James', '2025-11-08', '2026-11-08', 'Applicants must be able to read and communicate in basic English and Filipino and possess good physical condition to perform housekeeping duties. No previous experience is required, but completion of high school or equivalent is recommended.', 'active', '2025-11-08 11:49:12', '2025-11-08 11:55:00', NULL),
(22, 18, 'BREAD 101', '2025 - 2026', '2025', 'Friday 10:00-15:00', '{\"Monday\": {\"start\": \"11:00\", \"end\": \"17:00\"}, \"Wednesday\": {\"start\": \"11:00\", \"end\": \"17:00\"}, \"Friday\": {\"start\": \"10:00\", \"end\": \"15:00\"}}', 'LSEF TESDA', 25, 10, 'James Harden', '2025-11-08', '2026-11-08', 'Applicants should be able to communicate in basic English and Filipino and be in good physical and mental condition. No prior baking experience is required, but having basic cooking knowledge is an advantage.', 'active', '2025-11-08 11:50:09', '2025-11-08 11:54:58', NULL),
(23, 19, 'BOOK 101', '2025 - 2026', '2025', 'Friday 10:00-18:00', '{\"Monday\": {\"start\": \"06:00\", \"end\": \"15:00\"}, \"Wednesday\": {\"start\": \"06:00\", \"end\": \"15:00\"}, \"Friday\": {\"start\": \"10:00\", \"end\": \"18:00\"}}', 'LSEF TESDA', 25, 10, 'James Harden', '2025-11-08', '2026-11-08', 'Before starting bookkeeping, it’s important to have a basic understanding of accounting principles, familiarity with financial documents (like invoices and receipts), and proficiency in using spreadsheets or accounting software. Attention to detail and basic math skills are also essential for maintaining accurate financial records.\n', 'active', '2025-11-08 11:51:18', '2025-11-08 11:54:55', NULL),
(24, 20, 'ICT 101', '2025 - 2026', '2025', 'Saturday 10:00-16:00', '{\"Tuesday\": {\"start\": \"06:00\", \"end\": \"10:00\"}, \"Thursday\": {\"start\": \"06:00\", \"end\": \"10:00\"}, \"Saturday\": {\"start\": \"10:00\", \"end\": \"16:00\"}}', 'LSEF TESDA', 25, 10, 'Megan Young', '2025-11-08', '2026-11-08', 'Must be able to read and write; basic computer literacy and knowledge of electronic components are recommended. Some training centers may require completion of a basic ICT-related course.', 'active', '2025-11-08 11:52:17', '2025-11-08 11:54:51', NULL),
(25, 21, 'EIM 101', '2025 - 2026', '2025', 'Thursday 10:00-16:00', '{\"Monday\": {\"start\": \"08:00\", \"end\": \"16:00\"}, \"Tuesday\": {\"start\": \"08:00\", \"end\": \"15:00\"}, \"Thursday\": {\"start\": \"10:00\", \"end\": \"16:00\"}}', 'LSEF TESDA', 25, 10, 'Elon Musk', '2025-11-08', '2026-11-08', 'Must be able to read and write; basic knowledge of mathematics and electricity is recommended. Some institutions may require completion of a basic electrical course or equivalent experience.', 'active', '2025-11-08 11:54:19', '2025-11-08 11:54:48', NULL);

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
(19, 'BOOK 103', 'BOOKKEEPING', 'This program covers the competencies required to maintain books of accounts, prepare financial reports, and review internal control systems in various business environments.', 'Vocational', 'All Levels', 'Before starting bookkeeping, it’s important to have a basic understanding of accounting principles, familiarity with financial documents (like invoices and receipts), and proficiency in using spreadsheets or accounting software. Attention to detail and basic math skills are also essential for maintaining accurate financial records.\n', 'Post transactions to the general ledger\nPrepare trial balance and basic financial statements\nReview internal control systems\nProcess payroll and tax documents\nUse accounting software applications', 350, 0.00, 25, 'active', 1, 10, 1, '2025-10-13 08:07:55', '2025-11-03 19:11:22', '2025-10-13 14:06:46', '2025-10-22 19:47:23', NULL),
(20, 'ICT 102', 'COMPUTER SYSTEM SERVICING', 'This course trains learners to install, configure, and maintain computer systems and networks. It covers hardware troubleshooting, software installation, and network setup to ensure computers function efficiently and securely.', 'Skills', 'Intermediate', 'Must be able to read and write; basic computer literacy and knowledge of electronic components are recommended. Some training centers may require completion of a basic ICT-related course.', 'Learners will be able to assemble and disassemble computer hardware, install operating systems and software, configure local area networks (LAN), and perform preventive maintenance and repair on computer systems.', 280, 0.00, 25, 'active', 1, 1, NULL, '2025-10-13 14:41:20', '2025-11-03 19:14:50', '2025-10-13 14:41:20', NULL, NULL),
(21, 'EIM 101', 'ELECTRICAL INSTALLATION AND MAINTENANCE', 'This course provides learners with the knowledge and skills to install, maintain, and repair electrical wiring, lighting, and power systems in residential, commercial, and industrial settings. It also covers safety procedures and the proper use of electrical tools and equipment.', 'Technical', 'Beginner', 'Must be able to read and write; basic knowledge of mathematics and electricity is recommended. Some institutions may require completion of a basic electrical course or equivalent experience.', 'Learners will be able to perform electrical installation, maintenance, and troubleshooting according to industry standards and safety regulations. They will gain competencies in interpreting electrical plans, using measuring instruments, and ensuring proper circuit function.', 196, 0.00, 25, 'active', 1, 10, 1, '2025-10-22 19:44:04', '2025-11-03 19:12:41', '2025-10-22 19:47:35', '2025-10-22 19:47:35', NULL);

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

--
-- Dumping data for table `enrollment`
--

INSERT INTO `enrollment` (`enrollment_id`, `user_id`, `class_id`, `enrollment_date`, `status`) VALUES
(9, 80, 15, '2025-10-22 19:50:12', 'enrolled'),
(12, 29, 15, '2025-11-04 09:09:52', 'enrolled'),
(13, 17, 22, '2025-11-08 12:49:11', 'enrolled'),
(14, 19, 23, '2025-11-08 14:05:01', 'enrolled'),
(15, 18, 23, '2025-11-08 14:06:09', 'rejected'),
(16, 18, 23, '2025-11-08 14:07:03', 'pending');

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
(10, 'Niko', '123', 'niko@gmail.com', 'staff', 'active', 'verified'),
(17, 'marwindalin', 'Marwindalin09!', 'marwindalin10@gmail.com', 'student', 'active', 'verified'),
(18, 'markcapillan', 'Markcapillan09!', 'mark@gmail.com', 'student', 'active', 'verified'),
(19, 'piolopascual', 'Piolopascual09!', 'piolo@gmail.com', 'student', 'active', 'verified'),
(20, 'nadinelustre', 'Nadine09!', 'nadine@gmail.com', 'staff', 'active', 'pending'),
(21, 'jamesreid', 'James09!', 'james@gmail.com', 'student', 'active', 'verified'),
(22, 'songoku', 'Songoku09!', 'songoku@gmail.com', 'student', 'active', 'verified'),
(23, 'songohan123', 'Songohan09!', 'songohan@gmail.com', 'student', 'active', 'verified'),
(24, 'francinemejia', 'Francine09!', 'france@gmail.com', 'student', 'active', 'verified'),
(25, 'jamesbond', 'Jamesbond09!', 'jamesbond@gmail.com', 'student', 'active', 'verified'),
(26, 'christineterante', 'Christine09!', 'tine@gmail.com', 'student', 'active', 'verified'),
(27, 'catherinecath', 'Catherine09!', 'cath@gmail.com', 'student', 'active', 'verified'),
(28, 'longmejia', 'Longmejira09!', 'long@gmail.com', 'student', 'pending', 'pending'),
(29, 'jcporcopio', 'Junejune2103.', 'jcporcopio03@gmail.com', 'student', 'active', 'verified'),
(30, 'asantos123', 'Adr!an2025', 'adrian.miguel.santos@example.com', 'student', 'pending', 'pending'),
(31, 'biancadelgado123', 'Bi@ncA123', 'bianca.rose.delgado@example.com', 'student', 'pending', 'pending'),
(32, 'carloreyes123', 'Male	C@rloJ202#', 'carlo.james.reyes@gmail.com', 'student', 'pending', 'pending'),
(33, 'dianamaecruz', 'Di@naM9!8', 'diana.mae.cruz@gmail.com', 'student', 'pending', 'pending'),
(34, 'ethangomez', 'Male	E7h@nPauL!', 'ethan.paul.gomez@gmail.com', 'student', 'pending', 'pending'),
(35, 'francesjoymorales', 'Fr@nc3sJ!y', 'frances.joy.morales@gmail.com', 'student', 'pending', 'pending'),
(36, 'gabrielnavarro', 'Male	G@bLe0n#5', 'gabriel.leon.navarro@gmail.com', 'student', 'pending', 'pending'),
(37, 'hannahvega', 'H4nn@hC!re	', 'hannah.claire.vega@gmail.com', 'student', 'pending', 'pending'),
(38, 'ianortega', 'Male	I@anRaf3l9', 'ian.rafael.ortega@gmail.com', 'student', 'pending', 'pending'),
(39, 'jasminebautista', 'J@sm1n3P!', 'jasmine.pearl.bautista@gmail.com', 'student', 'pending', 'pending'),
(40, 'kevincruzado', 'Male	K3v!nA11', 'kevin.allen.cruzado@gmail.com', 'student', 'pending', 'pending'),
(41, 'lauramercado', 'L@urA4nne8', 'laura.anne.mercado@gmail.com', 'student', 'pending', 'pending'),
(42, 'marcoluisrivera', 'Male	M@rc0Lu!s', 'marco.luis.rivera@gmail.com', 'student', 'pending', 'pending'),
(43, 'nicoleramos', 'N1c0l3F@th', 'nicole.faith.ramos@gmail.com', 'student', 'pending', 'pending'),
(44, 'oscarnavarro', 'Male	O$carB3nj1', 'oscar.benjamin.navarro@gmail.com', 'student', 'pending', 'pending'),
(45, 'patriciasantos', 'P@tr1c1aD!', 'patricia.dolores.santos@gmail.com', 'student', 'pending', 'pending'),
(46, 'quentindaleocampo', 'Male	Qu3nt!nD4', 'quentin.dale.ocampo@gmail.com', 'student', 'pending', 'pending'),
(47, 'rachelmaecabrera', 'R@ch3lM4e!', 'rachel.mae.cabrera@gmail.com', 'student', 'pending', 'pending'),
(48, 'samueldiazmale', '	S@mP3t3r8', 'samuel.peter.diaz@gmail.com', 'student', 'pending', 'pending'),
(49, 'theresajoyvillanueva', 'Th3r3s@J0y', 'theresa.joy.villanueva@gmail.com', 'student', 'pending', 'pending'),
(50, 'ulricmanuelaquino', 'Male	U!r1cM4nu3l', 'ulric.manuel.aquino@gmail.com', 'student', 'pending', 'pending'),
(51, 'vanessapadilla', 'V@nL3igh9!', 'vanessa.leigh.padilla@gmail.com', 'student', 'pending', 'pending'),
(52, 'williamtroylorenzo', 'Male	W!llTr0y22', 'william.troy.lorenzo@gmail.com', 'student', 'pending', 'pending'),
(53, 'ximenaalonzo', 'X1m3n@R0se', 'ximena.rose.alonzo@example.com', 'student', 'pending', 'pending'),
(54, 'yuriherrera', 'Male	Y#r1A1ex0', 'yuri.alex.herrera@gmail.com', 'student', 'pending', 'pending'),
(55, 'zoepineda', 'Z0eC@mill3', 'zoe.camille.pineda@gmail.com', 'student', 'pending', 'pending'),
(56, 'aaronbautista', 'Male	A@r0nM1g!', 'aaron.miguel.bautista@gmail.com', 'student', 'pending', 'pending'),
(57, 'bellalynnsantos', 'B3ll@Lynn7', 'bella.lynn.santos@gmail.com', 'student', 'pending', 'pending'),
(58, 'chasecruz', 'Male	Ch@seD0n9!', 'chase.donovan.cruz@example.com', 'student', 'pending', 'pending'),
(59, 'deniseesteban', 'D3n!s3M4r', 'denise.marie.esteban@gmail.com', 'student', 'pending', 'pending'),
(60, 'elijahserrano', 'El!j4hN0ah', 'elijah.noah.serrano@example.com', 'student', 'pending', 'pending'),
(61, 'feliciatorres', 'F3l!c1aAn3', 'felicia.anne.torres@gmail.com', 'student', 'pending', 'pending'),
(62, 'gavinmedina', 'Male	G@v1nCh4r!', 'gavin.charles.medina@gmail.com', 'student', 'pending', 'pending'),
(63, 'hazelramos', 'H@z3lIn9r!', 'hazel.ingrid.ramos@gmail.com', 'student', 'pending', 'pending'),
(64, 'isaiahparedes', 'Male	Is@1ahM4rk', 'isaiah.mark.paredes@gmail.com', 'student', 'pending', 'pending'),
(65, 'joymanalo', 'J0yEl@1n3!', 'joy.elaine.manalo@gmail.com', 'student', 'pending', 'pending'),
(66, 'kyleserrano', 'Male	Ky!eD0m1n2', 'kyle.dominic.serrano@gmail.com', 'student', 'pending', 'pending'),
(67, 'leahbautista', 'L3@hP@l0m4', 'leah.paloma.bautista@gmail.com', 'student', 'pending', 'pending'),
(68, 'milesgonzales', 'M!l3sH3n9', 'miles.henry.gonzales@gmail.com', 'student', 'pending', 'pending'),
(69, 'ninacalderon', 'N1n@Est3ll3', 'nina.estelle.calderon@gmail.com', 'student', 'pending', 'pending'),
(70, 'owendelacruz', 'Male	Ow3nV!ct0r', 'owen.victor.delacruz@gmail.com', 'student', 'pending', 'pending'),
(71, 'phoebejoymiranda', 'Ph03b3J0y!', 'phoebe.joy.miranda@gmail.com', 'student', 'pending', 'pending'),
(72, 'quentinsison', '	Q!uent1nIra', 'quentin.ira.sison@gmail.com', 'student', 'pending', 'pending'),
(73, 'rosacastillo', 'R0s@M@y123', 'rosa.may.castillo@gmail.com', 'student', 'pending', 'pending'),
(74, 'seanvalencia', '	S3@nP@tr1ck', 'sean.patrick.valencia@gmail.com', 'student', 'active', 'pending'),
(75, 'tessacabral', 'T3ss@L0rr@1n', 'tessa.lorraine.cabral@gmail.com', 'student', 'inactive', 'pending'),
(76, 'ulyssesherrera', 'U1yss3sD3@n!	', 'ulysses.dean.herrera@gmail.com', 'student', 'active', 'pending'),
(78, 'warrenlim', 'W@rr3nJ0e1', 'warren.joel.lim@gmail.com', 'student', 'inactive', 'pending'),
(80, 'markjohn', 'Marwindalin09!', 'markjohn@gmail.com', 'student', 'active', 'verified'),
(81, 'christineparis2024', 'Chris09!', 'ye@gmail.com', 'student', 'active', 'pending'),
(82, 'kanyeyeast', 'Kanye09!', 'yeast@gmail.com', 'student', 'pending', 'pending'),
(83, 'nigg', 'Beepboop09!', 'niig@gmail.com', 'staff', 'active', 'verified'),
(84, 'wakara', 'Marwindalin09!', 'waka@gmail.com', 'staff', 'active', 'verified');

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
(10, 15, 10, 'niko Nonoy', 'Assignment', 'assignement 1', 'classwork', '508497457_1238429944449072_4759415022123866266_n_1.jpg', '20251104104526_508497457_1238429944449072_4759415022123866266_n_1.jpg', 'image/jpeg', 196149, '2025-11-04 10:45:26', '2025-11-04 10:45:00', '2025-11-04 10:47:00');

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
  `date_registered` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `personal_information`
--

INSERT INTO `personal_information` (`info_id`, `user_id`, `province`, `municipality`, `baranggay`, `contact_number`, `first_name`, `middle_name`, `last_name`, `date_of_birth`, `gender`, `profile_picture`, `terms_accepted`, `date_registered`) VALUES
(1, 1, 'Metro Manila (NCR)', 'City of Taguig', 'New Lower Bicutan', '09474371682', 'Admin', 'M', 'Ako', '2025-06-03', 'male', '1_8b857edd7d394680b7a326ad0235ee5e.jpg', 1, '2025-06-05 22:58:27'),
(14, 10, 'Leyte', 'City of Tacloban', 'Barangay 109-A', '09474371682', 'Niko', 'N', 'Nonoy', '2000-11-05', 'male', '10_8e72396301fc4280980ba99b98f75dff.png', 1, '2025-06-08 09:55:38'),
(29, 17, 'Laguna', 'Pila', 'Pansol', '09474371682', 'Marwin', 'Mejoradaaaa', 'Dalin', '2004-03-01', 'male', '17_f7f4e25350df442582215d422ac9871f.png', 1, '2025-10-12 08:24:29'),
(30, 18, 'Laguna', 'Pila', 'Pansol', '09474371682', 'Mark', '', 'Capillan', '2004-03-01', 'male', NULL, 1, '2025-10-12 10:29:44'),
(31, 19, 'Palawan', 'Kalayaan', 'Pag-Asa (Pob.)', '09474371682', 'Piolo', '', 'Pascual', '1988-03-01', 'male', NULL, 1, '2025-10-12 10:31:10'),
(32, 20, 'Cagayan', 'Lasam', 'Magsaysay', '09474371682', 'Nadine', '', 'Lustre', '1989-03-01', 'female', NULL, 1, '2025-10-12 10:32:21'),
(33, 21, 'Bukidnon', 'Lantapan', 'Kibangay', '09474371682', 'James', '', 'Reid', '2001-03-01', 'male', NULL, 1, '2025-10-12 10:33:31'),
(34, 22, 'Benguet', 'La Trinidad', 'Puguis', '09474371682', 'Son', '', 'Goku', '1990-02-10', 'male', NULL, 1, '2025-10-12 10:42:49'),
(35, 23, 'Cagayan', 'Lal-Lo', 'Dalaya', '09474371682', 'Son', '', 'Gohan', '1924-09-29', 'female', NULL, 1, '2025-10-12 10:44:01'),
(36, 24, 'Bohol', 'City of Tagbilaran', 'Taloto', '09474371682', 'Francine', '', 'Mejia', '2008-01-31', 'female', NULL, 1, '2025-10-12 10:46:15'),
(37, 25, 'Biliran', 'Culaba', 'Patag', '09474371682', 'James', '', 'Bond', '1980-03-02', 'male', NULL, 1, '2025-10-12 10:47:53'),
(38, 26, 'Biliran', 'Biliran', 'Sanggalang', '09474371682', 'Christine', '', 'Terante', '2003-06-08', 'female', NULL, 1, '2025-10-12 10:49:25'),
(39, 27, 'Bohol', 'City of Tagbilaran', 'Poblacion II', '09474371682', 'Catherine', '', 'Cath', '2007-03-29', 'female', NULL, 1, '2025-10-12 10:50:21'),
(40, 28, 'Biliran', 'Cabucgayan', 'Magbangon (Pob.)', '09474371682', 'Long', '', 'Mejia', '1998-03-20', 'male', NULL, 1, '2025-10-12 10:51:06'),
(41, 29, 'Laguna', 'Santa Cruz', 'Patimbao', '09108236537', 'JC', 'Caayaman', 'Porcopio', '2009-06-16', 'male', NULL, 1, '2025-10-13 07:59:12'),
(42, 30, 'Laguna', 'Los Baños', 'Malinta', '09108236537', 'Adrian Miguel Santos', 'Miguel Santos', 'Santos', '2002-07-08', 'male', NULL, 1, '2025-10-13 09:22:13'),
(43, 31, 'Laguna', 'Los Baños', 'Mayondon', '09108236537', 'Bianca ', 'Rose ', 'Delgado', '2001-07-18', 'female', NULL, 1, '2025-10-13 09:24:18'),
(44, 32, 'Laguna', 'Santa Cruz', 'Duhat', '09108236537', 'Carlo	', 'James ', '	Reyes', '1999-06-16', 'male', NULL, 1, '2025-10-13 09:26:29'),
(45, 33, 'Laguna', 'Santa Cruz', 'Barangay V (Pob.)', '09108236537', 'Diana	 ', '', 'Mae	Cruz	 ', '2001-07-31', 'female', NULL, 1, '2025-10-13 09:27:41'),
(46, 34, 'Laguna', 'Santa Cruz', 'Pagsawitan', '09108236537', 'Ethan	 ', 'Paul ', '	Gomez', '2002-06-13', 'male', NULL, 1, '2025-10-13 09:28:57'),
(47, 35, 'Laguna', 'Santa Cruz', 'Patimbao', '09108236537', 'Frances	Joy	', '', 'Morales', '2004-06-25', 'female', NULL, 1, '2025-10-13 09:30:23'),
(48, 36, 'Laguna', 'Santa Cruz', 'Pagsawitan', '09108236537', 'Gabriel	 ', 'Leon ', '	Navarro', '2002-07-26', 'male', NULL, 1, '2025-10-13 09:31:25'),
(49, 37, 'Laguna', 'Santa Cruz', 'Duhat', '09108236537', 'Hannah	 ', '	Claire	 ', 'Vega', '2001-07-18', 'female', NULL, 1, '2025-10-13 09:32:31'),
(50, 38, 'Laguna', 'Santa Cruz', 'Barangay V (Pob.)', '09108236537', 'Ian', '	Rafael	', 'Ortega', '2005-07-14', 'male', NULL, 1, '2025-10-13 09:33:46'),
(51, 39, 'Laguna', 'Santa Cruz', 'Santo Angel Central', '09108236537', 'Jasmine	 ', 'Pearl	 ', 'Bautista', '2005-07-21', 'female', NULL, 1, '2025-10-13 09:34:54'),
(52, 40, 'Laguna', 'Santa Cruz', 'Santisima Cruz', '09108236537', 'Kevin	 ', 'Allen	 ', 'Cruzado', '2006-07-19', 'male', NULL, 1, '2025-10-13 09:36:00'),
(53, 41, 'Laguna', 'Santa Cruz', 'Santo Angel Sur', '09108236537', 'Laura	 ', 'Anne	 ', 'Mercado', '2002-10-18', 'female', NULL, 1, '2025-10-13 09:37:04'),
(54, 42, 'Laguna', 'Santa Cruz', 'Labuin', '09108236537', 'Marco	', '', 'Luis	Rivera', '1999-07-15', 'male', NULL, 1, '2025-10-13 09:38:27'),
(55, 43, 'Laguna', 'Santa Cruz', 'San Pablo Norte', '09108236537', 'Nicole ', '	Faith	', 'Ramos	 ', '2005-11-17', 'female', NULL, 1, '2025-10-13 09:39:46'),
(56, 44, 'Laguna', 'Santa Cruz', 'Santo Angel Sur', '09108236537', 'Oscar	 ', 'Benjamin	 ', 'Navarro', '2000-07-21', 'male', NULL, 1, '2025-10-13 09:40:48'),
(57, 45, 'Laguna', 'Santa Cruz', 'San Pablo Sur', '09108236537', 'Patricia	 ', 'Dolores	 ', 'Santos', '2002-02-21', 'female', NULL, 1, '2025-10-13 09:42:20'),
(58, 46, 'Laguna', 'Santa Cruz', 'Pagsawitan', '09108236537', 'Quentin	 ', ' ', 'Dale	Ocampo', '2004-07-22', 'male', NULL, 1, '2025-10-13 09:43:43'),
(59, 47, 'Laguna', 'Santa Cruz', 'Bagumbayan', '09108236537', 'Rachel	 ', '', 'Mae	Cabrera', '2000-07-11', 'female', NULL, 1, '2025-10-13 09:44:44'),
(60, 48, 'Laguna', 'Santa Cruz', 'San Juan', '09108236537', 'Samuel', 'Peter	 ', 'Diaz	Male', '2007-06-21', 'male', NULL, 1, '2025-10-13 10:03:39'),
(61, 49, 'Laguna', 'Santa Cruz', 'Santo Angel Central', '09108236537', 'Theresa	Joy	 ', ' ', 'Villanueva', '2003-07-18', 'female', NULL, 1, '2025-10-13 10:05:07'),
(62, 50, 'Laguna', 'Santa Cruz', 'San Pablo Norte', '09108236537', 'Ulric	Manuel	 ', '', 'Aquino', '1995-11-09', 'male', NULL, 1, '2025-10-13 10:05:52'),
(63, 51, 'Laguna', 'Santa Cruz', 'San Pablo Sur', '09108236537', 'Vanessa	 ', 'Leigh	 ', 'Padilla	', '2001-11-15', 'female', NULL, 1, '2025-10-13 10:07:01'),
(64, 52, 'Laguna', 'Santa Cruz', 'Santisima Cruz', '09108236537', 'William Troy', '', ' 	Lorenzo', '2001-11-08', 'male', NULL, 1, '2025-10-13 10:08:04'),
(65, 53, 'Laguna', 'Santa Cruz', 'Alipit', '09108236537', 'Ximena	 ', 'Rose	 ', 'Alonzo', '2004-06-09', 'female', NULL, 1, '2025-10-13 10:08:55'),
(66, 54, 'Laguna', 'Santa Cruz', 'Oogong', '09108236537', 'Yuri	 ', 'Alex	 ', 'Herrera', '2001-06-21', 'female', NULL, 1, '2025-10-13 10:09:48'),
(67, 55, 'Laguna', 'Santa Cruz', 'San Pablo Norte', '09108236537', 'Zoe ', '	Camille	 ', 'Pineda', '2002-07-16', 'female', NULL, 1, '2025-10-13 10:10:50'),
(68, 56, 'Laguna', 'Santa Cruz', 'San Pablo Norte', '09108236537', 'Aaron	 ', 'Miguel	 ', 'Bautista', '1998-07-09', 'male', NULL, 1, '2025-10-13 10:11:50'),
(69, 57, 'Laguna', 'Santa Cruz', 'San Juan', '09108236537', 'Bella	 ', '', 'Lynn	Santos', '1997-06-19', 'female', NULL, 1, '2025-10-13 10:12:42'),
(70, 58, 'Laguna', 'Santa Cruz', 'Patimbao', '09108236537', 'Chase	 ', 'Donovan	 ', 'Cruz', '1992-07-23', 'male', NULL, 1, '2025-10-13 10:14:05'),
(71, 59, 'Laguna', 'Santa Cruz', 'San Pablo Sur', '09108236537', 'Denise	 ', 'Marie	 ', 'Esteban	 ', '2001-06-15', 'female', NULL, 1, '2025-10-13 10:15:03'),
(72, 60, 'Laguna', 'Santa Cruz', 'Barangay V (Pob.)', '09108236537', 'Elijah	 ', 'Noah	 ', 'Serrano', '2001-06-22', 'female', NULL, 1, '2025-10-13 10:15:55'),
(73, 61, 'Laguna', 'Santa Cruz', 'Santo Angel Central', '09108236537', 'Felicia	 ', 'Anne	 ', 'Torres', '2002-07-18', 'female', NULL, 1, '2025-10-13 10:17:55'),
(74, 62, 'Laguna', 'Santa Cruz', 'Calios', '09108236537', 'Gavin	 ', 'Charles	 ', 'Medina', '1999-10-08', 'male', NULL, 1, '2025-10-13 10:19:26'),
(75, 63, 'Laguna', 'Siniloan', 'Mayatba', '09108236537', 'Hazel	 ', 'Ingrid	 ', 'Ramos', '1998-06-10', 'female', NULL, 1, '2025-10-13 10:20:27'),
(76, 64, 'Laguna', 'City of Biñan', 'Malaban', '09108236537', 'Isaiah	 ', 'Mark	 ', 'Paredes', '1999-06-10', 'male', NULL, 1, '2025-10-13 10:21:22'),
(77, 65, 'Laguna', 'Pila', 'Masico', '09108236537', 'Joy	 ', 'Elaine	 ', 'Manalo', '1994-06-22', 'female', NULL, 1, '2025-10-13 10:22:21'),
(78, 66, 'Laguna', 'Mabitac', 'Matalatala', '09108236537', 'Kyle	 ', 'Dominic	 ', 'Serrano', '2000-05-18', 'male', NULL, 1, '2025-10-13 10:23:20'),
(79, 67, 'Laguna', 'Majayjay', 'Oobi', '09108236537', 'Leah	 ', 'Paloma	 ', 'Bautista', '2001-10-10', 'female', NULL, 1, '2025-10-13 10:24:11'),
(80, 68, 'Laguna', 'Pagsanjan', 'Layugan', '09108236537', 'Miles	 ', 'Henry	 ', 'Gonzales', '1999-09-08', 'female', NULL, 1, '2025-10-13 10:25:10'),
(81, 69, 'Laguna', 'Pakil', 'Gonzales (Pob.)', '09108236537', 'Nina	 ', 'Estelle ', '	Calderon', '2001-06-08', 'female', NULL, 1, '2025-10-13 10:26:01'),
(82, 70, 'Laguna', 'Pangil', 'Mabato-Azufre', '09108236537', 'Owen	 ', 'Victor	 ', 'De la Cruz', '2000-07-19', 'male', NULL, 1, '2025-10-13 10:26:56'),
(83, 71, 'Laguna', 'Paete', 'Bangkusay (Pob.)', '09108236537', 'Phoebe	 Joy	', ' ', 'Miranda', '2002-05-15', 'female', NULL, 1, '2025-10-13 10:28:25'),
(84, 72, 'Laguna', 'Nagcarlan', 'Cabuyew', '09108236537', 'Quentin	 ', 'Ira	 ', 'Sison', '1998-06-18', 'female', NULL, 1, '2025-10-13 10:29:13'),
(85, 73, 'Laguna', 'Pagsanjan', 'Pinagsanjan', '09108236537', 'Rosa	 ', 'May	 ', 'Castillo', '2001-06-13', 'female', NULL, 1, '2025-10-13 10:30:02'),
(86, 74, 'Laguna', 'Paete', 'Ilaya del Norte (Pob.)', '09108236537', 'Sean	 ', 'Patrick	 ', 'Valencia', '1999-07-13', 'male', NULL, 1, '2025-10-13 10:30:59'),
(87, 75, 'Laguna', 'Mabitac', 'Matalatala', '09108236537', 'Tessa	 ', 'Lorraine	 ', 'Cabral', '2005-06-09', 'female', NULL, 1, '2025-10-13 10:31:46'),
(88, 76, 'Laguna', 'Pakil', 'Casinsin', '09108236537', 'Ulysses	 ', 'Dean	 ', 'Herrera', '1996-06-07', 'male', NULL, 1, '2025-10-13 10:32:43'),
(90, 78, 'Laguna', 'City of Santa Rosa', 'Pook', '09108236537', 'Warren	 ', 'Joel	 ', 'Lim', '2001-09-28', 'male', NULL, 1, '2025-10-13 10:34:24'),
(92, 80, 'Benguet', 'Mankayan', 'Poblacion', '09474371682', 'Mark', NULL, 'John', '2002-02-05', 'male', NULL, 1, '2025-10-22 19:34:38'),
(93, 81, 'Marinduque', 'Santa Cruz', 'Dolores', '09474371682', 'Christine', NULL, 'Paris', '2005-02-09', 'female', NULL, 1, '2025-11-01 18:59:13'),
(94, 82, 'Abra', 'Lagayan', 'Pulot', '09474371682', 'kanye', '', 'yeast', '2005-06-07', 'male', NULL, 1, '2025-11-01 19:11:48'),
(97, 83, 'Not set', 'Not set', 'Not set', 'Not set', 'Staff', '', 'Member', '2000-01-01', 'other', NULL, 1, '2025-11-08 17:26:40'),
(98, 84, 'Not set', 'Not set', 'Not set', 'Not set', 'Staff', '', 'Member', '2000-01-01', 'other', NULL, 1, '2025-11-08 18:27:21');

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
  `remarks` enum('Passed','Failed','Completed','Incomplete','Dropped') DEFAULT NULL,
  `date_recorded` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_grades`
--

INSERT INTO `student_grades` (`grade_id`, `enrollment_id`, `prelim_grade`, `midterm_grade`, `final_grade`, `remarks`, `date_recorded`) VALUES
(3, 9, 87.00, 87.00, 87.00, 'Completed', '2025-10-22 19:55:47');

-- --------------------------------------------------------

--
-- Table structure for table `student_requirements`
--

CREATE TABLE `student_requirements` (
  `requirement_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `birth_certificate` varchar(255) DEFAULT NULL,
  `educational_credentials` varchar(255) DEFAULT NULL,
  `id_photos` varchar(255) DEFAULT NULL,
  `barangay_clearance` varchar(255) DEFAULT NULL,
  `medical_certificate` varchar(255) DEFAULT NULL,
  `marriage_certificate` varchar(255) DEFAULT NULL,
  `valid_id` varchar(255) DEFAULT NULL,
  `transcript_form` varchar(255) DEFAULT NULL,
  `good_moral_certificate` varchar(255) DEFAULT NULL,
  `brown_envelope` varchar(255) DEFAULT NULL,
  `additional_notes` text DEFAULT NULL,
  `date_uploaded` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_requirements`
--

INSERT INTO `student_requirements` (`requirement_id`, `user_id`, `birth_certificate`, `educational_credentials`, `id_photos`, `barangay_clearance`, `medical_certificate`, `marriage_certificate`, `valid_id`, `transcript_form`, `good_moral_certificate`, `brown_envelope`, `additional_notes`, `date_uploaded`) VALUES
(1, 29, '29_birth_certificate_Screenshot_2025-10-12_153544.png', '29_educational_credentials_Screenshot_2025-10-12_151447.png', '29_id_photos_Screenshot_2025-10-01_161648.png', '29_barangay_clearance_Screenshot_2025-10-01_161501.png', '29_medical_certificate_Screenshot_2025-10-12_152355.png', '29_marriage_certificate_Screenshot_2025-07-03_230222.png', '29_valid_id_Screenshot_2025-10-12_154423.png', '29_transcript_form_Screenshot_2025-10-01_161501.png', '29_good_moral_certificate_Screenshot_2025-10-12_173749.png', '29_brown_envelope_Screenshot_2025-10-01_161501.png', '', '2025-10-13 14:13:40'),
(3, 17, '17_birth_certificate_Screenshot_2025-04-15_131105.png', '17_educational_credentials_Screenshot_2025-10-01_161501.png', '17_id_photos_Screenshot_2025-05-28_170843.png', '17_barangay_clearance_Screenshot_2025-10-12_154941.png', '17_medical_certificate_Screenshot_2025-05-28_171026.png', '17_marriage_certificate_Screenshot_2025-10-12_151447.png', '17_valid_id_Screenshot_2025-07-03_230222.png', '17_transcript_form_Screenshot_2025-10-12_153544.png', '17_good_moral_certificate_Screenshot_2025-09-28_170241.png', '17_brown_envelope_Screenshot_2025-10-12_163427.png', 'to follow po yung iba', '2025-10-13 16:48:20'),
(4, 80, '80_birth_certificate_Screenshot_from_2025-09-20_08-28-28.png', '80_educational_credentials_Screenshot_from_2025-09-23_22-24-50.png', '80_id_photos_Screenshot_from_2025-09-23_22-47-29.png', '80_barangay_clearance_Screenshot_from_2025-09-23_22-25-32.png', '80_medical_certificate_Screenshot_from_2025-09-24_00-14-04.png', '80_marriage_certificate_Screenshot_from_2025-09-23_22-24-24.png', '80_valid_id_Screenshot_from_2025-09-23_22-25-32.png', '80_transcript_form_Screenshot_from_2025-09-24_09-13-20.png', '80_good_moral_certificate_Screenshot_from_2025-09-23_22-47-58.png', '80_brown_envelope_Screenshot_from_2025-09-24_09-13-20.png', 'pagpunta ko dyan', '2025-10-22 19:38:11');

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

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`submission_id`, `material_id`, `student_id`, `original_filename`, `stored_filename`, `date_submitted`) VALUES
(2, 10, 29, '508884083_734705079084048_8964909700600746865_n.jpg', '20251104104626_508884083_734705079084048_8964909700600746865_n.jpg', '2025-11-04 10:46:26');

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
-- Dumping data for table `user_archived`
--

INSERT INTO `user_archived` (`archive_id`, `original_user_id`, `username`, `password`, `email`, `role`, `account_status`, `province`, `municipality`, `baranggay`, `contact_number`, `first_name`, `middle_name`, `last_name`, `date_of_birth`, `gender`, `profile_picture`, `terms_accepted`, `date_registered`, `date_archived`, `archived_by`) VALUES
(19, 77, 'violemaesantiago', 'Vi0l3tM@e!8', 'violet.mae.santiago@gmail.com', 'student', 'active', 'Laguna', 'Luisiana', 'San Pedro', '09108236537', 'Viole Mae', '', 'Santiago', '2000-06-08', 'female', NULL, 1, '2025-10-13 10:33:37', '2025-11-08 15:59:50', NULL);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=142;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `class_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `course_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `enrollment`
--
ALTER TABLE `enrollment`
  MODIFY `enrollment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `login`
--
ALTER TABLE `login`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `materials`
--
ALTER TABLE `materials`
  MODIFY `material_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `personal_information`
--
ALTER TABLE `personal_information`
  MODIFY `info_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

--
-- AUTO_INCREMENT for table `student_grades`
--
ALTER TABLE `student_grades`
  MODIFY `grade_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student_requirements`
--
ALTER TABLE `student_requirements`
  MODIFY `requirement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user_archived`
--
ALTER TABLE `user_archived`
  MODIFY `archive_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

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
