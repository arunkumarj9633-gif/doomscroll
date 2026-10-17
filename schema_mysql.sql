-- Doomscroll Calculator database (MySQL 8.x, for MySQL Workbench)

CREATE DATABASE IF NOT EXISTS doomscroll_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE doomscroll_db;

-- 1. Users (for login later)
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Calculations: every time someone presses "Show me the truth"
CREATE TABLE IF NOT EXISTS calculations (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NULL,
  hours_per_day     DECIMAL(4,1) NOT NULL,
  age               INT NOT NULL,
  hours_per_year    DECIMAL(8,1) NOT NULL,
  days_per_year     DECIMAL(6,1) NOT NULL,
  waking_years_lost DECIMAL(6,1) NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_hours CHECK (hours_per_day >= 0 AND hours_per_day <= 24),
  CONSTRAINT chk_age   CHECK (age >= 10 AND age <= 100),
  CONSTRAINT fk_calc_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Goals: the "you could have..." list
CREATE TABLE IF NOT EXISTS goals (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  label      VARCHAR(255) NOT NULL,
  hours_each DECIMAL(8,1) NOT NULL,
  emoji      VARCHAR(10),
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT chk_hours_each CHECK (hours_each > 0)
) ENGINE=InnoDB;

-- 4. Daily logs (future feature)
CREATE TABLE IF NOT EXISTS daily_logs (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  log_date  DATE NOT NULL,
  hours     DECIMAL(4,1) NOT NULL,
  note      VARCHAR(255),
  CONSTRAINT chk_log_hours CHECK (hours >= 0 AND hours <= 24),
  CONSTRAINT uq_user_day UNIQUE (user_id, log_date),
  CONSTRAINT fk_log_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Starter data
INSERT INTO goals (label, hours_each, emoji) VALUES
  ('read {n} books', 8, '📚'),
  ('reach basic level in {n} new language(s)', 500, '🌍'),
  ('learn {n} instrument(s) to a decent level', 300, '🎸'),
  ('do {n} workouts', 1, '💪'),
  ('watch {n} full-length movies mindfully', 2, '🎬');

-- Test queries (run these after the script finishes)
SELECT * FROM goals;
SHOW TABLES;