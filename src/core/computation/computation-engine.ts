import { IEquationData } from '../../models';

export class ComputationEngine {
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    private readonly functions: Record<string, Function>;

    constructor() {
        this.functions = {
            // Math operations
            sum: (...args: number[]): number => args.reduce((a, b) => a + b, 0),
            avg: (...args: number[]): number => this.functions.sum(...args) / args.length,
            max: Math.max,
            min: Math.min,
            abs: Math.abs,
            round: Math.round,
            ceil: Math.ceil,
            floor: Math.floor,

            // Array operations
            count: (arr: unknown[]): number => arr.length,
            unique: (arr: unknown[]): unknown[] => [...new Set(arr)],
            filter: (arr: unknown[], predicate: (item: unknown) => boolean): unknown[] => arr.filter(predicate),

            // Type checks
            isEmpty: (value: unknown): boolean => {
                if (value === null || value === undefined) return true;
                if (typeof value === 'string') return value.trim().length === 0;
                if (Array.isArray(value)) return value.length === 0;
                if (typeof value === 'object') return Object.keys(value).length === 0;
                return false;
            },
            isNumber: (value: unknown): boolean => typeof value === 'number' && !Number.isNaN(value),
            isString: (value: unknown): boolean => typeof value === 'string',
            isBoolean: (value: unknown): boolean => typeof value === 'boolean',
            isArray: Array.isArray,

            // String operations
            concat: (...args: string[]): string => args.join(''),
            toLowerCase: (str: string): string => str.toLowerCase(),
            toUpperCase: (str: string): string => str.toUpperCase(),
            trim: (str: string): string => str.trim(),

            // Date operations
            now: (): Date => new Date(),
            isToday: (date: Date): boolean => {
                const today = new Date();
                return date.toDateString() === today.toDateString();
            },
            daysBetween: (date1: Date, date2: Date): number => {
                const diffTime = Math.abs(date2.getTime() - date1.getTime());
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        };
    }

    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    public registerFunction(name: string, fn: Function): void {
        if (this.functions[name]) {
            throw new Error(`Function ${name} already exists`);
        }
        this.functions[name] = fn;
    }

    public computeValue(expression: string, data: IEquationData): unknown {
        // Create a safe context with only allowed functions
        const context = {
            ...this.functions,
            ...data
        };

        try {
            // Use Function constructor to create a sandboxed evaluation
            const evaluator = new Function(...Object.keys(context), `return ${expression};`);
            return evaluator(...Object.values(context));
        } catch (error) {
            throw new Error(`Error evaluating expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
