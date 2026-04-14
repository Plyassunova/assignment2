CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  course_name VARCHAR(100) NOT NULL,
  instructor VARCHAR(100) NOT NULL,
  credit_hours SMALLINT NOT NULL CHECK (credit_hours > 0)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assignment1 DECIMAL(5, 2) CHECK (assignment1 BETWEEN 0 AND 100),
  assignment2 DECIMAL(5, 2) CHECK (assignment2 BETWEEN 0 AND 100),
  midterm_exam DECIMAL(5, 2) CHECK (midterm_exam BETWEEN 0 AND 100),
  final_exam DECIMAL(5, 2) CHECK (final_exam BETWEEN 0 AND 100),
  final_project DECIMAL(5, 2) CHECK (final_project BETWEEN 0 AND 100),
  UNIQUE (student_id, course_id)
);
