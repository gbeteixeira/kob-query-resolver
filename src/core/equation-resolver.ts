import { ComputationEngine } from './computation/computation-engine';
import { ValidationEngine } from './validation/validation-engine';
import { ICriteriaValidationConfig, IEquationData, IFieldValidationSummary } from '../models';
import DEFAULT_TRANSLATIONS from './translations';
import { ConfigurationError } from '../errors/base-error';

export class EquationResolver {
    private readonly validationEngine: ValidationEngine;
    private readonly computationEngine: ComputationEngine;
    private readonly criteriaConfigs: Map<string, ICriteriaValidationConfig>;
    private readonly translations: Record<string, string>;

    constructor(
        criteriaConfigs: ICriteriaValidationConfig[],
        language = 'en',
        // biome-ignore lint/complexity/noBannedTypes: <explanation>
        customFunctions?: Record<string, Function>
    ) {
        this.validationEngine = new ValidationEngine();
        this.computationEngine = new ComputationEngine();
        this.criteriaConfigs = new Map(criteriaConfigs.map(config => [config.id, config]));
        this.translations = DEFAULT_TRANSLATIONS[language] || DEFAULT_TRANSLATIONS.en;

        // Register custom functions if provided
        if (customFunctions) {
            Object.entries(customFunctions).forEach(([name, fn]) => {
                this.computationEngine.registerFunction(name, fn);
            });
        }
    }

    private convertToAppropriateType(
        value: any, 
        config?: ICriteriaValidationConfig, 
        data?: IEquationData
    ): any {
        // Determine the value to convert
        const valueToConvert = config?.computeValue 
            ? config.computeValue(data || {}) 
            : (data ? data[config!.id] : value);

        if (valueToConvert === null || valueToConvert === undefined) {
            return valueToConvert;
        }

        // Check for type conversion rules in config
        const typeRule = config?.rules?.find(rule => rule.type);
        const expectedType = typeRule?.type;
        const criterionName = config?.name || config?.id || 'Unnamed criterion';

        // Strict type checking when expected type is specified
        if (expectedType) {
            switch (expectedType) {
                case 'number': {
                    // More strict number conversion
                    const stringValue = String(valueToConvert).trim();
                    
                    // Check if the value is a valid number
                    if (/^-?\d+(\.\d+)?$/.test(stringValue)) {
                        const numericValue = Number(stringValue);
                        return numericValue;
                    }

                    // If it's not a valid number, return the original value to trigger validation error
                    return valueToConvert;
                }

                case 'boolean': {
                    const stringValue = String(valueToConvert).toLowerCase().trim();
                    if (stringValue === 'true') return true;
                    if (stringValue === 'false') return false;
                    
                    // If conversion fails, return the original value and let validation handle it
                    return valueToConvert;
                }

                case 'string':
                    return String(valueToConvert);

                default:
                    // For unsupported types, return the original value
                    return valueToConvert;
            }
        }

        // Flexible conversion if no specific type is set
        if (typeof valueToConvert === 'string') {
            const numericValue = Number(valueToConvert.replace(/[^\d.-]/g, ''));
            if (!Number.isNaN(numericValue)) return numericValue;

            const lowerValue = valueToConvert.toLowerCase();
            if (lowerValue === 'true') return true;
            if (lowerValue === 'false') return false;
        }

        return valueToConvert;
    }

    public validateEquation(data: IEquationData): IFieldValidationSummary {
        const results = Array.from(this.criteriaConfigs.values()).map(config => {
            if (!config.id) {
                throw new ConfigurationError('Criteria ID is required', { config });
            }

            try {
                const validCriteria =  this.validationEngine.validateCriteria(
                    data, 
                    config, 
                    this.translations,
                    this.convertToAppropriateType
                );

                if(!validCriteria.success) return validCriteria

                const validExpression= config.equation && validCriteria.success
                    ? this.validateEquationExpression(config.equation, [data])
                    : true; 

                const err = [] as any
                if (!validExpression) {
                    err['errors.expression'] = "Error"
                }

                return { criteria: config.id, success: validExpression, errors: err };

            } catch (error) {
                throw new ConfigurationError(
                    `Failed to validate criteria ${config.id}`,
                    { error: error instanceof Error ? error.message : 'Unknown error' }
                );
            }
        });

        const successFields = results
            .filter(result => result.success)
            .map(result => result.criteria);

        const failedFields = results
            .filter(result => !result.success)
            .map(result => ({
                id: result.criteria,
                errors: result.errors
            }));

        return {
            successFields,
            failedFields,
            overallSuccess: failedFields.length === 0
        };
    }

