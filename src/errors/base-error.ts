export class BaseError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: Record<string, unknown>
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends BaseError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', details);
    }
}

export class ComputationError extends BaseError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'COMPUTATION_ERROR', details);
    }
}

export class ConfigurationError extends BaseError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'CONFIGURATION_ERROR', details);
    }
}
