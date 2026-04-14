class AppError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code || this.name;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(404, message, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(409, message, 'CONFLICT');
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError
};
