const {
  normalizeCoursePayload,
  normalizeCourseUpdatePayload,
  normalizeEnrollmentPayload,
  normalizeEnrollmentUpdatePayload,
  normalizeStudentPayload,
  normalizeStudentUpdatePayload,
  parsePositiveInteger,
  validateCourseCreate,
  validateCourseUpdate,
  validateEnrollmentCreate,
  validateEnrollmentUpdate,
  validateStudentCreate,
  validateStudentUpdate
} = require('../validation');
const { calculateFinalGrade, calculateStudentSummary } = require('../services/gradeCalculator');
const { ConflictError, NotFoundError, ValidationError } = require('../errors');

function decorateEnrollment(enrollment) {
  return {
    ...enrollment,
    final_grade: calculateFinalGrade(enrollment)
  };
}

async function ensureStudentExists(repository, studentId) {
  const student = await repository.getStudentById(studentId);

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  return student;
}

async function ensureCourseExists(repository, courseId) {
  const course = await repository.getCourseById(courseId);

  if (!course) {
    throw new NotFoundError('Course not found');
  }

  return course;
}

function createStudentCourseController(repository) {
  return {
    async health(request, response) {
      response.json({ status: 'ok' });
    },

    async createStudent(request, response) {
      validateStudentCreate(request.body);
      const student = await repository.createStudent(normalizeStudentPayload(request.body));
      response.status(201).json({ data: student });
    },

    async listStudents(request, response) {
      const students = await repository.listStudents();
      response.json({ data: students });
    },

    async getStudentById(request, response) {
      const studentId = parsePositiveInteger(request.params.studentId, 'student_id');
      const student = await repository.getStudentById(studentId);

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      response.json({ data: student });
    },

    async updateStudent(request, response) {
      const studentId = parsePositiveInteger(request.params.studentId, 'student_id');
      validateStudentUpdate(request.body);
      const student = await repository.updateStudent(studentId, normalizeStudentUpdatePayload(request.body));
      response.json({ data: student });
    },

    async deleteStudent(request, response) {
      const studentId = parsePositiveInteger(request.params.studentId, 'student_id');
      const deletedStudent = await repository.deleteStudent(studentId);

      if (!deletedStudent) {
        throw new NotFoundError('Student not found');
      }

      response.status(204).send();
    },

    async getStudentEnrollments(request, response) {
      const studentId = parsePositiveInteger(request.params.studentId, 'student_id');
      await ensureStudentExists(repository, studentId);
      const enrollments = await repository.listStudentEnrollments(studentId);
      response.json({ data: enrollments.map(decorateEnrollment), summary: calculateStudentSummary(enrollments) });
    },

    async getStudentGpa(request, response) {
      const studentId = parsePositiveInteger(request.params.studentId, 'student_id');
      await ensureStudentExists(repository, studentId);
      const enrollments = await repository.listStudentEnrollments(studentId);
      response.json({ data: calculateStudentSummary(enrollments) });
    },

    async createCourse(request, response) {
      validateCourseCreate(request.body);
      const course = await repository.createCourse(normalizeCoursePayload(request.body));
      response.status(201).json({ data: course });
    },

    async listCourses(request, response) {
      const courses = await repository.listCourses();
      response.json({ data: courses });
    },

    async getCourseById(request, response) {
      const courseId = parsePositiveInteger(request.params.courseId, 'course_id');
      const course = await repository.getCourseById(courseId);

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      response.json({ data: course });
    },

    async updateCourse(request, response) {
      const courseId = parsePositiveInteger(request.params.courseId, 'course_id');
      validateCourseUpdate(request.body);
      const course = await repository.updateCourse(courseId, normalizeCourseUpdatePayload(request.body));
      response.json({ data: course });
    },

    async deleteCourse(request, response) {
      const courseId = parsePositiveInteger(request.params.courseId, 'course_id');
      const deletedCourse = await repository.deleteCourse(courseId);

      if (!deletedCourse) {
        throw new NotFoundError('Course not found');
      }

      response.status(204).send();
    },

    async getCourseGrades(request, response) {
      const courseId = parsePositiveInteger(request.params.courseId, 'course_id');
      await ensureCourseExists(repository, courseId);
      const grades = await repository.listCourseGrades(courseId);
      response.json({ data: grades.map(decorateEnrollment) });
    },

    async createEnrollment(request, response) {
      validateEnrollmentCreate(request.body);
      const payload = normalizeEnrollmentPayload(request.body);
      await ensureStudentExists(repository, payload.student_id);
      await ensureCourseExists(repository, payload.course_id);
      const enrollment = await repository.createEnrollment(payload);
      response.status(201).json({ data: decorateEnrollment(enrollment) });
    },

    async getEnrollmentById(request, response) {
      const enrollmentId = parsePositiveInteger(request.params.enrollmentId, 'enrollment_id');
      const enrollment = await repository.getEnrollmentById(enrollmentId);

      if (!enrollment) {
        throw new NotFoundError('Enrollment not found');
      }

      response.json({ data: decorateEnrollment(enrollment) });
    },

    async updateEnrollment(request, response) {
      const enrollmentId = parsePositiveInteger(request.params.enrollmentId, 'enrollment_id');
      validateEnrollmentUpdate(request.body);
      const enrollment = await repository.updateEnrollment(enrollmentId, normalizeEnrollmentUpdatePayload(request.body));
      response.json({ data: decorateEnrollment(enrollment) });
    },

    errorHandler(error, request, response, next) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
        response.status(error.statusCode).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      if (error.code === '23505') {
        response.status(409).json({
          error: {
            code: 'CONFLICT',
            message: 'Resource already exists'
          }
        });
        return;
      }

      response.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error'
        }
      });
    }
  };
}

module.exports = {
  createStudentCourseController
};