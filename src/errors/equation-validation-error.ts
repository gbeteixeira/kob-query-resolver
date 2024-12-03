export class EquationValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EquationValidationError';
    }
}