type Callback = (...args: any[]) => any;

/**
 * Limits the number of call at a given rate.
 *
 * The value passed to the argument wait limits the maximum rate for function calls.
 * For example, passing 500ms causes the function to be called at most one time per
 * 500ms – or two times per second.
 *
 * Note that calls are queued for execution but never ignored.
 *
 * @param callback The callback to call.
 * @param wait The time to wait between calls, in milliseconds.
 */
export function limit<C extends Callback>(callback: C, wait: number): (...args: Parameters<C>) => void {
    const queue: Callback[] = [];
    let timer: number|undefined;

    const dequeue = (): void => {
        if (timer !== undefined) {
            return;
        }

        const next = queue.shift();

        if (next !== undefined) {
            next();

            timer = window.setTimeout(
                () => {
                    timer = undefined;
                    dequeue();
                },
                wait,
            );
        }
    };

    return function enqueue(this: any, ...args: Parameters<C>): void {
        queue.push(callback.bind(this, ...args));
        dequeue();
    };
}
