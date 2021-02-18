import '../src/index';
import {limit} from '../src/limit';

jest.useFakeTimers();

describe('A limiter function', () => {
    test('should enqueue calls to respect the specified rate limit', () => {
        const callback = jest.fn();
        const limitedCallback = limit(callback, 100);

        limitedCallback('a', 'b');
        limitedCallback('c', 'd');
        limitedCallback('e', 'f');

        expect(callback).toBeCalledTimes(1);
        expect(callback).toHaveBeenLastCalledWith('a', 'b');

        jest.advanceTimersByTime(100);

        expect(callback).toBeCalledTimes(2);
        expect(callback).toHaveBeenLastCalledWith('c', 'd');

        jest.advanceTimersByTime(100);

        expect(callback).toBeCalledTimes(3);
        expect(callback).toHaveBeenLastCalledWith('e', 'f');

        // No pending calls

        jest.advanceTimersByTime(100);

        expect(callback).toBeCalledTimes(3);
        expect(callback).toHaveBeenLastCalledWith('e', 'f');

        // Restart

        limitedCallback('g', 'h');
        limitedCallback('i', 'j');

        expect(callback).toBeCalledTimes(4);
        expect(callback).toHaveBeenLastCalledWith('g', 'h');

        jest.advanceTimersByTime(100);

        expect(callback).toBeCalledTimes(5);
        expect(callback).toHaveBeenLastCalledWith('i', 'j');

        // No pending calls again

        jest.advanceTimersByTime(100);

        expect(callback).toBeCalledTimes(5);
        expect(callback).toHaveBeenLastCalledWith('i', 'j');
    });
});
