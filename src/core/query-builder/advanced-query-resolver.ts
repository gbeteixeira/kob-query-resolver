import { EquationValidationError } from '../../errors';
import {
    ICriteriaValidationConfig,
    IEquationData,
    IFieldValidationResult,
    IFieldValidationSummary
} from '../../models';
import DEFAULT_TRANSLATIONS from '../translations';

export class AdvancedQueryResolver {
    private criteriaConfigs: Map<string, ICriteriaValidationConfig>;
    private language: string;
    private translations: Record<string, string>;

    constructor(
        criteriaConfigs: ICriteriaValidationConfig[],
        language = 'en'
    ) {
        this.criteriaConfigs = new Map(
            criteriaConfigs.map(config => [config.id, config])
        );

        // Define o idioma, usando 'en' como padrão
        this.language = language in DEFAULT_TRANSLATIONS ? language : 'en';

        // Seleciona as traduções para o idioma
        this.translations = DEFAULT_TRANSLATIONS[this.language];
    }

    private getCriteriaLabel(criteriaId: string): string {
        const config = this.criteriaConfigs.get(criteriaId);
        return config?.name || criteriaId; // Usa o label ou o ID como fallback
    }

    private translate(key: string, params?: Record<string, any>): string {
        let translation = this.translations[key] || key;

        // Substitui placeholders
        if (params) {
            Object.keys(params).forEach(paramKey => {
                const placeholder = new RegExp(`{{${paramKey}}}`, 'g');
                translation = translation.replace(placeholder, String(params[paramKey]));
            });
        }

        return translation;
    }

    private validateCriteria(criteriaId: string, data: IEquationData): IFieldValidationResult {
        const config = this.criteriaConfigs.get(criteriaId);
        const criteriaLabel = this.getCriteriaLabel(criteriaId);

        if (!config) {
            throw new Error(this.translate('errors.criteriaNotConfigured', {
                criteriaId: criteriaLabel
            }));
        }

        const errors: { [key: string]: string } = {};

        try {
            let value = config.computeValue
                ? config.computeValue(data)
                : data[criteriaId];

            value = this.formatValue(value, criteriaId);

            if (config.rules) {
                for (const rule of config.rules) {
                    switch (rule.type) {
                        case 'exists':
                            if (value === undefined || value === null) {
                                errors.exists = this.translate('errors.criteriaExists', {
                                    criteriaId: criteriaLabel
                                });
                            }
                            break;
                        case 'in':
                            if (!rule.values.includes(value)) {
                                errors.in = this.translate('errors.criteriaIn', {
                                    criteriaId: criteriaLabel,
                                    values: JSON.stringify(rule.values)
                                });
                            }
                            break;
                        case 'includes':
                            if (Array.isArray(value)) {
                                const hasAllValues = rule.values.every(val => value.includes(val));
                                if (!hasAllValues) {
                                    errors.includes = this.translate('errors.criteriaIncludes', {
                                        criteriaId: criteriaLabel,
                                        values: JSON.stringify(rule.values)
                                    });
                                }
                            } else {
                                errors.includes = this.translate('errors.criteriaArray', {
                                    criteriaId: criteriaLabel
                                });
                            }
                            break;
                        case 'between':
                            if (typeof value !== 'number' || value < rule.min || value > rule.max) {
                                errors.between = this.translate('errors.betweenRange', {
                                    criteriaId: criteriaLabel,
                                    min: rule.min,
                                    max: rule.max
                                });
                            }
                            break;
                        case 'number':
                            if (typeof value !== 'number') {
                                errors.number = this.translate('errors.numberType', {
                                    criteriaId: criteriaLabel
                                });
                            }
                            break;
                        case 'string':
                            if (typeof value !== 'string') {
                                errors.string = this.translate('errors.stringType', {
                                    criteriaId: criteriaLabel
                                });
                            }
                            break;
                        case 'boolean':
                            if (typeof value !== 'boolean') {
                                errors.boolean = this.translate('errors.booleanType', {
                                    criteriaId: criteriaLabel
                                });
                            }
                            break;
                        case 'gte':
                            if (typeof value !== 'number' || value < rule.value) {
                                errors.gte = this.translate('errors.greaterThanEqual', {
                                    criteriaId: criteriaLabel,
                                    value: rule.value
                                });
                            }
                            break;
                        case 'lte':
                            if (typeof value !== 'number' || value > rule.value) {
                                errors.lte = this.translate('errors.lessThanEqual', {
                                    criteriaId: criteriaLabel,
                                    value: rule.value
                                });
                            }
                            break;
                        case 'gt':
                            if (typeof value !== 'number' || value <= rule.value) {
                                errors.gt = this.translate('errors.greaterThan', {
                                    criteriaId: criteriaLabel,
                                    value: rule.value
                                });
                            }
                            break;
                        case 'lt':
                            if (typeof value !== 'number' || value >= rule.value) {
                                errors.lt = this.translate('errors.lessThan', {
                                    criteriaId: criteriaLabel,
                                    value: rule.value
                                });
                            }
                            break;
                        case 'eq':
                            if (value !== rule.value) {
                                errors.eq = this.translate('errors.equalTo', {
                                    criteriaId: criteriaLabel,
                                    value: rule.value
                                });
                            }
                            break;
                        case 'custom':
                            if (!rule.validator(value)) {
                                errors.custom = this.translate('errors.customValidationFailed', {
                                    criteriaId: criteriaLabel
                                });
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
        } catch (error) {
            errors.compute = this.translate('errors.computeValueFailed', {
                criteriaId: criteriaLabel
            });
            return {
                criteria: criteriaId,
                success: false,
                errors,
            };
        }
    }

    private formatValue(value: any, criteriaId: string): string | boolean | number | null {
        const config = this.criteriaConfigs.get(criteriaId);

        // Se o valor for nulo ou undefined
        if (value === null || value === undefined) return null;

        // Formatação baseada em regras específicas
        if (config?.rules) {
            for (const rule of config.rules) {
                switch (rule.type) {
                    case 'number': {
                        // Garante que seja um número, converte se possível
                        const numberValue = Number(value);
                        return Number.isNaN(numberValue) ? null : numberValue;
                    }

                    case 'string':
                        // Converte para string
                        return String(value);

                    case 'boolean':
                        // Converte para booleano
                        return Boolean(value);

                    case 'between': {
                        // Formata como número, respeitando os limites
                        const betweenValue = Number(value);
                        if (Number.isNaN(betweenValue) ||
                            betweenValue < rule.min ||
                            betweenValue > rule.max) {
                            return null;
                        }
                        return betweenValue;
                    }

                    case 'gte':
                    case 'lte':
                    case 'gt':
                    case 'lt': {
                        // Formata como número comparável
                        const comparableValue = Number(value);
                        return Number.isNaN(comparableValue) ? null : comparableValue;
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
                    throw new EquationValidationError(this.translate('errors.criteriaNotConfigured', {
                        criteriaId: this.getCriteriaLabel(criteriaId)
                    }));
                }

                processedCriteria = processedCriteria.replace(criteriaRegex, () => {
                    return this.formatValue(value, criteriaId)?.toString() ?? 'null';
                });
            }
        });

        return processedCriteria;
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
                        expression: this.translate('errors.expression', {
                            message: error instanceof Error ? error.message : 'Unknown error'
                        })
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

        validationResults.forEach(result => {
            if (!result.success) {
                failedFields.push({
                    id: result.criteria,
                    errors: result.errors
                });
                return;
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