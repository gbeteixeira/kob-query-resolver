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

    public validateEquation(data: IEquationData): IFieldValidationSummary {
        const results = Array.from(this.criteriaConfigs.values()).map(config => {
            if (!config.id) {
                throw new ConfigurationError('Criteria ID is required', { config });
            }

            return this.validationEngine.validateCriteria(data, config, this.translations);
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
            return data[criteriaId];
        }

        try {
            return config.computeValue(data);
        } catch (error) {
            throw new ConfigurationError(
                `Failed to compute value for criteria ${criteriaId}`,
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }
}
