
-- Database creation
CREATE DATABASE IF NOT EXISTS calendar_events;
USE calendar_events;

-- User table
CREATE TABLE IF NOT EXISTS user (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  last_name VARCHAR(50) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  middle_initial VARCHAR(2),
  username VARCHAR(50) NOT NULL UNIQUE,
  user_email VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  password VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event table
CREATE TABLE IF NOT EXISTS event (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_type VARCHAR(30) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  location VARCHAR(200),
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  color_code VARCHAR(20),
  tags VARCHAR(200),
  event_status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- Event Update table
CREATE TABLE IF NOT EXISTS event_update (
  update_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INT,
  update_reason VARCHAR(200),
  FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES user(user_id) ON DELETE SET NULL
);

-- Event Summary table
CREATE TABLE IF NOT EXISTS event_summary (
  summary_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  summary_text VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE
);

-- Countdown table
CREATE TABLE IF NOT EXISTS countdown (
  countdown_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  time_remaining VARCHAR(100) NOT NULL,
  FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_user_username ON user(username);
CREATE INDEX idx_user_email ON user(user_email);
CREATE INDEX idx_event_user ON event(user_id);
CREATE INDEX idx_event_date ON event(start_time);
CREATE INDEX idx_event_type ON event(event_type);
CREATE INDEX idx_event_status ON event(event_status);
