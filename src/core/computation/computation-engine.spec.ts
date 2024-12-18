import { beforeEach, describe, expect, it } from 'vitest';
import { ComputationEngine } from './computation-engine';

describe('ComputationEngine', () => {
    let engine: ComputationEngine;

    beforeEach(() => {
        engine = new ComputationEngine();
    });

    describe('Math Operations', () => {
        it('should calculate sum correctly', () => {
            const result = engine.computeValue('sum(1, 2, 3)', {});
            expect(result).toBe(6);
        });

        it('should calculate average correctly', () => {
            const result = engine.computeValue('avg(2, 4, 6)', {});
            expect(result).toBe(4);
        });

        it('should find maximum value', () => {
            const result = engine.computeValue('max(1, 5, 3)', {});
            expect(result).toBe(5);
        });

        it('should find minimum value', () => {
            const result = engine.computeValue('min(1, 5, 3)', {});
            expect(result).toBe(1);
        });

        it('should calculate absolute value', () => {
            expect(engine.computeValue('abs(-5)', {})).toBe(5);
            expect(engine.computeValue('abs(5)', {})).toBe(5);
        });

        it('should handle rounding operations', () => {
            expect(engine.computeValue('round(3.7)', {})).toBe(4);
            expect(engine.computeValue('ceil(3.2)', {})).toBe(4);
            expect(engine.computeValue('floor(3.7)', {})).toBe(3);
        });
    });

    describe('Array Operations', () => {
        it('should count array elements', () => {
            const data = { arr: [1, 2, 3, 4, 5] };
            const result = engine.computeValue('count(arr)', data);
            expect(result).toBe(5);
        });

        it('should filter array elements', () => {
            const data = { arr: [1, 2, 3, 4, 5] };
            const result = engine.computeValue('filter(arr, x => x > 3)', data);
            expect(result).toEqual([4, 5]);
        });

        it('should get unique values', () => {
            const data = { arr: [1, 2, 2, 3, 3, 4] };
            const result = engine.computeValue('unique(arr)', data);
            expect(result).toEqual([1, 2, 3, 4]);
        });
    });

    describe('Type Checks', () => {
        it('should check if value is empty', () => {
            expect(engine.computeValue('isEmpty("")', {})).toBe(true);
            expect(engine.computeValue('isEmpty([])', {})).toBe(true);
            expect(engine.computeValue('isEmpty(null)', {})).toBe(true);
            expect(engine.computeValue('isEmpty("test")', {})).toBe(false);
        });

        it('should check types correctly', () => {
            expect(engine.computeValue('isNumber(123)', {})).toBe(true);
            expect(engine.computeValue('isString("test")', {})).toBe(true);
            expect(engine.computeValue('isBoolean(true)', {})).toBe(true);
            expect(engine.computeValue('isArray([1,2,3])', {})).toBe(true);
        });
    });

    describe('String Operations', () => {
        it('should concatenate strings', () => {
            const result = engine.computeValue('concat("Hello", " ", "World")', {});
            expect(result).toBe('Hello World');
        });

        it('should transform string case', () => {
            expect(engine.computeValue('toLowerCase("HELLO")', {})).toBe('hello');
            expect(engine.computeValue('toUpperCase("hello")', {})).toBe('HELLO');
        });

        it('should trim strings', () => {
            expect(engine.computeValue('trim("  hello  ")', {})).toBe('hello');
        });
    });

    describe('Date Operations', () => {
        it('should check if date is today', () => {
            const today = new Date();
            const result = engine.computeValue('isToday(now())', {});
            expect(result).toBe(true);
        });

        it('should calculate days between dates', () => {
            const date1 = new Date('2023-01-01');
            const date2 = new Date('2023-01-05');
            const result = engine.computeValue('daysBetween(new Date("2023-01-01"), new Date("2023-01-05"))', {});
            expect(result).toBe(4);
        });
    });

    describe('Custom Functions', () => {
        it('should register and use custom function', () => {
            engine.registerFunction('double', (x: number) => x * 2);
            const result = engine.computeValue('double(5)', {});
            expect(result).toBe(10);
        });

        it('should throw error when registering duplicate function', () => {
            engine.registerFunction('test', () => true);
            expect(() => engine.registerFunction('test', () => false)).toThrow();
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid expressions', () => {
            expect(() => engine.computeValue('invalid()', {})).toThrow();
        });

        it('should handle runtime errors', () => {
            expect(() => engine.computeValue('a.b.c', {})).toThrow();
        });

        it('should handle undefined variables', () => {
            expect(() => engine.computeValue('nonexistent', {})).toThrow();
        });
    });

    describe('Context Integration', () => {
        it('should use provided data context', () => {
            const data = { x: 10, y: 20 };
            const result = engine.computeValue('x + y', data);
            expect(result).toBe(30);
        });

        it('should combine functions with data context', () => {
            const data = { numbers: [1, 2, 3, 4, 5] };
            const result = engine.computeValue('sum(...numbers)', data);
            expect(result).toBe(15);
        });
    });
});
