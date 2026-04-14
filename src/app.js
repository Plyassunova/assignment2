const express = require('express');
const { createStudentCourseController } = require('./controllers/studentCourseController');

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function createApp(repository) {
  const controller = createStudentCourseController(repository);
  const app = express();

  app.use(express.json());

  app.get('/health', asyncHandler(controller.health));

  app.post('/students', asyncHandler(controller.createStudent));
  app.get('/students', asyncHandler(controller.listStudents));
  app.get('/students/:studentId', asyncHandler(controller.getStudentById));
  app.put('/students/:studentId', asyncHandler(controller.updateStudent));
  app.delete('/students/:studentId', asyncHandler(controller.deleteStudent));
  app.get('/students/:studentId/enrollments', asyncHandler(controller.getStudentEnrollments));
  app.get('/students/:studentId/gpa', asyncHandler(controller.getStudentGpa));

  app.post('/courses', asyncHandler(controller.createCourse));
  app.get('/courses', asyncHandler(controller.listCourses));
  app.get('/courses/:courseId', asyncHandler(controller.getCourseById));
  app.put('/courses/:courseId', asyncHandler(controller.updateCourse));
  app.delete('/courses/:courseId', asyncHandler(controller.deleteCourse));
  app.get('/courses/:courseId/grades', asyncHandler(controller.getCourseGrades));

  app.post('/enrollments', asyncHandler(controller.createEnrollment));
  app.get('/enrollments/:enrollmentId', asyncHandler(controller.getEnrollmentById));
  app.put('/enrollments/:enrollmentId', asyncHandler(controller.updateEnrollment));

  app.use(controller.errorHandler);

  return app;
}

module.exports = {
  createApp
};
