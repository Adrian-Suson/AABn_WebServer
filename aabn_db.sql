-- Database: `aabn_db`
CREATE DATABASE IF NOT EXISTS aabn_db;

USE aabn_db;

-- Table structure for table `users`
CREATE TABLE IF NOT EXISTS `users` (
    `userId` INT(11) NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `first_name` VARCHAR(255) DEFAULT 'First Name',
    `last_name` VARCHAR(255) DEFAULT 'Last Name',
    `email` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(20) DEFAULT '',
    `image_url` VARCHAR(255) DEFAULT 'default_profile.jpg',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`userId`),
    UNIQUE KEY `email_UNIQUE` (`email`),
    UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table structure for table `documents`
CREATE TABLE IF NOT EXISTS `documents` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `document_code` VARCHAR(100) NOT NULL,
    `sender_id` INT(11) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `prioritization` VARCHAR(50) DEFAULT NULL,
    `date_of_letter` DATETIME DEFAULT NULL,
    `classification` VARCHAR(50) DEFAULT NULL,
    `deadline` DATETIME DEFAULT NULL,
    `file_name` VARCHAR(255) DEFAULT NULL,
    `archive_date` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `document_code_UNIQUE` (`document_code`),
    KEY `sender_id_idx` (`sender_id`),
    CONSTRAINT `fk_documents_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Updated Table structure for table `recipients`
CREATE TABLE IF NOT EXISTS `recipients` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `document_code` VARCHAR(100) NOT NULL,
    `user_id` INT(11) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'Pending',
    PRIMARY KEY (`id`),
    KEY `document_code_idx` (`document_code`),
    KEY `user_id_idx` (`user_id`),
    CONSTRAINT `fk_recipients_document` FOREIGN KEY (`document_code`) REFERENCES `documents` (`document_code`) ON DELETE CASCADE,
    CONSTRAINT `fk_recipients_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table structure for table `user_log`
CREATE TABLE IF NOT EXISTS `user_log` (
    `log_id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL,
    PRIMARY KEY (`log_id`),
    KEY `idx_user_log_user_id` (`user_id`),
    CONSTRAINT `fk_user_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table structure for table `replies`
CREATE TABLE IF NOT EXISTS `replies` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
    `reply_code` VARCHAR(100) NOT NULL,
    `document_id` INT(11) NOT NULL,
    `user_id` INT(11) NOT NULL,
    `receiver_id` INT(11) NOT NULL,
    `reply_text` TEXT NOT NULL,
    `file_name` VARCHAR(255) DEFAULT NULL,
    `date_of_reply` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `seen` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `reply_code_UNIQUE` (`reply_code`),
    KEY `document_id_idx` (`document_id`),
    KEY `user_id_idx` (`user_id`),
    KEY `receiver_id_idx` (`receiver_id`),
    CONSTRAINT `fk_replies_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_replies_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
    CONSTRAINT `fk_replies_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table structure for table `document_tracking`
CREATE TABLE IF NOT EXISTS `document_tracking` (
    `tracking_id` INT(11) NOT NULL AUTO_INCREMENT,
    `document_code` VARCHAR(100) NOT NULL,
    `user_id` INT(11) NOT NULL,
    `action_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `action` TEXT NOT NULL,  -- Detailed action description
    PRIMARY KEY (`tracking_id`),
    KEY `document_code_idx` (`document_code`),
    KEY `user_id_idx` (`user_id`),
    CONSTRAINT `fk_document_tracking_document` FOREIGN KEY (`document_code`) REFERENCES `documents` (`document_code`) ON DELETE CASCADE,
    CONSTRAINT `fk_document_tracking_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table structure for table `events`
CREATE TABLE IF NOT EXISTS `events` (
    `event_id` INT(11) NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `event_date` DATE NOT NULL,  -- Date of the event
    `event_time` TIME NOT NULL,  -- Time of the event
    `created_by` INT(11) NOT NULL,  -- Reference to the user who created the event
    `description` TEXT DEFAULT NULL,  -- Event description (optional)
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- Event creation timestamp
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Auto-update timestamp
    PRIMARY KEY (`event_id`),
    KEY `created_by_idx` (`created_by`),
    CONSTRAINT `fk_events_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`userId`) ON DELETE CASCADE  -- Foreign key to users table
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table structure for table `event_attendees`
CREATE TABLE IF NOT EXISTS `event_attendees` (
    `event_attendee_id` INT(11) NOT NULL AUTO_INCREMENT,
    `event_id` INT(11) NOT NULL,  -- Reference to the event
    `user_id` INT(11) NOT NULL,  -- Reference to the user (attendee)
    PRIMARY KEY (`event_attendee_id`),
    KEY `event_id_idx` (`event_id`),
    KEY `user_id_idx` (`user_id`),
    CONSTRAINT `fk_event_attendees_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_event_attendees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;


