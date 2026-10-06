CREATE DATABASE IF NOT EXISTS school_security_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE school_security_system;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student','faculty','guard') NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL UNIQUE,
  student_id VARCHAR(40) NOT NULL UNIQUE,
  first_name VARCHAR(80) NOT NULL,
  middle_name VARCHAR(80) NULL,
  last_name VARCHAR(80) NOT NULL,
  birth_date DATE NULL,
  gender ENUM('Male','Female') NULL,
  grade_level VARCHAR(40) NULL,
  section VARCHAR(40) NULL,
  contact_number VARCHAR(30) NULL,
  email VARCHAR(120) NULL,
  address TEXT NULL,
  photo VARCHAR(255) NULL,
  enrollment_status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  qr_token VARCHAR(80) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS announcements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  posted_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ann_user FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS gate_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  guard_id INT UNSIGNED NULL,
  action ENUM('entry','exit') NOT NULL,
  gate VARCHAR(60) NOT NULL DEFAULT 'Main Gate',
  status ENUM('allowed','denied') NOT NULL,
  scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_scanned (scanned_at),
  CONSTRAINT fk_log_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_log_guard FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
