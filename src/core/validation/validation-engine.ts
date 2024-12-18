import { ValidationError } from '../../errors/base-error';
import { ICriteriaValidationConfig, IEquationData, IFieldValidationResult, SimpleValidationRule } from '../../models';

export class ValidationEngine {
    private validateExists(value: unknown): boolean {
        return value !== undefined && value !== null;
    }

    private validateIn(value: unknown, allowedValues: unknown[]): boolean {
        return allowedValues.includes(value);
    }

    private validateBetween(value: number, min: number, max: number): boolean {
        return value >= min && value <= max;
    }

    private validateIncludes(value: unknown[], requiredValues: unknown[]): boolean {
        return requiredValues.every(v => value.includes(v));
    }

    private validateType(value: unknown, type: 'number' | 'array' | 'string' | 'boolean'): boolean {
        switch (type) {
            case 'number':
                return typeof value === 'number' && !Number.isNaN(value);
            case 'array':
                return Array.isArray(value);
            case 'string':
                return typeof value === 'string';
            case 'boolean':
                return typeof value === 'boolean';
            default:
                return false;
        }
    }

    private validateComparison(value: number, compareValue: number, operator: 'gt' | 'gte' | 'lt' | 'lte'): boolean {
        switch (operator) {
            case 'gt':
                return value > compareValue;
            case 'gte':
                return value >= compareValue;
            case 'lt':
                return value < compareValue;
            case 'lte':
                return value <= compareValue;
            default:
                return false;
        }
    }

    public validateRule(value: unknown, rule: SimpleValidationRule): boolean {
        switch (rule.type) {
            case 'exists':
                return this.validateExists(value);
            case 'in':
                return this.validateIn(value, rule.values);
            case 'between':
                return typeof value === 'number' && this.validateBetween(value, rule.min, rule.max);
            case 'includes':
                return Array.isArray(value) && this.validateIncludes(value, rule.values);
            case 'number':
            case 'array':
            case 'string':
            case 'boolean':
                return this.validateType(value, rule.type);
            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte':
                return typeof value === 'number' && this.validateComparison(value, rule.value, rule.type);
            case 'eq':
                return value === rule.value;
            case 'custom':
                return rule.validator(value);
            default:
                throw new ValidationError('Invalid rule type');
        }
    }

    private getErrorKey(rule: SimpleValidationRule): string {
        switch (rule.type) {
            case 'exists':
                return 'errors.criteriaExists';
            case 'in':
                return 'errors.criteriaIn';
            case 'between':
                return 'errors.betweenRange';
            case 'includes':
                return 'errors.criteriaIncludes';
            case 'number':
                return 'errors.numberType';
            case 'array':
                return 'errors.criteriaArray';
            case 'string':
                return 'errors.stringType';
            case 'boolean':
                return 'errors.booleanType';
            case 'gt':
                return 'errors.greaterThan';
            case 'gte':
                return 'errors.greaterThanEqual';
            case 'lt':
                return 'errors.lessThan';
            case 'lte':
                return 'errors.lessThanEqual';
            case 'eq':
                return 'errors.equalTo';
            case 'custom':
                return 'errors.customValidationFailed';
            default:
                return 'errors.unknown';
        }
    }

    public validateCriteria(
        data: IEquationData,
        config: ICriteriaValidationConfig,
        translations: Record<string, string>
    ): IFieldValidationResult {
        const value = config.computeValue ? config.computeValue(data) : data[config.id];
        const errors: { [key: string]: string } = {};

        if (!config.rules || config.rules.length === 0) {
            return {
                criteria: config.id,
                success: true,
                errors: null
            };
        }

        for (const rule of config.rules) {
            try {
                if (!this.validateRule(value, rule)) {
                    const errorKey = this.getErrorKey(rule);
                    errors[rule.type] = translations[errorKey] || `Validation failed for rule ${rule.type}`;
                }
            } catch (error) {
                errors[rule.type] = error instanceof Error ? error.message : 'Unknown validation error';
            }
        }

        return {
            criteria: config.id,
            success: Object.keys(errors).length === 0,
            errors: Object.keys(errors).length > 0 ? errors : null
        };
    }
}
