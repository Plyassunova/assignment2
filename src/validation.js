const { ValidationError } = require('./errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

function parseGrade(value, fieldName) {
  if (value === undefined || value === null) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new ValidationError(`${fieldName} must be between 0 and 100`);
  }

  return Math.round(parsed * 100) / 100;
}

function validateStudentCreate(body) {
  if (!isNonEmptyString(body.name)) {
    throw new ValidationError('Student name is required');
  }

  if (!isNonEmptyString(body.email)) {
    throw new ValidationError('Student email is required');
  }

  if (!EMAIL_PATTERN.test(body.email.trim())) {
    throw new ValidationError('Student email is invalid');
  }
}

function validateStudentUpdate(body) {
  if (!isNonEmptyString(body.name) && !isNonEmptyString(body.email)) {
    throw new ValidationError('At least one student field must be provided');
  }

  if (body.email !== undefined && !EMAIL_PATTERN.test(String(body.email).trim())) {
    throw new ValidationError('Student email is invalid');
  }
}

function validateCourseCreate(body) {
  if (!isNonEmptyString(body.course_name)) {
    throw new ValidationError('Course name is required');
  }

  if (!isNonEmptyString(body.instructor)) {
    throw new ValidationError('Course instructor is required');
  }

  if (body.credit_hours === undefined || body.credit_hours === null || String(body.credit_hours).trim() === '') {
    throw new ValidationError('Credit hours are required');
  }

  const creditHours = Number(body.credit_hours);

  if (!Number.isInteger(creditHours) || creditHours <= 0) {
    throw new ValidationError('Credit hours must be a positive integer');
  }
}

function validateCourseUpdate(body) {
  const hasCourseName = isNonEmptyString(body.course_name);
  const hasInstructor = isNonEmptyString(body.instructor);
  const hasCreditHours = body.credit_hours !== undefined;

  if (!hasCourseName && !hasInstructor && !hasCreditHours) {
    throw new ValidationError('At least one course field must be provided');
  }

  if (hasCreditHours) {
    const creditHours = Number(body.credit_hours);

    if (!Number.isInteger(creditHours) || creditHours <= 0) {
      throw new ValidationError('Credit hours must be a positive integer');
    }
  }
}

function validateEnrollmentCreate(body) {
  parsePositiveInteger(body.student_id, 'student_id');
  parsePositiveInteger(body.course_id, 'course_id');
  parseGrade(body.assignment1, 'assignment1');
  parseGrade(body.assignment2, 'assignment2');
  parseGrade(body.midterm_exam, 'midterm_exam');
  parseGrade(body.final_exam, 'final_exam');
  parseGrade(body.final_project, 'final_project');
}

function validateEnrollmentUpdate(body) {
  const fields = ['assignment1', 'assignment2', 'midterm_exam', 'final_exam', 'final_project'];
  const hasAnyGrade = fields.some((field) => body[field] !== undefined);

  if (!hasAnyGrade) {
    throw new ValidationError('At least one grade field must be provided');
  }

  fields.forEach((field) => {
    if (body[field] !== undefined) {
      parseGrade(body[field], field);
    }
  });
}

function normalizeStudentPayload(body) {
  return {
    name: String(body.name).trim(),
    email: String(body.email).trim().toLowerCase()
  };
}

function normalizeStudentUpdatePayload(body) {
  const payload = {};

  if (body.name !== undefined) {
    payload.name = String(body.name).trim();
  }

  if (body.email !== undefined) {
    payload.email = String(body.email).trim().toLowerCase();
  }

  return payload;
}

function normalizeCoursePayload(body) {
  return {
    course_name: String(body.course_name).trim(),
    instructor: String(body.instructor).trim(),
    credit_hours: Number(body.credit_hours)
  };
}

function normalizeCourseUpdatePayload(body) {
  const payload = {};

  if (body.course_name !== undefined) {
    payload.course_name = String(body.course_name).trim();
  }

  if (body.instructor !== undefined) {
    payload.instructor = String(body.instructor).trim();
  }

  if (body.credit_hours !== undefined) {
    payload.credit_hours = Number(body.credit_hours);
  }

  return payload;
}

function normalizeEnrollmentPayload(body) {
  return {
    student_id: parsePositiveInteger(body.student_id, 'student_id'),
    course_id: parsePositiveInteger(body.course_id, 'course_id'),
    assignment1: parseGrade(body.assignment1, 'assignment1'),
    assignment2: parseGrade(body.assignment2, 'assignment2'),
    midterm_exam: parseGrade(body.midterm_exam, 'midterm_exam'),
    final_exam: parseGrade(body.final_exam, 'final_exam'),
    final_project: parseGrade(body.final_project, 'final_project')
  };
}

function normalizeEnrollmentUpdatePayload(body) {
  const payload = {};
  const fields = ['assignment1', 'assignment2', 'midterm_exam', 'final_exam', 'final_project'];

  fields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = parseGrade(body[field], field);
    }
  });

  return payload;
}

module.exports = {
  parsePositiveInteger,
  parseGrade,
  validateStudentCreate,
  validateStudentUpdate,
  validateCourseCreate,
  validateCourseUpdate,
  validateEnrollmentCreate,
  validateEnrollmentUpdate,
  normalizeStudentPayload,
  normalizeStudentUpdatePayload,
  normalizeCoursePayload,
  normalizeCourseUpdatePayload,
  normalizeEnrollmentPayload,
  normalizeEnrollmentUpdatePayload
};
