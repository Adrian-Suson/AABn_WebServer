
CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_code VARCHAR(100) UNIQUE NOT NULL,
  sender_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  prioritization VARCHAR(50),
  date_of_letter DATE,
  classification VARCHAR(50),
  deadline DATE,
  file_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES senders(id)
);
CREATE TABLE recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id)
);
