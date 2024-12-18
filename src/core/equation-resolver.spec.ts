import { describe, expect, it } from 'vitest';
import { EquationResolver } from './equation-resolver';
import { ICriteriaValidationConfig } from '../models';
import { ConfigurationError } from '../errors/base-error';

describe('EquationResolver', () => {
    describe('Basic Validation', () => {
        const basicConfig: ICriteriaValidationConfig[] = [
            {
                id: 'age',
                rules: [
                    { type: 'number' },
                    { type: 'between', min: 0, max: 120 }
                ]
            },
            {
                id: 'name',
                rules: [
                    { type: 'string' },
                    { type: 'custom', validator: (value: string) => value.length >= 2 }
                ]
            }
        ];

        it('should validate valid data successfully', () => {
            const resolver = new EquationResolver(basicConfig);
            const result = resolver.validateEquation({
                age: 25,
                name: 'John'
            });

            expect(result.overallSuccess).toBe(true);
            expect(result.successFields).toContain('age');
            expect(result.successFields).toContain('name');
            expect(result.failedFields).toHaveLength(0);
        });

        it('should detect invalid data', () => {
            const resolver = new EquationResolver(basicConfig);
            const result = resolver.validateEquation({
                age: -1,
                name: 'J'
            });

            expect(result.overallSuccess).toBe(false);
            expect(result.failedFields).toHaveLength(2);
        });
    });

    describe('Computed Values', () => {
        const computedConfig: ICriteriaValidationConfig[] = [
            {
                id: 'totalIncome',
                computeValue: (data) => data.salary + (data.bonus || 0),
                rules: [
                    { type: 'number' },
                    { type: 'gte', value: 0 }
                ]
            }
        ];

        it('should compute and validate values correctly', () => {
            const resolver = new EquationResolver(computedConfig);
            const result = resolver.validateEquation({
                salary: 50000,
                bonus: 5000
            });

            expect(result.overallSuccess).toBe(true);
            const computedValue = resolver.computeValue('totalIncome', {
                salary: 50000,
                bonus: 5000
            });
            expect(computedValue).toBe(55000);
        });

        it('should handle missing optional values in computation', () => {
            const resolver = new EquationResolver(computedConfig);
            const result = resolver.validateEquation({
                salary: 50000
            });

            expect(result.overallSuccess).toBe(true);
            const computedValue = resolver.computeValue('totalIncome', {
                salary: 50000
            });
            expect(computedValue).toBe(50000);
        });
    });

    describe('Custom Functions', () => {
        const config: ICriteriaValidationConfig[] = [
            {
                id: 'score',
                computeValue: (data) => data.score,
                rules: [
                    { type: 'number' },
                    { type: 'between', min: 0, max: 100 }
                ]
            }
        ];

        const customFunctions = {
            calculateGrade: (score: number) => score >= 70 ? 'Pass' : 'Fail'
        };

        it('should use custom functions in validation', () => {
            const resolver = new EquationResolver(config, 'en', customFunctions);
            const result = resolver.validateEquation({
                score: 85
            });

            expect(result.overallSuccess).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should throw ConfigurationError for missing criteria', () => {
            const resolver = new EquationResolver([]);
            expect(() => resolver.computeValue('nonexistent', {}))
                .toThrow(ConfigurationError);
        });

        it('should handle invalid criteria configurations', () => {
            const invalidConfig = [
                {
                    id: '',  // Invalid empty ID
                    rules: [{ type: 'number' }]
                }
            ] as ICriteriaValidationConfig[];

            const resolver = new EquationResolver(invalidConfig);
            expect(() => resolver.validateEquation({}))
                .toThrow(ConfigurationError);
        });
    });

    describe('Internationalization', () => {
        const config: ICriteriaValidationConfig[] = [
            {
                id: 'age',
                rules: [
                    { type: 'number' },
                    { type: 'between', min: 0, max: 120 }
                ]
            }
        ];

        it('should use specified language for error messages', () => {
            const resolver = new EquationResolver(config, 'pt');
            const result = resolver.validateEquation({
                age: 'not a number'
            });

            expect(result.overallSuccess).toBe(false);
            const errors = result.failedFields[0].errors;
            expect(errors).toBeTruthy();
            expect(Object.values(errors!).some(msg => msg.includes('deve ser um número')))
                .toBe(true);
        });

        it('should fallback to English for unsupported languages', () => {
            const resolver = new EquationResolver(config, 'xx' as any);
            const result = resolver.validateEquation({
                age: 'not a number'
            });

            expect(result.overallSuccess).toBe(false);
            const errors = result.failedFields[0].errors;
            expect(errors).toBeTruthy();
            expect(Object.values(errors!).some(msg => msg.includes('must be a number')))
                .toBe(true);
        });
    });
});
