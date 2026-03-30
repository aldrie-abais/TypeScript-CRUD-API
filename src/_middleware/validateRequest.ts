// src/_middleware/validateRequest.ts

import type { Request, NextFunction } from 'express';
import Joi from 'joi';

export function validateRequest(
    req: Request,
    next: NextFunction,
    schema: Joi.ObjectSchema
): void {
    const options = {
        abortEarly: false, // Include all errors, not just the first one
        allowUnknown: true, // Ignore unknown props
        stripUnknown: true, // Remove unknown props
    };

    const { error, value } = schema.validate(req.body, options);

    if (error) {
        next(`Validation error: ${error.details.map((d) => d.message).join(', ')}`);
    } else {
        req.body = value;
        next();
    }
}