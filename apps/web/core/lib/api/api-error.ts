export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly fieldErrors: FieldError[] = []
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isValidation() {
    return this.statusCode === 422;
  }

  get isUnauthorized() {
    return this.statusCode === 401;
  }

  get isConflict() {
    return this.statusCode === 409;
  }

  get isForbidden() {
    return this.statusCode === 403;
  }

  get isNotFound() {
    return this.statusCode === 404;
  }

  get isNetworkError() {
    return this.statusCode === 0;
  }
}
