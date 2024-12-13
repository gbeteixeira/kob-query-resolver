// Interface para os dados de entrada
export interface IEquationData {
    [key: string]: any;
}

export interface IFieldValidationSummary {
    successFields: string[];
    failedFields: {
        id: string;
        errors: { [key: string]: string } | null;
    }[];
    overallSuccess: boolean;
}

export type SimpleValidationRule =
    | { type: 'exists' }
    | { type: 'in', values: any[] }
    | { type: 'between', min: number, max: number }
    | { type: 'includes', values: any[] }
    | { type: 'number' }
    | { type: 'array' }
    | { type: 'string' }
    | { type: 'boolean' }
    | { type: 'gte', value: number }
    | { type: 'lte', value: number }
    | { type: 'gt', value: number }
    | { type: 'lt', value: number }
    | { type: 'eq', value: any }
    | { type: 'custom', validator: (value: any) => boolean };


export interface IFieldValidationResult {
    criteria: string;
    success: boolean;
    errors: { [key: string]: string } | null;
}

export interface ICriteriaValidationConfig {
    id: string;
    name?: string;
    rules?: SimpleValidationRule[];
    computeValue?: (data: IEquationData) => number | string | boolean | null;
}