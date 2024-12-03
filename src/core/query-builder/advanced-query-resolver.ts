import { EquationValidationError } from '../../errors';
import { ICriteriaValidationConfig, IEquationData, IFieldValidationResult, IFieldValidationSummary } from '../../models';


export class AdvancedQueryResolver {
    private criteriaConfigs: Map<string, ICriteriaValidationConfig>;

    constructor(criteriaConfigs: ICriteriaValidationConfig[]) {
        this.criteriaConfigs = new Map(
            criteriaConfigs.map(config => [config.id, config])
        );
    }

    private validateCriteria(criteriaId: string, data: IEquationData): IFieldValidationResult {
        const config = this.criteriaConfigs.get(criteriaId);
        if (!config) {
            throw new Error(`Critério ${criteriaId} não configurado`);
        }

        const errors: { [key: string]: string } = {};

        // Calcula o valor do critério
        let value: any;
        try {
            value = config.computeValue
                ? config.computeValue(data)
                : data[criteriaId];

            value = this.formatValue(
                value,
                criteriaId
            )
        } catch (error) {
            errors.compute = `Erro ao computar valor para o critério ${criteriaId}`;
            return {
                criteria: criteriaId,
                success: false,
                errors,
            };
        }

        // Validações específicas
        if (value !== undefined && value !== null && config.rules) {
            for (const rule of config.rules) {
                switch (rule.type) {
                    case 'exists':
                        if (value === undefined || value === null) {
                            errors.exists = `Critério ${criteriaId} deve existir`;
                        }
                        break;
                    case 'in':
                        if (!rule.values.includes(value)) {
                            errors.in = `Critério ${criteriaId} deve estar em ${JSON.stringify(rule.values)}`;
                        }
                        break;
                    case 'includes':
                        if (Array.isArray(value)) {
                            const hasAllValues = rule.values.every(val => value.includes(val));
                            if (!hasAllValues) {
                                errors.includes = `Critério ${criteriaId} deve incluir todos os valores ${JSON.stringify(rule.values)}`;
                            }
                        } else {
                            errors.includes = `Critério ${criteriaId} deve ser um array`;
                        }
                        break;
                    case 'between':
                        if (typeof value !== 'number' || value < rule.min || value > rule.max) {
                            errors.between = `Critério ${criteriaId} deve estar entre ${rule.min} e ${rule.max}`;
                        }
                        break;
                    case 'number':
                        if (typeof value !== 'number') {
                            errors.number = `Critério ${criteriaId} deve ser um número`;
                        }
                        break;
                    case 'string':
                        if (typeof value !== 'string') {
                            errors.string = `Critério ${criteriaId} deve ser uma string`;
                        }
                        break;
                    case 'boolean':
                        if (typeof value !== 'boolean') {
                            errors.boolean = `Critério ${criteriaId} deve ser um booleano`;
                        }
                        break;
                    case 'gte':
                        if (typeof value !== 'number' || value < rule.value) {
                            errors.gte = `Critério ${criteriaId} deve ser maior ou igual a ${rule.value}`;
                        }
                        break;
                    case 'lte':
                        if (typeof value !== 'number' || value > rule.value) {
                            errors.lte = `Critério ${criteriaId} deve ser menor ou igual a ${rule.value}`;
                        }
                        break;
                    case 'gt':
                        if (typeof value !== 'number' || value <= rule.value) {
                            errors.gt = `Critério ${criteriaId} deve ser maior que ${rule.value}`;
                        }
                        break;
                    case 'lt':
                        if (typeof value !== 'number' || value >= rule.value) {
                            errors.lt = `Critério ${criteriaId} deve ser menor que ${rule.value}`;
                        }
                        break;
                    case 'eq':
                        if (value !== rule.value) {
                            errors.eq = `Critério ${criteriaId} deve ser igual a ${rule.value}`;
                        }
                        break;
                    case 'custom':
                        if (!rule.validator(value)) {
                            errors.custom = `Validação personalizada falhou para o critério ${criteriaId}`;
                        }
                        break;
                }
            }
        }

        return {
            criteria: criteriaId,
            success: Object.keys(errors).length === 0,
            errors: Object.keys(errors).length > 0 ? errors : null,
        };
    }

