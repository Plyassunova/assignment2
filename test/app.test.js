const request = require('supertest');
const { createApp } = require('../src/app');

function createStudentPayload(overrides = {}) {
  return {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    ...overrides
  };
}

function createCoursePayload(overrides = {}) {
  return {
    course_name: 'Database Systems',
    instructor: 'Dr. Smith',
    credit_hours: 3,
    ...overrides
  };
}

function createEnrollmentPayload(overrides = {}) {
  return {
    assignment1: 80,
    assignment2: 90,
    midterm_exam: 70,
    final_exam: 85,
    final_project: 100,
    ...overrides
  };
}

function createRepositoryFixture() {
  let studentId = 1;
  let courseId = 1;
  let enrollmentId = 1;
  const students = [];
  const courses = [];
  const enrollments = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function withRelations(enrollment) {
    const student = students.find((item) => item.id === enrollment.student_id);
    const course = courses.find((item) => item.id === enrollment.course_id);

    return {
      ...enrollment,
      student_name: student ? student.name : null,
      student_email: student ? student.email : null,
      course_name: course ? course.course_name : null,
      instructor: course ? course.instructor : null,
      credit_hours: course ? course.credit_hours : null
    };
  }

  return {
    async createStudent(data) {
      if (students.some((student) => student.email === data.email)) {
        throw new Error('Student email must be unique');
      }

      const student = {
        id: studentId++,
        name: data.name,
        email: data.email,
        registration_time: new Date().toISOString()
      };

      students.push(student);
      return clone(student);
    },

    async listStudents() {
      return clone(students);
    },

    async getStudentById(id) {
      const student = students.find((item) => item.id === id);
      return student ? clone(student) : null;
    },

    async updateStudent(id, data) {
      const student = students.find((item) => item.id === id);

      if (!student) {
        return null;
      }

      Object.assign(student, data);
      return clone(student);
    },

    async deleteStudent(id) {
      const index = students.findIndex((item) => item.id === id);

      if (index === -1) {
        return null;
      }

      const [removed] = students.splice(index, 1);
      return clone(removed);
    },

    async createCourse(data) {
      const course = {
        id: courseId++,
        course_name: data.course_name,
        instructor: data.instructor,
        credit_hours: data.credit_hours
      };

      courses.push(course);
      return clone(course);
    },

    async listCourses() {
      return clone(courses);
    },

    async getCourseById(id) {
      const course = courses.find((item) => item.id === id);
      return course ? clone(course) : null;
    },

    async updateCourse(id, data) {
      const course = courses.find((item) => item.id === id);

      if (!course) {
        return null;
      }

      Object.assign(course, data);
      return clone(course);
    },

    async deleteCourse(id) {
      const index = courses.findIndex((item) => item.id === id);

      if (index === -1) {
        return null;
      }

      const [removed] = courses.splice(index, 1);
      return clone(removed);
    },

    async createEnrollment(data) {
      const enrollment = {
        id: enrollmentId++,
        student_id: data.student_id,
        course_id: data.course_id,
        assignment1: data.assignment1,
        assignment2: data.assignment2,
        midterm_exam: data.midterm_exam,
        final_exam: data.final_exam,
        final_project: data.final_project
      };

      enrollments.push(enrollment);
      return clone(enrollment);
    },

    async getEnrollmentById(id) {
      const enrollment = enrollments.find((item) => item.id === id);
      return enrollment ? clone(enrollment) : null;
    },

    async updateEnrollment(id, data) {
      const enrollment = enrollments.find((item) => item.id === id);

      if (!enrollment) {
        return null;
      }

      Object.assign(enrollment, data);
      return clone(enrollment);
    },

    async listCourseGrades(courseIdValue) {
      return clone(enrollments.filter((enrollment) => enrollment.course_id === courseIdValue).map(withRelations));
    },

    async listStudentEnrollments(studentIdValue) {
      return clone(enrollments.filter((enrollment) => enrollment.student_id === studentIdValue).map(withRelations));
    }
  };
}

