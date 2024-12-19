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

    describe('computeValue', () => {
        it('should compute custom value when computeValue is defined', () => {
            const resolver = new EquationResolver([
                {
                    id: 'total',
                    computeValue: (data) => data.a + data.b
                }
            ]);

            const result = resolver.computeValue('total', { a: 10, b: 20 });
            expect(result).toBe(30);
        });
    });

    describe('getProcessedQuery', () => {
        it('should return validation summary when validation fails', () => {
            const resolver = new EquationResolver([
                {
                    id: 'age',
                    rules: [
                        { type: 'number' },
                        { type: 'between', min: 0, max: 120 }
                    ]
                }
            ]);

            const result = resolver.getProcessedQuery({ age: -5 });
            expect(result.processedData).toEqual({ age: -5 });
            expect(result.validationSummary.overallSuccess).toBe(false);
            expect(result.validationSummary.failedFields[0].id).toBe('age');
        });

        it('should compute values when validation passes', () => {
            const resolver = new EquationResolver([
                {
                    id: 'total',
                    computeValue: (data) => data.a + data.b
                },
                {
                    id: 'age',
                    rules: [
                        { type: 'number' },
                        { type: 'between', min: 0, max: 120 }
                    ]
                }
            ]);

            const result = resolver.getProcessedQuery({ a: 10, b: 20, age: 25 });
            expect(result.processedData).toEqual({ 
                total: 30, 
                age: 25 
            });
            expect(result.validationSummary.overallSuccess).toBe(true);
        });
    });

    describe('validateEquationExpression', () => {
        it('should use computeValue from criteriaConfigs with {{}} placeholders', () => {
            const resolver = new EquationResolver([
                {
                    id: 'idade',
                    computeValue: () => '20'
                }
            ]);
            
            expect(resolver.validateEquationExpression('{{idade}} >= 18'))
                .toBe(true);
            expect(resolver.validateEquationExpression('{{idade}} < 18'))
                .toBe(false);
        });

        it('should prioritize additional data sources with {{}} placeholders', () => {
            const resolver = new EquationResolver([
                    {
                      id: 'idade',
                      name: 'Idade',
                      rules: [ { type: "number"} ],
                      computeValue: () => '20'
                    }
            ]);

            expect(resolver.validateEquation({}))
                .toEqual(expect.objectContaining({
                    overallSuccess: true,
                    successFields: ['idade'],
                    failedFields: []
                }));

            expect(resolver.validateEquationExpression('{{idade}} >= 30', [{ idade: 35 }]))
                .toBe(true);
            expect(resolver.validateEquationExpression('{{idade}} >= 30', [{ idade: 25 }]))
                .toBe(false);
        });

        const resolver = new EquationResolver([]);

        it('should validate simple isEmpty condition with {{}} placeholders', () => {
            expect(resolver.validateEquationExpression('isEmpty({{name}})', [{ name: 'John' }]))
                .toBe(false);
            expect(resolver.validateEquationExpression('isEmpty({{name}})', [{ name: '' }]))
                .toBe(true);
            expect(resolver.validateEquationExpression('isEmpty({{name}})', [{ name: null }]))
                .toBe(true);
        });

        it('should validate type check functions with {{}} placeholders', () => {
            expect(resolver.validateEquationExpression('isNumber({{value}})', [{ value: 42 }]))
                .toBe(true);
            expect(resolver.validateEquationExpression('isNumber({{value}})', [{ value: '42' }]))
                .toBe(false);
        });

        it('should support complex boolean expressions with {{}} placeholders', () => {
            const data = { name: 'John', age: 25 };
            expect(resolver.validateEquationExpression('!isEmpty({{name}}) && {{age}} >= 18', [data]))
                .toBe(true);
            expect(resolver.validateEquationExpression('!isEmpty({{name}}) && {{age}} >= 30', [data]))
                .toBe(false);
        });

        it('should handle mathematical comparisons with {{}} placeholders', () => {
            const data = { value: 25 };
            expect(resolver.validateEquationExpression('{{value}} >= 20 && {{value}} <= 30', [data]))
                .toBe(true);
            expect(resolver.validateEquationExpression('{{value}} >= 30 || {{value}} <= 20', [data]))
                .toBe(false);
        });

        it('should handle null and undefined values with {{}} placeholders', () => {
            expect(resolver.validateEquationExpression('isEmpty({{value}})', [{ value: null }]))
                .toBe(true);
            expect(resolver.validateEquationExpression('isEmpty({{value}})', [{}]))
                .toBe(true);
        });

        it('should handle string values correctly', () => {
            const data = { name: 'John' };
            expect(resolver.validateEquationExpression('{{name}} == "John"', [data]))
                .toBe(true);
            expect(resolver.validateEquationExpression('{{name}} == "Jane"', [data]))
                .toBe(false);
        });
    });

    describe('getAvailableFunctions', () => {
        const resolver = new EquationResolver([]);

        it('should return all available computation functions', () => {
            const functions = resolver.getAvailableFunctions();
            
            // Check for some key functions
            expect(functions.sum).toBeDefined();
            expect(functions.avg).toBeDefined();
            expect(functions.max).toBeDefined();
            expect(functions.min).toBeDefined();
            expect(functions.isEmpty).toBeDefined();
            expect(functions.isNumber).toBeDefined();
        });

        it('should not allow direct modification of functions', () => {
            const functions = resolver.getAvailableFunctions();
            
            // Attempt to modify the function
            expect(() => {
                functions.sum = () => 0;
            }).toThrow();
        });
    });

    describe('getProcessedEquationExpression', () => {
        it('should process expression with computeValue from criteriaConfigs', () => {
            const resolver = new EquationResolver([
                {
                    id: 'idade',
                    computeValue: () => 20
                }
            ]);

            const processed = resolver.getProcessedEquationExpression('{{idade}} >= 18');
            expect(processed.result).toBe(true);
            expect(processed.expression).toBe('20 >= 18');
            expect(processed.processedData.idade).toBe(20);
        });

        it('should prioritize additional data sources', () => {
            const resolver = new EquationResolver([
                {
                    id: 'idade',
                    computeValue: () => 20
                }
            ]);

            const processed1 = resolver.getProcessedEquationExpression('{{idade}} >= 30', [{ idade: 35 }]);
            expect(processed1.result).toBe(true);
            expect(processed1.processedData.idade).toBe(35);

            const processed2 = resolver.getProcessedEquationExpression('{{idade}} >= 30', [{ idade: 25 }]);
            expect(processed2.result).toBe(false);
            expect(processed2.processedData.idade).toBe(25);
        });

        it('should handle complex expressions', () => {
            const resolver = new EquationResolver([]);

            const processed = resolver.getProcessedEquationExpression(
                '!isEmpty({{name}}) && {{age}} >= 18', 
                [{ name: 'John', age: 25 }]
            );

            expect(processed.result).toBe(true);
            expect(processed.expression).toBe('!isEmpty("John") && 25 >= 18');
            expect(processed.processedData.name).toBe('John');
            expect(processed.processedData.age).toBe(25);
        });

        it('should handle error cases', () => {
            const resolver = new EquationResolver([]);

            const processed = resolver.getProcessedEquationExpression(
                '{{nonexistent}} > 0'
            );

            expect(processed.result).toBe(false);
            expect(processed.expression).toBe('undefined > 0');
        });

        it('should merge multiple data sources', () => {
            const resolver = new EquationResolver([
                {
                    id: 'baseValue',
                    computeValue: () => 10
                }
            ]);

            const processed = resolver.getProcessedEquationExpression(
                '{{baseValue}} + {{additionalValue}} >= 15', 
                [
                    { additionalValue: 5 },
                    { additionalValue: 10 }  // This will override the previous value
                ]
            );

            expect(processed.result).toBe(true);
            expect(processed.processedData.baseValue).toBe(10);
            expect(processed.processedData.additionalValue).toBe(10);
        });
    });
});