    replaceCriterionWithValues(criteria: string, data: IEquationData): string {
        let processedCriteria = criteria;

        Array.from(this.criteriaConfigs.keys()).forEach(criteriaId => {
            const config = this.criteriaConfigs.get(criteriaId)!;
            const criteriaRegex = new RegExp(`\\{\\{${criteriaId}\\}\\}`, 'g');

            // Substituição do critério pelo seu valor
            if (criteriaRegex.test(processedCriteria)) {
                // Calcula o valor do critério
                const value = config.computeValue
                    ? config.computeValue(data)
                    : data[criteriaId];

                if (value === undefined || value === null) {
                    throw new EquationValidationError(`Valor para o critério ${criteriaId} não fornecido`);
                }

                processedCriteria = processedCriteria.replace(criteriaRegex, () => {
                    return this.formatValue(value, criteriaId).toString();
                });
            }
        });

        return processedCriteria;
    }

    private formatValue(value: any, criteriaId: string): string | boolean | number {
        const config = this.criteriaConfigs.get(criteriaId);

        // Se o valor for nulo ou undefined
        if (value === null || value === undefined) return 'null';

        // Formatação baseada em regras específicas
        if (config?.rules) {
            for (const rule of config.rules) {
                switch (rule.type) {
                    case 'number': {
                        // Garante que seja um número, converte se possível
                        const numberValue = Number(value);
                        return Number.isNaN(numberValue) ? 'null' : numberValue;
                    }

                    case 'string':
                        // Converte para string, adiciona aspas
                        return `'${String(value)}'`;

                    case 'boolean':
                        // Converte para booleano
                        return Boolean(value)

                    case 'between': {
                        // Formata como número, respeitando os limites
                        const betweenValue = Number(value);
                        if (Number.isNaN(betweenValue) ||
                            betweenValue < rule.min ||
                            betweenValue > rule.max) {
                            return 'null';
                        }
                        return betweenValue
                    }

                    case 'gte':
                    case 'lte':
                    case 'gt':
                    case 'lt': {
                        // Formata como número comparável
                        const comparableValue = Number(value);
                        return Number.isNaN(comparableValue) ? 'null' : comparableValue
                    }
                }
            }
        }

        // Último recurso
        return JSON.stringify(value);
    }

    private processLogicalOperators(criteria: string): string {
        // Substitui operadores textuais por operadores JavaScript
        return criteria
            .replace(/\bAND\b/g, '&&')
            .replace(/\bOR\b/g, '||')
            .replace(/\bNOT\b/g, '!')
            .replace(/\b==\b/g, '===');
    }

    validate(criteria: string, data: IEquationData): { success: boolean; errors?: IFieldValidationResult[] } {
        // Processa operadores lógicos
        const processedCriteria = this.processLogicalOperators(criteria);

        // Identifica todos os critérios únicos na expressão
        const uniqueCriterias = new Set<string>();
        const criteriaRegex = /\{\{(\w+)\}\}/g;
        // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
        let match;

        // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
        while ((match = criteriaRegex.exec(processedCriteria)) !== null) {
            uniqueCriterias.add(match[1]);
        }

        // Valida cada critério
        const validationResults = Array.from(uniqueCriterias).map(criteriaId =>
            this.validateCriteria(criteriaId, data)
        );

        // Filtra os critérios com falha na validação
        const validationErrors = validationResults.filter(result => !result.success);

        if (validationErrors.length > 0) {
            return {
                success: false,
                errors: validationErrors,
            };
        }

        // Substitui os critérios e avalia a expressão
        try {
            const processedExpression = this.replaceCriterionWithValues(processedCriteria, data);
            const result = new Function(`return ${processedExpression}`)();

            return { success: result === true };
        } catch (error) {
            return {
                success: false,
                errors: [{
                    criteria: 'expression',
                    success: false,
                    errors: {
                        expression: `Erro ao processar expressão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                    }
                }],
            };
        }
    }

    validateAllFields(data: IEquationData): IFieldValidationSummary {
        const validationResults: IFieldValidationResult[] = Array.from(this.criteriaConfigs.keys()).map(criteriaId =>
            this.validateCriteria(criteriaId, data)
        );


        const successFields: string[] = [];
        const failedFields: {
            id: string;
            errors: { [key: string]: string } | null;
        }[] = [];

        validationResults.map(result => {
            if (!result.success) {
                failedFields.push({
                    id: result.criteria,
                    errors: result.errors
                });
                return
            }
            successFields.push(result.criteria);
        });

        return {
            successFields,
            failedFields,
            overallSuccess: failedFields.length === 0
        };
    }
}