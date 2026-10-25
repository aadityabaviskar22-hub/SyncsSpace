import { Request, Response, NextFunction } from 'express';
import { validationResult, FieldValidationError } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => {
      const fieldErr = err as FieldValidationError;
      return {
        field: fieldErr.path || 'unknown',
        message: err.msg,
        value: fieldErr.value,
      };
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed for request input.',
      errors: formattedErrors,
    });
    return;
  }
  next();
};
