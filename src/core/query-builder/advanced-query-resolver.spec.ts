import { describe, it, expect } from 'vitest';
import { AdvancedQueryResolver } from './advanced-query-resolver';
import { ICriteriaValidationConfig } from '../../models';

describe('AdvancedQueryResolver', () => {
    const criteriaConfigs: ICriteriaValidationConfig[] = [
        {
            id: 'age',
            rules: [
                { type: 'number' },
                { type: 'between', min: 18, max: 65 }
            ]
        },
        {
            id: 'status',
            rules: [
                { type: 'string' },
                { type: 'in', values: ['active', 'inactive'] }
            ]
        },
        {
            id: 'CPF',
            rules: [
                { type: 'string' },
                { type: 'exists' }
            ]
        },
        {
            id: 'users',
            rules: [
                { type: 'exists' }
            ]
        }
    ];

    it('should use default English translations', () => {
        const resolver = new AdvancedQueryResolver(criteriaConfigs);

        const invalidData = {
            age: 17,
            status: 'suspended',
            users: []
        };

        const result = resolver.validateAllFields(invalidData);

        expect(result.overallSuccess).toBe(false);
        expect(result.failedFields[0].errors).toMatchObject({
            // Verifica se as mensagens estão em inglês
            between: expect.stringContaining('must be between')
        });
    });

    it('should use Portuguese translations when specified', () => {
        const resolver = new AdvancedQueryResolver(criteriaConfigs, 'pt');

        const invalidData = {
            age: 17,
            status: 'active',
            users: []
        };

        const result = resolver.validateAllFields(invalidData);

        expect(result.overallSuccess).toBe(false);
        expect(result.failedFields[0].errors).toMatchObject({
            // Verifica se as mensagens estão em português
            between: expect.stringContaining('deve estar entre')
        });
    });

    it('should fallback to English for unsupported languages', () => {
        const resolver = new AdvancedQueryResolver(criteriaConfigs, 'fr');

        const invalidData = {
            age: 17,
            status: 'active',
            users: []
        };

        const result = resolver.validateAllFields(invalidData);

        expect(result.overallSuccess).toBe(false);
        expect(result.failedFields[0].errors).toMatchObject({
            // Verifica se voltou para inglês
            between: expect.stringContaining('must be between')
        });
    });

    it('should fail validation for invalid criteria', () => {
        const resolver = new AdvancedQueryResolver(criteriaConfigs);

        const invalidData = {
            age: 17,
            status: 'suspended',
            users: []
        };

        const result = resolver.validateAllFields(invalidData);

        expect(result.overallSuccess).toBe(false);
        expect(result.failedFields[0].id).toBe('age');
        expect(result.failedFields[1].id).toBe('status');
    });

    it('should validate criteria successfully', () => {
        const resolver = new AdvancedQueryResolver(criteriaConfigs);

        const validData = {
            age: 30,
            status: 'active',
            CPF: '000.000.000-00',
            users: []
        };

        const result = resolver.validateAllFields(validData);

        expect(result.overallSuccess).toBe(true);
        expect(result.successFields).toContain('age');
        expect(result.successFields).toContain('status');
        expect(result.successFields).toContain('CPF');
    });

    it('should validate complex criteria', () => {
        const complexConfigs: ICriteriaValidationConfig[] = [
            {
                id: 'salary',
                rules: [
                    { type: 'number' },
                    { type: 'gte', value: 300 }
                ]
            }
        ];

        const resolver = new AdvancedQueryResolver(complexConfigs);

        const validData = {
            salary: 300,
        };

        const result = resolver.validate('gte({{salary}}, 300)', validData);

        expect(result.success).toBe(true);
    });

    it('should support custom functions and advanced expressions', () => {
        const resolver = new AdvancedQueryResolver([
            {
                id: 'age',
                name: 'Age',
                rules: [
                    { type: 'number' }
                ]
            },
            {
                id: 'users',
                name: 'Users',
                rules: [
                    { type: 'array' }
                ]
            },
        ]);

        const data = {
            age: 30,
            users: ['john', 'jane', 'doe']
        };

        // Teste de funções padrão
        expect(resolver.validate('notEmpty({{users}})', data).success).toBe(true);
        expect(resolver.validate('{{users}}.length > 0', data).success).toBe(true);
        expect(resolver.validate('any({{users}}, u => u === "john")', data).success).toBe(true);
        expect(resolver.validate('isNumber({{age}})', data).success).toBe(true);
        expect(resolver.validate('gt({{age}}, 18)', data).success).toBe(true);
        expect(resolver.validate('startsWith("JohnDoe", "John")', data).success).toBe(true);
    });

    it('should allow adding custom functions', () => {
        const resolver = new AdvancedQueryResolver(criteriaConfigs);

        // Adiciona uma função personalizada
        resolver.addCustomFunction('isAdult', (age: number) => age >= 18);

        const data = {
            age: 25,
            status: 'active',
            CPF: '000.000.000-00'
        };

        // Testa a função personalizada
        expect(resolver.validate('isAdult({{age}})', data).success).toBe(true);
    });

    it('should handle complex mathematical and logical expressions', () => {
        const resolver = new AdvancedQueryResolver([
            {
                id: 'age',
                name: 'Age',
                rules: [
                    { type: 'number' }
                ]
            },
            {
                id: 'salary',
                name: 'Salary',
                rules: [
                    { type: 'number' }
                ]
            },
            {
                id: 'bonus',
                name: 'Bonus',
                rules: [
                    { type: 'number' }
                ]
            },
            {
                id: 'status',
                name: 'Status',
                rules: [
                    { type: 'string' }
                ]
            }
        ]);

        const data = {
            age: 30,
            salary: 5000,
            bonus: 1000,
            status: 'active'
        };

        // Expressões matemáticas e lógicas complexas
        expect(resolver.validate('sum({{age}}, 10) >= 30', data).success).toBe(true);
        expect(resolver.validate('max({{age}}, 25) === 30', data).success).toBe(true);
        expect(resolver.validate('{{salary}} + {{bonus}} > 5500', data).success).toBe(true);
    });

    it('should validate string and array operations', () => {
        const resolver = new AdvancedQueryResolver([
            {
                id: 'age',
                name: 'Age',
                rules: [
                    { type: 'number' }
                ]
            },
            {
                id: 'salary',
                name: 'Salary',
                rules: [
                    { type: 'number' }
                ]
            },
            {
                id: 'bonus',
                name: 'Bonus',
                rules: [
                    { type: 'number' }
                ]
            },
            {
                id: 'status',
                name: 'Status',
                rules: [
                    { type: 'string' }
                ]
            },
            {
                id: 'name',
                name: 'Name',
                rules: [
                    { type: 'string' }
                ]
            },
            {
                id: 'tags',
                name: 'Tags',
                rules: [
                    { type: 'array' }
                ]
            },
            {
                id: 'email',
                name: 'Email',
                rules: [
                    { type: 'string' }
                ]
            },
            {
                id: 'isActive',
                name: 'Is Active',
                rules: [
                    { type: 'boolean' }
                ]
            }
        ]);

        const data = {
            age: 30,
            name: 'John Doe',
            isActive: true,
            tags: ['admin', 'user', 'teste'],
            email: 'gabriel@example.com'
        };

        // Operações com strings e arrays
        expect(resolver.validate('startsWith({{name}}, "John")', data).success).toBe(true);
        expect(resolver.validate('includes({{name}}, "Doe")', data).success).toBe(true);
        expect(resolver.validate('contains({{tags}}, "admin")', data).success).toBe(true);
        expect(resolver.validate('any({{tags}}, t => t === "user")', data).success).toBe(true);
        expect(resolver.validate('match({{email}}, "@example.com$")', data).success).toBe(true);
    });

    it('should handle type checking functions', () => {
        const resolver = new AdvancedQueryResolver([
            {
                id: 'age',
                name: 'Age',
                rules: [
                    { type: 'number' }
                ]
            },
            {
                id: 'salary',
                name: 'Salary',
                rules: [
                    { type: 'number' }
                ]
            },
            {
                id: 'bonus',
                name: 'Bonus',
                rules: [
                    { type: 'number' }
                ]
            },
            {
                id: 'status',
                name: 'Status',
                rules: [
                    { type: 'string' }
                ]
            },
            {
                id: 'name',
                name: 'Name',
                rules: [
                    { type: 'string' }
                ]
            },
            {
                id: 'tags',
                name: 'Tags',
                rules: [
                    { type: 'array' }
                ]
            },
            {
                id: 'email',
                name: 'Email',
                rules: [
                    { type: 'string' }
                ]
            },
            {
                id: 'isActive',
                name: 'Is Active',
                rules: [
                    { type: 'boolean' }
                ]
            }
        ]);

        const data = {
            age: 30,
            name: 'John',
            isActive: true,
            tags: ['user']
        };

        // Verificações de tipo
        expect(resolver.validate('isNumber({{age}})', data).success).toBe(true);
        expect(resolver.validate('isBoolean({{isActive}})', data).success).toBe(true);
        expect(resolver.validate('isString({{name}})', data).success).toBe(true);
        expect(resolver.validate('isArray({{tags}})', data).success).toBe(true);
    });

    it('should handle complex mathematical and logical expressions', () => {
        const resolver = new AdvancedQueryResolver([
            {
                id: 'age',
                name: 'Age',
                rules: [{ type: 'number' }]
            },
            {
                id: 'def',
                name: 'Definition',
                rules: [{ type: 'string' }]
            }
        ]);
    
        const data1 = {
            age: 70,
            def: null,
        };
    
        const data2 = {
            age: 64,
            def: 'Defined',
        };
    
        // Primeiro caso: age >= 65, def é null
        const result1 = resolver.validate('(notEmpty({{def}})) || (gte({{age}}, 65))', data1);
        expect(result1.success).toBe(true);
    
        // Segundo caso: age < 65, def é 'Defined'
        const result2 = resolver.validate('(notEmpty({{def}})) || (gte({{age}}, 65))', data2);
        expect(result2.success).toBe(true);
    });
    
});