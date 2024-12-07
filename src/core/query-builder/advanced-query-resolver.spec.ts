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
        }
    ];

    it('should validate criteria successfully', () => {
        const resolver = new AdvancedQueryResolver(criteriaConfigs);

        const validData = {
            age: 30,
            status: 'active',
            CPF: '000.000.000-00'
        };

        const result = resolver.validateAllFields(validData);

        expect(result.overallSuccess).toBe(true);
        expect(result.successFields).toContain('age');
        expect(result.successFields).toContain('status');
        expect(result.successFields).toContain('CPF');
    });

    it('should use default English translations', () => {
        const resolver = new AdvancedQueryResolver(criteriaConfigs);

        const invalidData = {
            age: 17,
            status: 'suspended'
        };

        const result = resolver.validateAllFields(invalidData);

        expect(result.overallSuccess).toBe(false);
        expect(result.failedFields.length).toBe(3);
        expect(result.failedFields[0].errors).toMatchObject({
            // Verifica se as mensagens estão em inglês
            between: expect.stringContaining('must be between')
        });
    });

    it('should use Portuguese translations when specified', () => {
        const resolver = new AdvancedQueryResolver(criteriaConfigs, 'pt');

        const invalidData = {
            age: 17,
            status: 'suspended'
        };

        const result = resolver.validateAllFields(invalidData);

        expect(result.overallSuccess).toBe(false);
        expect(result.failedFields.length).toBe(3);
        expect(result.failedFields[0].errors).toMatchObject({
            // Verifica se as mensagens estão em português
            between: expect.stringContaining('deve estar entre')
        });
    });

    it('should fallback to English for unsupported languages', () => {
        const resolver = new AdvancedQueryResolver(criteriaConfigs, 'fr');

        const invalidData = {
            age: 17,
            status: 'suspended'
        };

        const result = resolver.validateAllFields(invalidData);

        expect(result.overallSuccess).toBe(false);
        expect(result.failedFields.length).toBe(3);
        expect(result.failedFields[0].errors).toMatchObject({
            // Verifica se voltou para inglês
            between: expect.stringContaining('must be between')
        });
    });

    it('should fail validation for invalid criteria', () => {
        const resolver = new AdvancedQueryResolver(criteriaConfigs);

        const invalidData = {
            age: 17,
            status: 'suspended'
        };

        const result = resolver.validateAllFields(invalidData);

        expect(result.overallSuccess).toBe(false);
        expect(result.failedFields.length).toBe(3);
        expect(result.failedFields[0].id).toBe('age');
        expect(result.failedFields[1].id).toBe('status');
    });

    it('should validate complex criteria', () => {
        const complexConfigs: ICriteriaValidationConfig[] = [
            {
                id: 'salary',
                computeValue: (data) => data.baseSalary + (data.bonus || 0),
                rules: [
                    { type: 'number' },
                    { type: 'gte', value: 1000 }
                ]
            }
        ];

        const resolver = new AdvancedQueryResolver(complexConfigs);

        const validData = {
            baseSalary: 2000,
            bonus: 500
        };

        const result = resolver.validate('{{salary}} >= 2000', validData);

        expect(result.success).toBe(true);
    });
});