const WEIGHTS = {
  assignment1: 0.15,
  assignment2: 0.15,
  midterm_exam: 0.3,
  final_exam: 0.3,
  final_project: 0.1
};

function hasMissingGrade(enrollment) {
  return Object.keys(WEIGHTS).some((field) => enrollment[field] === undefined || enrollment[field] === null);
}

function calculateFinalGrade(enrollment) {
  if (hasMissingGrade(enrollment)) {
    return null;
  }

  const total = Object.entries(WEIGHTS).reduce((sum, [field, weight]) => {
    return sum + Number(enrollment[field]) * weight;
  }, 0);

  return Math.round(total * 100) / 100;
}

function calculateStudentSummary(enrollments) {
  const gradedEnrollments = enrollments
    .map((enrollment) => calculateFinalGrade(enrollment))
    .filter((grade) => grade !== null);

  if (gradedEnrollments.length === 0) {
    return {
      average_final_grade: null,
      gpa: null,
      courses_completed: 0
    };
  }

  const averageFinalGrade = gradedEnrollments.reduce((sum, grade) => sum + grade, 0) / gradedEnrollments.length;
  const averageRounded = Math.round(averageFinalGrade * 100) / 100;

  return {
    average_final_grade: averageRounded,
    gpa: Math.round((averageRounded / 25) * 100) / 100,
    courses_completed: gradedEnrollments.length
  };
}

module.exports = {
  WEIGHTS,
  calculateFinalGrade,
  calculateStudentSummary
};