describe('student and course management API', () => {
  let repository;
  let app;

  beforeEach(async () => {
    repository = createRepositoryFixture();
    app = createApp(repository);
  });

  async function seedStudent(overrides = {}) {
    const response = await request(app).post('/students').send(createStudentPayload(overrides));
    return response.body.data;
  }

  async function seedCourse(overrides = {}) {
    const response = await request(app).post('/courses').send(createCoursePayload(overrides));
    return response.body.data;
  }

  test('creates a student', async () => {
    const response = await request(app).post('/students').send(createStudentPayload());

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      id: 1,
      name: 'Alice Johnson',
      email: 'alice@example.com'
    });
  });

  test('lists students', async () => {
    await seedStudent();
    await seedStudent({ name: 'Bob Taylor', email: 'bob@example.com' });

    const response = await request(app).get('/students');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  test('retrieves a student by id', async () => {
    const createdStudent = await seedStudent();
    const response = await request(app).get(`/students/${createdStudent.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Alice Johnson');
  });

  test('updates a student', async () => {
    const createdStudent = await seedStudent();
    const response = await request(app)
      .put(`/students/${createdStudent.id}`)
      .send({ name: 'Alice Updated' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Alice Updated');
  });

  test('deletes a student', async () => {
    const createdStudent = await seedStudent();
    const response = await request(app).delete(`/students/${createdStudent.id}`);

    expect(response.status).toBe(204);

    const fetchResponse = await request(app).get(`/students/${createdStudent.id}`);
    expect(fetchResponse.status).toBe(404);
  });

  test('rejects a student without email', async () => {
    const response = await request(app).post('/students').send({ name: 'Missing Email' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Student email is required');
  });

  test('creates a course', async () => {
    const response = await request(app).post('/courses').send(createCoursePayload());

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      id: 1,
      course_name: 'Database Systems',
      instructor: 'Dr. Smith',
      credit_hours: 3
    });
  });

  test('lists courses', async () => {
    await seedCourse();
    await seedCourse({ course_name: 'Algorithms' });

    const response = await request(app).get('/courses');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  test('retrieves a course by id', async () => {
    const createdCourse = await seedCourse();
    const response = await request(app).get(`/courses/${createdCourse.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.course_name).toBe('Database Systems');
  });

  test('updates a course', async () => {
    const createdCourse = await seedCourse();
    const response = await request(app)
      .put(`/courses/${createdCourse.id}`)
      .send({ instructor: 'Dr. Taylor' });

    expect(response.status).toBe(200);
    expect(response.body.data.instructor).toBe('Dr. Taylor');
  });

  test('rejects invalid credit hours', async () => {
    const response = await request(app).post('/courses').send(createCoursePayload({ credit_hours: 0 }));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Credit hours must be a positive integer');
  });

  test('creates an enrollment and calculates the final grade', async () => {
    const student = await seedStudent();
    const course = await seedCourse();

    const response = await request(app)
      .post('/enrollments')
      .send({
        student_id: student.id,
        course_id: course.id,
        ...createEnrollmentPayload()
      });

    expect(response.status).toBe(201);
    expect(response.body.data.final_grade).toBe(82);
  });

  test('retrieves an enrollment by id with the final grade', async () => {
    const student = await seedStudent();
    const course = await seedCourse();
    const created = await request(app)
      .post('/enrollments')
      .send({
        student_id: student.id,
        course_id: course.id,
        ...createEnrollmentPayload()
      });

    const response = await request(app).get(`/enrollments/${created.body.data.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.final_grade).toBe(82);
  });

  test('updates enrollment grades and recalculates the final grade', async () => {
    const student = await seedStudent();
    const course = await seedCourse();
    const created = await request(app)
      .post('/enrollments')
      .send({
        student_id: student.id,
        course_id: course.id,
        assignment1: 50,
        assignment2: 50,
        midterm_exam: 50,
        final_exam: 50,
        final_project: 50
      });

    const response = await request(app)
      .put(`/enrollments/${created.body.data.id}`)
      .send({ final_exam: 100, final_project: 100 });

    expect(response.status).toBe(200);
    expect(response.body.data.final_grade).toBe(70);
  });

  test('returns course grades with student and course details', async () => {
    const student = await seedStudent();
    const course = await seedCourse();

    await request(app)
      .post('/enrollments')
      .send({
        student_id: student.id,
        course_id: course.id,
        ...createEnrollmentPayload()
      });

    const response = await request(app).get(`/courses/${course.id}/grades`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      student_name: 'Alice Johnson',
      course_name: 'Database Systems',
      final_grade: 82
    });
  });

  test('returns student GPA summary', async () => {
    const student = await seedStudent();
    const course = await seedCourse();

    await request(app)
      .post('/enrollments')
      .send({
        student_id: student.id,
        course_id: course.id,
        ...createEnrollmentPayload()
      });

    const response = await request(app).get(`/students/${student.id}/gpa`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      average_final_grade: 82,
      gpa: 3.28,
      courses_completed: 1
    });
  });

  test('rejects grades outside the 0 to 100 range', async () => {
    const student = await seedStudent();
    const course = await seedCourse();

    const response = await request(app)
      .post('/enrollments')
      .send({
        student_id: student.id,
        course_id: course.id,
        ...createEnrollmentPayload({ assignment1: 101 })
      });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('assignment1 must be between 0 and 100');
  });

  test('rejects enrollment for a missing course', async () => {
    const student = await seedStudent();

    const response = await request(app)
      .post('/enrollments')
      .send({
        student_id: student.id,
        course_id: 999,
        ...createEnrollmentPayload()
      });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Course not found');
  });

  test('rejects enrollment for a missing student', async () => {
    const course = await seedCourse();

    const response = await request(app)
      .post('/enrollments')
      .send({
        student_id: 999,
        course_id: course.id,
        ...createEnrollmentPayload()
      });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Student not found');
  });
});
