import { describe, expect, it } from 'vitest';
import { ValidationEngine } from './validation-engine';
import { ICriteriaValidationConfig } from '../../models';

describe('ValidationEngine', () => {
    const engine = new ValidationEngine();
    const mockTranslations = {
        'errors.exists': 'Field must exist',
        'errors.number': 'Must be a number',
        'errors.between': 'Must be between {{min}} and {{max}}',
    };

    describe('validateRule', () => {
        describe('exists rule', () => {
            it('should return true for non-null values', () => {
                expect(engine.validateRule('test', { type: 'exists' })).toBe(true);
                expect(engine.validateRule(0, { type: 'exists' })).toBe(true);
                expect(engine.validateRule(false, { type: 'exists' })).toBe(true);
            });

            it('should return false for null or undefined values', () => {
                expect(engine.validateRule(null, { type: 'exists' })).toBe(false);
                expect(engine.validateRule(undefined, { type: 'exists' })).toBe(false);
            });
        });

        describe('in rule', () => {
            const rule = { type: 'in' as const, values: [1, 2, 3] };

            it('should return true when value is in the allowed list', () => {
                expect(engine.validateRule(1, rule)).toBe(true);
                expect(engine.validateRule(2, rule)).toBe(true);
            });

            it('should return false when value is not in the allowed list', () => {
                expect(engine.validateRule(4, rule)).toBe(false);
                expect(engine.validateRule('1', rule)).toBe(false);
            });
        });

        describe('between rule', () => {
            const rule = { type: 'between' as const, min: 1, max: 10 };

            it('should return true for numbers within range', () => {
                expect(engine.validateRule(5, rule)).toBe(true);
                expect(engine.validateRule(1, rule)).toBe(true);
                expect(engine.validateRule(10, rule)).toBe(true);
            });

            it('should return false for numbers outside range', () => {
                expect(engine.validateRule(0, rule)).toBe(false);
                expect(engine.validateRule(11, rule)).toBe(false);
            });

            it('should return false for non-numbers', () => {
                expect(engine.validateRule('5', rule)).toBe(false);
                expect(engine.validateRule(null, rule)).toBe(false);
            });
        });

        describe('type validation rules', () => {
            it('should validate number type', () => {
                expect(engine.validateRule(123, { type: 'number' })).toBe(true);
                expect(engine.validateRule('123', { type: 'number' })).toBe(false);
                expect(engine.validateRule(Number.NaN, { type: 'number' })).toBe(false);
            });

            it('should validate array type', () => {
                expect(engine.validateRule([], { type: 'array' })).toBe(true);
                expect(engine.validateRule([1, 2, 3], { type: 'array' })).toBe(true);
                expect(engine.validateRule({}, { type: 'array' })).toBe(false);
            });

            it('should validate string type', () => {
                expect(engine.validateRule('test', { type: 'string' })).toBe(true);
                expect(engine.validateRule('', { type: 'string' })).toBe(true);
                expect(engine.validateRule(123, { type: 'string' })).toBe(false);
            });

            it('should validate boolean type', () => {
                expect(engine.validateRule(true, { type: 'boolean' })).toBe(true);
                expect(engine.validateRule(false, { type: 'boolean' })).toBe(true);
                expect(engine.validateRule('true', { type: 'boolean' })).toBe(false);
            });
        });

        describe('comparison rules', () => {
            it('should validate greater than', () => {
                expect(engine.validateRule(5, { type: 'gt', value: 3 })).toBe(true);
                expect(engine.validateRule(3, { type: 'gt', value: 3 })).toBe(false);
            });

            it('should validate greater than or equal', () => {
                expect(engine.validateRule(5, { type: 'gte', value: 3 })).toBe(true);
                expect(engine.validateRule(3, { type: 'gte', value: 3 })).toBe(true);
                expect(engine.validateRule(2, { type: 'gte', value: 3 })).toBe(false);
            });

            it('should validate less than', () => {
                expect(engine.validateRule(2, { type: 'lt', value: 3 })).toBe(true);
                expect(engine.validateRule(3, { type: 'lt', value: 3 })).toBe(false);
            });

            it('should validate less than or equal', () => {
                expect(engine.validateRule(2, { type: 'lte', value: 3 })).toBe(true);
                expect(engine.validateRule(3, { type: 'lte', value: 3 })).toBe(true);
                expect(engine.validateRule(4, { type: 'lte', value: 3 })).toBe(false);
            });
        });

        describe('custom validation rule', () => {
            const isEven = (value: number) => value % 2 === 0;
            const rule = { type: 'custom' as const, validator: isEven };

            it('should use custom validator function', () => {
                expect(engine.validateRule(2, rule)).toBe(true);
                expect(engine.validateRule(3, rule)).toBe(false);
            });
        });
    });

    describe('validateCriteria', () => {
        const config: ICriteriaValidationConfig = {
            id: 'age',
            rules: [
                { type: 'number' },
                { type: 'between', min: 0, max: 120 }
            ]
        };

        it('should validate data against criteria config', () => {
            const result = engine.validateCriteria({ age: 25 }, config, mockTranslations);
            expect(result.success).toBe(true);
            expect(result.errors).toBeNull();
        });

        it('should return errors for invalid data', () => {
            const result = engine.validateCriteria({ age: -1 }, config, mockTranslations);
            expect(result.success).toBe(false);
            expect(result.errors).toBeTruthy();
        });

        it('should handle computed values', () => {
            const computedConfig: ICriteriaValidationConfig = {
                id: 'total',
                computeValue: (data) => data.a + data.b,
                rules: [
                    { type: 'number' },
                    { type: 'gte', value: 0 }
                ]
            };

            const result = engine.validateCriteria({ a: 10, b: 20 }, computedConfig, mockTranslations);
            expect(result.success).toBe(true);
            expect(result.errors).toBeNull();
        });

        it('should handle missing rules', () => {
            const configWithoutRules: ICriteriaValidationConfig = {
                id: 'test'
            };

            const result = engine.validateCriteria({ test: 'value' }, configWithoutRules, mockTranslations);
            expect(result.success).toBe(true);
            expect(result.errors).toBeNull();
        });
    });
});
