const { Pool } = require('pg');
const { ConflictError, NotFoundError, ValidationError } = require('../errors');

function buildUpdateStatement(table, idField, id, data, allowedFields) {
  const entries = allowedFields.filter((field) => data[field] !== undefined);

  if (entries.length === 0) {
    throw new ValidationError('At least one field must be provided');
  }

  const values = [];
  const assignments = entries.map((field) => {
    values.push(data[field]);
    return `${field} = $${values.length}`;
  });

  values.push(id);
  return {
    text: `UPDATE ${table} SET ${assignments.join(', ')} WHERE ${idField} = $${values.length} RETURNING *`,
    values
  };
}

function mapUniqueError(error) {
  if (error.code === '23505') {
    return new ConflictError('Resource already exists');
  }

  return null;
}

class PostgresRepository {
  constructor(pool) {
    this.pool = pool;
  }

  static fromEnv() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    return new PostgresRepository(pool);
  }

  async createStudent(data) {
    try {
      const { rows } = await this.pool.query(
        'INSERT INTO students (name, email) VALUES ($1, $2) RETURNING *',
        [data.name, data.email]
      );
      return rows[0];
    } catch (error) {
      throw mapUniqueError(error) || error;
    }
  }

  async listStudents() {
    const { rows } = await this.pool.query('SELECT * FROM students ORDER BY id');
    return rows;
  }

  async getStudentById(id) {
    const { rows } = await this.pool.query('SELECT * FROM students WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async updateStudent(id, data) {
    try {
      const statement = buildUpdateStatement('students', 'id', id, data, ['name', 'email']);
      const { rows } = await this.pool.query(statement.text, statement.values);
      if (!rows[0]) {
        throw new NotFoundError('Student not found');
      }
      return rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw mapUniqueError(error) || error;
    }
  }

  async deleteStudent(id) {
    const { rows } = await this.pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
    return rows[0] || null;
  }

  async createCourse(data) {
    const { rows } = await this.pool.query(
      'INSERT INTO courses (course_name, instructor, credit_hours) VALUES ($1, $2, $3) RETURNING *',
      [data.course_name, data.instructor, data.credit_hours]
    );
    return rows[0];
  }

  async listCourses() {
    const { rows } = await this.pool.query('SELECT * FROM courses ORDER BY id');
    return rows;
  }

  async getCourseById(id) {
    const { rows } = await this.pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async updateCourse(id, data) {
    const statement = buildUpdateStatement('courses', 'id', id, data, ['course_name', 'instructor', 'credit_hours']);
    const { rows } = await this.pool.query(statement.text, statement.values);

    if (!rows[0]) {
      throw new NotFoundError('Course not found');
    }

    return rows[0];
  }

  async deleteCourse(id) {
    const { rows } = await this.pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
    return rows[0] || null;
  }

  async createEnrollment(data) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO enrollments (
          student_id,
          course_id,
          assignment1,
          assignment2,
          midterm_exam,
          final_exam,
          final_project
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          data.student_id,
          data.course_id,
          data.assignment1,
          data.assignment2,
          data.midterm_exam,
          data.final_exam,
          data.final_project
        ]
      );
      return rows[0];
    } catch (error) {
      throw mapUniqueError(error) || error;
    }
  }

  async getEnrollmentById(id) {
    const { rows } = await this.pool.query('SELECT * FROM enrollments WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async updateEnrollment(id, data) {
    const statement = buildUpdateStatement(
      'enrollments',
      'id',
      id,
      data,
      ['assignment1', 'assignment2', 'midterm_exam', 'final_exam', 'final_project']
    );
    const { rows } = await this.pool.query(statement.text, statement.values);

    if (!rows[0]) {
      throw new NotFoundError('Enrollment not found');
    }

    return rows[0];
  }

  async listCourseGrades(courseId) {
    const { rows } = await this.pool.query(
      `SELECT
        e.*,
        s.name AS student_name,
        s.email AS student_email,
        c.course_name,
        c.instructor,
        c.credit_hours
      FROM enrollments e
      INNER JOIN students s ON s.id = e.student_id
      INNER JOIN courses c ON c.id = e.course_id
      WHERE e.course_id = $1
      ORDER BY e.id`,
      [courseId]
    );

    return rows;
  }

  async listStudentEnrollments(studentId) {
    const { rows } = await this.pool.query(
      `SELECT
        e.*,
        s.name AS student_name,
        s.email AS student_email,
        c.course_name,
        c.instructor,
        c.credit_hours
      FROM enrollments e
      INNER JOIN students s ON s.id = e.student_id
      INNER JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = $1
      ORDER BY e.id`,
      [studentId]
    );

    return rows;
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = {
  PostgresRepository
};
