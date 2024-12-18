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
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    private customFunctions: Record<string, Function>;

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

        // Funções padrão extensivas
        this.customFunctions = {
            // Funções de verificação de estado
            empty: (value: any) => {
                if (value === null || value === undefined) return true;
                if (value === "null" || value === "undefined") return true;
                if (typeof value === 'string') return value.trim().length === 0;
                if (Array.isArray(value)) return value.length === 0;
                if (typeof value === 'object') return Object.keys(value).length === 0;
                return false;
            },
            notEmpty: (value: any) => {
                return !this.customFunctions.empty(value)
            },
            isNull: (value: any) => value === null,
            isUndefined: (value: any) => value === undefined,
            isDefined: (value: any) => value !== undefined && value !== null,

            // Funções matemáticas
            max: (...args: number[]) => Math.max(...args),
            min: (...args: number[]) => Math.min(...args),
            sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
            avg: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
            abs: Math.abs,
            round: Math.round,
            ceil: Math.ceil,
            floor: Math.floor,

            // Funções de string
            startsWith: (str: string, prefix: string) => str.startsWith(prefix),
            endsWith: (str: string, suffix: string) => str.endsWith(suffix),
            includes: (str: string, search: string) => str.includes(search),
            toLowerCase: (str: string) => str.toLowerCase(),
            toUpperCase: (str: string) => str.toUpperCase(),
            trim: (str: string) => str.trim(),

            // Funções de array
            contains: (arr: any[], value: any) => arr.includes(value),
            any: (arr: any[], predicate?: (item: any) => boolean) =>
                predicate ? arr.some(predicate) : arr.some(Boolean),
            all: (arr: any[], predicate?: (item: any) => boolean) =>
                predicate ? arr.every(predicate) : arr.every(Boolean),

            // Funções de tipo
            isArray: Array.isArray,
            isString: (value: any) => typeof value === 'string',
            isNumber: (value: any) => typeof value === 'number' && !Number.isNaN(value),
            isBoolean: (value: any) => typeof value === 'boolean',
            isObject: (value: any) =>
                value !== null && typeof value === 'object' && !Array.isArray(value),

            // Funções de comparação
            gt: (a: number, b: number) => a > b,
            gte: (a: number, b: number) => a >= b,
            lt: (a: number, b: number) => a < b,
            lte: (a: number, b: number) => a <= b,
            eq: (a: any, b: any) => a === b,
            neq: (a: any, b: any) => a !== b,

            // Funções de data
            isToday: (date: Date | string) => {
                const inputDate = new Date(date);
                const today = new Date();
                return inputDate.toDateString() === today.toDateString();
            },
            isWeekend: (date: Date | string) => {
                const inputDate = new Date(date);
                return inputDate.getDay() === 0 || inputDate.getDay() === 6;
            },

            // Funções de regex
            match: (str: string, pattern: string | RegExp) =>
                new RegExp(pattern).test(str),

        };
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
                criterion: criteriaLabel
            }));
        }

        const errors: { [key: string]: string } = {};

        try {
            let value = config.computeValue
                ? config.computeValue(data)
                : data[criteriaId];

            // Format value based on type rules before validation
            if (config.rules) {
                const typeRule = config.rules.find(rule => rule.type === 'number' || rule.type === 'string' || rule.type === 'boolean');
                if (typeRule) {
                    switch (typeRule.type) {
                        case 'number': {
                            const numValue = Number(value);
                            value = !Number.isNaN(numValue) ? numValue : null;
                            break;
                        }
                        case 'string':
                            value = String(value);
                            break;
                        case 'boolean':
                            value = Boolean(value);
                            break;
                    }
                }
            }

            if (config.rules) {
                for (const rule of config.rules) {
                    switch (rule.type) {
                        case 'exists':
                            if (value === undefined || value === null) {
                                errors.exists = this.translate('errors.criteriaExists', {
                                    criterion: criteriaLabel
                                });
                            }
                            break;
                        case 'in':
                            if (!rule.values.includes(value)) {
                                errors.in = this.translate('errors.criteriaIn', {
                                    criterion: criteriaLabel,
                                    values: JSON.stringify(rule.values)
                                });
                            }
                            break;
                        case 'includes':
                            if (Array.isArray(value)) {
                                const hasAllValues = rule.values.every(val => value.includes(val));
                                if (!hasAllValues) {
                                    errors.includes = this.translate('errors.criteriaIncludes', {
                                        criterion: criteriaLabel,
                                        values: JSON.stringify(rule.values)
                                    });
                                }
                            } else {
                                errors.includes = this.translate('errors.criteriaArray', {
                                    criterion: criteriaLabel
                                });
                            }
                            break;
                        case 'between':
                            if (typeof value !== 'number' || value < rule.min || value > rule.max) {
                                errors.between = this.translate('errors.betweenRange', {
                                    criterion: criteriaLabel,
                                    min: rule.min,
                                    max: rule.max
                                });
                            }
                            break;
                        case 'number':
                            if (typeof value !== 'number') {
                                errors.number = this.translate('errors.numberType', {
                                    criterion: criteriaLabel
                                });
                            }
                            break;
                        case 'string':
                            if (typeof value !== 'string') {
                                errors.string = this.translate('errors.stringType', {
                                    criterion: criteriaLabel
                                });
                            }
                            break;
                        case 'boolean':
                            if (typeof value !== 'boolean') {
                                errors.boolean = this.translate('errors.booleanType', {
                                    criterion: criteriaLabel
                                });
                            }
                            break;
                        case 'gte':
                            if (typeof value !== 'number' || value < rule.value) {
                                errors.gte = this.translate('errors.greaterThanEqual', {
                                    criterion: criteriaLabel,
                                    value: rule.value
                                });
                            }
                            break;
                        case 'lte':
                            if (typeof value !== 'number' || value > rule.value) {
                                errors.lte = this.translate('errors.lessThanEqual', {
                                    criterion: criteriaLabel,
                                    value: rule.value
                                });
                            }
                            break;
                        case 'gt':
                            if (typeof value !== 'number' || value <= rule.value) {
                                errors.gt = this.translate('errors.greaterThan', {
                                    criterion: criteriaLabel,
                                    value: rule.value
                                });
                            }
                            break;
                        case 'lt':
                            if (typeof value !== 'number' || value >= rule.value) {
                                errors.lt = this.translate('errors.lessThan', {
                                    criterion: criteriaLabel,
                                    value: rule.value
                                });
                            }
                            break;
                        case 'eq':
                            if (value !== rule.value) {
                                errors.eq = this.translate('errors.equalTo', {
                                    criterion: criteriaLabel,
                                    value: rule.value
                                });
                            }
                            break;
                        case 'array':
                            if (!Array.isArray(value)) {
                                errors.custom = this.translate('errors.customValidationFailed', {
                                    criterion: criteriaLabel
                                });
                            }
                            break;
                        case 'custom':
                            if (!rule.validator(value)) {
                                errors.custom = this.translate('errors.customValidationFailed', {
                                    criterion: criteriaLabel
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
                criterion: criteriaLabel
            });
            return {
                criteria: criteriaId,
                success: false,
                errors,
            };
        }
    }

    private formatValue(value: any, criteriaId: string): string | boolean | number | null | any {
        const config = this.criteriaConfigs.get(criteriaId);

        // Se o valor for nulo ou undefined
        if (value === null || value === undefined) {
            return value === null || value === undefined
                ? String(value) // 'null' ou 'undefined'
                : typeof value === 'string'
                    ? `'${value}'` // strings precisam de aspas
                    : value; // números e booleanos
        }

        // Formatação baseada em regras específicas
        if (config?.rules) {
            for (const rule of config.rules) {
                switch (rule.type) {
                    case 'number': {
                        // Garante que seja um número, converte se possível
                        const numberValue = Number(value);
                        return Number.isNaN(numberValue) ? null : numberValue;
                    }

                    case 'array':
                        // Converte para string
                        return Array.isArray(value) ? value : [value];

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

    private replaceCriterionWithValues(criteria: string, data: IEquationData): string {
        const criteriaRegex = /{{([^}]+)}}/g;
        return criteria.replace(criteriaRegex, (_, criterionId) => {
            const config = this.criteriaConfigs.get(criterionId);
            const value = config?.computeValue ? config.computeValue(data) : data[criterionId];

            // Convert string 'null' or 'undefined' to actual values
            if (value === 'null' || value === null) {
                return 'null';
            }
            if (value === undefined || value === 'undefined') {
                return 'undefined';
            }

            // Check for type rules and convert value accordingly
            if (config?.rules) {
                const typeRule = config.rules.find(rule => rule.type === 'number' || rule.type === 'string' || rule.type === 'boolean');
                if (typeRule) {
                    switch (typeRule.type) {
                        case 'number': {
                            const numValue = Number(value);
                            return !Number.isNaN(numValue) ? String(numValue) : 'null';
                        }
                        case 'string': {
                            // Empty string should remain as empty string with quotes
                            return `"${String(value)}"`;
                        }
                        case 'boolean': {
                            const boolValue = value === '' ? false : Boolean(value);
                            return String(boolValue);
                        }
                    }
                }
            }

            // Default formatting based on value type
            switch (typeof value) {
                case 'string':
                    return `"${value}"`;
                case 'number':
                    return String(value);
                case 'boolean':
                    return String(value);
                case 'object':
                    return JSON.stringify(value);
                default:
                    return JSON.stringify(value);
            }
        });
    }

    private createSandboxContext(data: IEquationData) {
        // Cria um contexto de execução seguro
        const sandboxContext: Record<string, any> = {
            ...data,
            ...this.customFunctions
        };

        return sandboxContext;
    }

    validate(criteria: string, data: IEquationData): { success: boolean; errors?: IFieldValidationResult[] } {
        // First, identify all unique criteria in the expression
        const uniqueCriteria = new Set<string>();
        const criteriaRegex = /{{(\w+)}}/g;
        let match: RegExpExecArray | null;

        // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
        while ((match = criteriaRegex.exec(criteria)) !== null) {
            uniqueCriteria.add(match[1]);
        }

        // Validate each criterion first
        const validationResults = Array.from(uniqueCriteria).map(criteriaId =>
            this.validateCriteria(criteriaId, data)
        );

        // Filter the criteria with validation failures
        const validationErrors = validationResults.filter(result => !result.success);

        // If there are validation errors, return them immediately
        if (validationErrors.length > 0) {
            return {
                success: false,
                errors: validationErrors,
            };
        }

        // If all criteria pass their individual validations, proceed with expression evaluation
        try {
            // Replace criteria with their actual values
            const processedCriteria = this.replaceCriterionWithValues(criteria, data);

            // Create a sandbox context with data and custom functions
            const sandboxContext = this.createSandboxContext(data);

            // Create a safer evaluation function with more comprehensive support
            const evalFunction = new Function(
                ...Object.keys(sandboxContext),
                `
                try {
                    // Support for arrow functions
                    const arrowFn = (fn) => {
                        return typeof fn === 'function' 
                            ? fn 
                            : (x) => x === fn;
                    };
                    
                    return ${processedCriteria};
                } catch (e) {
                    throw new Error('Expression evaluation failed: ' + e.message);
                }
                `
            );

            // Execute the function with the sandbox context
            const result = evalFunction(...Object.values(sandboxContext));

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

    /**
     * Returns the query with all criteria replaced by their actual values
     * @param criteria The criteria string containing placeholders
     * @param data The data object containing values
     * @returns The processed query with actual values
     */
    public getProcessedQuery(criteria: string, data: IEquationData): string {
        return this.replaceCriterionWithValues(criteria, data);
    }

    // Método para permitir adicionar mais funções
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    addCustomFunction(name: string, func: Function) {
        this.customFunctions[name] = func;
    }
}