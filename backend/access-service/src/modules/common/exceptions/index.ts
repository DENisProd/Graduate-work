import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
  constructor(resourceName: string, fieldName: string, fieldValue: unknown) {
    super(
      `${resourceName} не найден с ${fieldName}: '${fieldValue}'`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resourceName: string, fieldName: string, fieldValue: unknown) {
    super(
      `${resourceName} уже существует с ${fieldName}: '${fieldValue}'`,
      HttpStatus.CONFLICT,
    );
  }
}