    public computeValue(criteriaId: string, data: IEquationData): unknown {
        const config = this.criteriaConfigs.get(criteriaId);
        if (!config) {
            throw new ConfigurationError(`Criteria ${criteriaId} not found`);
        }

        if (!config.computeValue) {
            return this.convertToAppropriateType(data[criteriaId], config, data);
        }

        try {
            const computedValue = config.computeValue(data);
            return this.convertToAppropriateType(computedValue, config, data);
        } catch (error) {
            throw new ConfigurationError(
                `Failed to compute value for criteria ${criteriaId}`,
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    public getProcessedQuery(data: IEquationData): { processedData: IEquationData; validationSummary: IFieldValidationSummary } {
        // First, validate the input data
        const validationSummary = this.validateEquation(data);

        // If validation fails, return the validation summary
        if (!validationSummary.overallSuccess) {
            return {
                processedData: data,
                validationSummary
            };
        }

        // Compute values for each criteria
        const processedData: IEquationData = {};
        for (const [criteriaId, config] of this.criteriaConfigs.entries()) {
            try {
                processedData[criteriaId] = this.convertToAppropriateType(
                    this.computeValue(criteriaId, data), 
                    config,
                    data
                );
            } catch (error) {
                // If computation fails for any criteria, add it to failed fields
                validationSummary.failedFields.push({
                    id: criteriaId,
                    errors: { computationError: error instanceof Error ? error.message : 'Unknown computation error' }
                });
                validationSummary.overallSuccess = false;
            }
        }

        return {
            processedData,
            validationSummary
        };
    }

    public validateEquationExpression(
        expression: string, 
        additionalDataSources: IEquationData[] = []
    ): boolean {
        // Merge data from criteriaConfigs and additional data sources
        const mergedData: IEquationData = {};

        // Add data from criteriaConfigs
        for (const [, config] of this.criteriaConfigs.entries()) {
            if (config.id && config.computeValue) {
                try {
                    mergedData[config.id] = this.convertToAppropriateType(
                        config.computeValue({}), 
                        config
                    );
                } catch (error) {
                    console.error(`Error computing value for ${config.id}:`, error);
                }
            }
        }

        // Add data from additional data sources (later sources override earlier ones)
        for (const source of additionalDataSources) {
            Object.assign(mergedData, source);
        }

        try {
            // Replace {{criteria}} placeholders with their values
            const replacedExpression = expression.replace(/\{\{(\w+)\}\}/g, (_, criteriaId) => {
                const value = mergedData[criteriaId];
                return value !== undefined && value !== null 
                    ? (typeof value === 'string' ? `"${value}"` : String(value)) 
                    : 'undefined';
            });

            // Wrap the expression to handle undefined variables
            const safeExpression = `(() => { 
                try { 
                    return Boolean(${replacedExpression}); 
                } catch (e) { 
                    return false; 
                }
            })()`;

            // Use the computeValue method from ComputationEngine to evaluate the expression
            const result = this.computationEngine.computeValue(safeExpression, mergedData);
            
            // Convert the result to a boolean
            return Boolean(result);
        } catch (error) {
            console.error('Error evaluating equation expression:', error);
            return false;
        }
    }

    public getProcessedEquationExpression(
        expression: string, 
        additionalDataSources: IEquationData[] = []
    ): { 
        expression: string, 
        result: boolean, 
        processedData: IEquationData 
    } {
        // Merge data from criteriaConfigs and additional data sources
        const mergedData: IEquationData = {};

        // Add data from criteriaConfigs
        for (const [, config] of this.criteriaConfigs.entries()) {
            if (config.id && config.computeValue) {
                try {
                    mergedData[config.id] = this.convertToAppropriateType(
                        config.computeValue({}), 
                        config
                    );
                } catch (error) {
                    console.error(`Error computing value for ${config.id}:`, error);
                }
            }
        }

        // Add data from additional data sources (later sources override earlier ones)
        for (const source of additionalDataSources) {
            Object.assign(mergedData, source);
        }

        try {
            // Replace {{criteria}} placeholders with their values
            const replacedExpression = expression.replace(/\{\{(\w+)\}\}/g, (_, criteriaId) => {
                const value = mergedData[criteriaId];
                return value !== undefined && value !== null 
                    ? (typeof value === 'string' ? `"${value}"` : String(value)) 
                    : 'undefined';
            });

            // Wrap the expression to handle undefined variables
            const safeExpression = `(() => { 
                try { 
                    return Boolean(${replacedExpression}); 
                } catch (e) { 
                    return false; 
                }
            })()`;

            // Use the computeValue method from ComputationEngine to evaluate the expression
            const result = this.computationEngine.computeValue(safeExpression, mergedData);
            
            // Convert the result to a boolean
            return {
                expression: replacedExpression,
                result: Boolean(result),
                processedData: mergedData
            };
        } catch (error) {
            console.error('Error evaluating equation expression:', error);
            return {
                expression: expression,
                result: false,
                processedData: mergedData
            };
        }
    }

    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    public getAvailableFunctions(): Record<string, Function> {
        // Return a frozen copy of the available functions to prevent modifications
        return Object.freeze({ ...this.computationEngine.functions });
    }
}
