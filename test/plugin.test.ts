import {EventInfo, ExternalTrackingEvent, TrackingEvent} from '@croct/plug/sdk/tracking';
import GoogleAnalyticsPlugin, {Options} from '../src/plugin';
import {createLoggerMock, createTrackerMock} from './mocks';

interface TrackerMock {
    send(hitType: string, ...fields: any[]): void;
}

type AnalyticsMock = {
    (callback: () => void): void,
    getAll(): TrackerMock[],
};

beforeEach(() => {
    const analytics: AnalyticsMock = jest.fn(callback => callback()) as any;
    analytics.getAll = jest.fn().mockReturnValue([
        {send: jest.fn()},
        {send: jest.fn()},
    ]);

    Object.defineProperty(window, 'ga', {
        value: analytics,
        writable: true,
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

const FOO_EVENT: EventInfo = {
    context: {
        tabId: 'tab-id',
        url: 'http://analytics.com',
    },
    event: {
        type: 'eventOccurred',
        name: 'foo',
    },
    timestamp: 0,
    status: 'confirmed',
};

const BAR_EVENT: EventInfo = {
    context: {
        tabId: 'tab-id',
        url: 'http://analytics.com',
    },
    event: {
        type: 'eventOccurred',
        name: 'bar',
    },
    timestamp: 1,
    status: 'confirmed',
};

describe('A Google Analytics plugin', () => {
    test('should send events to all registered trackers', async () => {
        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });

        const options: Options = {
            variable: 'ga',
            category: 'Croct',
            events: {goalCompleted: true},
        };

        const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

        await plugin.enable();

        const event: ExternalTrackingEvent<'goalCompleted'> = {
            type: 'goalCompleted',
            goalId: 'someGoal',
            value: 1.2,
        };

        listener({
            context: {
                tabId: 'tab-id',
                url: 'http://analytics.com',
            },
            timestamp: 0,
            event: event,
            status: 'confirmed',
        });

        const [firstGaTracker, secondGaTracker] = window.ga.getAll();

        expect(logger.debug).toHaveBeenCalledWith('Event "goalCompleted" sent to Google Analytics.');
        expect(firstGaTracker.send).toHaveBeenCalledWith('event', 'Croct', 'goalCompleted', 'goalId: someGoal', 1.2);
        expect(secondGaTracker.send).toHaveBeenCalledWith('event', 'Croct', 'goalCompleted', 'goalId: someGoal', 1.2);
    });

    test('should use the default variable and category to track events if they are not specified', async () => {
        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });

        const options: Options = {
            variable: 'ga',
            category: 'Croct',
            events: {goalCompleted: true},
        };

        const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

        await plugin.enable();

        const event: ExternalTrackingEvent<'goalCompleted'> = {
            type: 'goalCompleted',
            goalId: 'someGoal',
            value: 1.2,
        };

        listener({
            context: {
                tabId: 'tab-id',
                url: 'http://analytics.com',
            },
            timestamp: 0,
            event: event,
            status: 'confirmed',
        });

        const [gaTracker] = window.ga.getAll();

        expect(logger.debug).toHaveBeenCalledWith('Event "goalCompleted" sent to Google Analytics.');
        expect(gaTracker.send).toHaveBeenCalledWith('event', 'Croct', 'goalCompleted', 'goalId: someGoal', 1.2);
    });

    test.each<[TrackingEvent]>([
        [
            {
                type: 'goalCompleted',
                goalId: 'someGoal',
            },
        ],
        [
            {
                type: 'goalCompleted',
                goalId: 'someGoal',
                value: 1.2,
                currency: 'BRL',
            },
        ],
        [
            {
                type: 'testGroupAssigned',
                testId: 'someTest',
                groupId: 'someGroup',
            },
        ],
        [
            {
                type: 'eventOccurred',
                name: 'personalizationApplied',
                personalizationId: 'someId',
                audience: 'some-audience',
                testId: 'someTest',
                groupId: 'someGroup',
                details: {
                    foo: 'bar',
                },
            },
        ],
        [
            {
                type: 'eventOccurred',
                name: 'personalizationApplied',
                personalizationId: 'someId',
                details: {
                    foo: 'bar',
                },
            },
        ],
    ])('should not track events by default', async (event: TrackingEvent) => {
        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });

        const options: Options = {
            variable: 'ga',
            category: 'Croct',
            events: {},
        };

        const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

        await plugin.enable();

        listener({
            context: {
                tabId: 'tab-id',
                url: 'http://analytics.com',
            },
            event: event,
            timestamp: 0,
            status: 'confirmed',
        });

        const [gaTracker] = window.ga.getAll();

        expect(gaTracker.send).not.toHaveBeenCalled();
    });

    test.each<[string, string, number|undefined, TrackingEvent]>([
        [
            'goalId: someGoal',
            'goalCompleted',
            undefined,
            {
                type: 'goalCompleted',
                goalId: 'someGoal',
            },
        ],
        [
            ['goalId: someGoal', 'currency: BRL'].join(', '),
            'goalCompleted',
            1.2,
            {
                type: 'goalCompleted',
                goalId: 'someGoal',
                value: 1.2,
                currency: 'BRL',
            },
        ],
        [
            ['testId: someTest', 'groupId: someGroup'].join(', '),
            'testGroupAssigned',
            undefined,
            {
                type: 'testGroupAssigned',
                testId: 'someTest',
                groupId: 'someGroup',
            },
        ],
        [
            [
                'testId: someTest',
                'groupId: someGroup',
                'personalizationId: someId',
                'audience: some-audience',
            ].join(', '),
            'personalizationApplied',
            undefined,
            {
                type: 'eventOccurred',
                name: 'personalizationApplied',
                personalizationId: 'someId',
                audience: 'some-audience',
                testId: 'someTest',
                groupId: 'someGroup',
                details: {
                    foo: 'bar',
                },
            },
        ],
        [
            'personalizationId: someId',
            'personalizationApplied',
            undefined,
            {
                type: 'eventOccurred',
                name: 'personalizationApplied',
                personalizationId: 'someId',
                details: {
                    foo: 'bar',
                },
            },
        ],
    ])(
        'should track whitelisted event %s',
        async (label: string, name: string, value: number|undefined, event: TrackingEvent) => {
            const logger = createLoggerMock();
            const tracker = createTrackerMock();

            let listener: (event: EventInfo) => void = jest.fn();
            tracker.addListener = jest.fn().mockImplementation(callback => {
                listener = callback;
            });

            const options: Options = {
                variable: 'ga',
                category: 'foo',
                events: {
                    testGroupAssigned: true,
                    goalCompleted: true,
                    eventOccurred: true,
                },
            };

            const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

            await plugin.enable();

            listener({
                context: {
                    tabId: 'tab-id',
                    url: 'http://analytics.com',
                },
                event: event,
                timestamp: 0,
                status: 'confirmed',
            });

            const [gaTracker] = window.ga.getAll();

            expect(logger.debug).toHaveBeenCalledWith(`Event "${name}" sent to Google Analytics.`);

            if (value === undefined) {
                expect(gaTracker.send).toHaveBeenCalledWith('event', 'foo', name, label);
            } else {
                expect(gaTracker.send).toHaveBeenCalledWith('event', 'foo', name, label, value);
            }
        },
    );

    test.each<[TrackingEvent]>([
        [
            {
                type: 'goalCompleted',
                goalId: 'someGoal',
            },
        ],
        [
            {
                type: 'goalCompleted',
                goalId: 'someGoal',
                value: 1.2,
                currency: 'BRL',
            },
        ],
        [
            {
                type: 'testGroupAssigned',
                testId: 'someTest',
                groupId: 'someGroup',
            },
        ],
        [
            {
                type: 'eventOccurred',
                name: 'personalizationApplied',
                personalizationId: 'someId',
                audience: 'some-audience',
                testId: 'someTest',
                groupId: 'someGroup',
                details: {
                    foo: 'bar',
                },
            },
        ],
        [
            {
                type: 'eventOccurred',
                name: 'personalizationApplied',
                personalizationId: 'someId',
                details: {
                    foo: 'bar',
                },
            },
        ],
    ])('should not track blacklisted event %s', async (event: TrackingEvent) => {
        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });

        const options: Options = {
            variable: 'ga',
            category: 'Croct',
            events: {
                testGroupAssigned: false,
                goalCompleted: false,
                eventOccurred: false,
            },
        };

        const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

        await plugin.enable();

        listener({
            context: {
                tabId: 'tab-id',
                url: 'http://analytics.com',
            },
            event: event,
            timestamp: 0,
            status: 'confirmed',
        });

        const [gaTracker] = window.ga.getAll();

        expect(gaTracker.send).not.toHaveBeenCalled();
    });

    test(
        'should track all custom events if eventOccurred is whitelisted and no custom events are specified',
        async () => {
            const logger = createLoggerMock();
            const tracker = createTrackerMock();

            let listener: (event: EventInfo) => void = jest.fn();
            tracker.addListener = jest.fn().mockImplementation(callback => {
                listener = callback;
            });

            const options: Options = {
                variable: 'ga',
                category: 'Croct',
                events: {
                    eventOccurred: true,
                },
            };

            const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

            await plugin.enable();

            listener(FOO_EVENT);
            listener(BAR_EVENT);

            const [gaTracker] = window.ga.getAll();

            expect(gaTracker.send).toHaveBeenCalledTimes(2);
            expect(gaTracker.send).toHaveBeenNthCalledWith(1, 'event', 'Croct', 'foo', expect.anything());
            expect(gaTracker.send).toHaveBeenNthCalledWith(2, 'event', 'Croct', 'bar', expect.anything());
        },
    );

    test('should track only the specified custom events', async () => {
        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });

        const options: Options = {
            variable: 'ga',
            category: 'Croct',
            events: {
                eventOccurred: true,
            },
            customEvents: {
                foo: true,
            },
        };

        const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

        await plugin.enable();

        listener(FOO_EVENT);
        listener(BAR_EVENT);

        const [gaTracker] = window.ga.getAll();

        expect(gaTracker.send).toHaveBeenCalledTimes(1);
        expect(gaTracker.send).toHaveBeenCalledWith('event', 'Croct', 'foo', expect.anything());
        expect(gaTracker.send).not.toHaveBeenCalledWith('event', 'Croct', 'bar', expect.anything());
    });

    test('should not track custom events if eventOccurred is blacklisted', async () => {
        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });

        const options: Options = {
            variable: 'ga',
            category: 'Croct',
            events: {
                eventOccurred: false,
            },
        };

        const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

        await plugin.enable();

        listener(FOO_EVENT);
        listener(BAR_EVENT);

        const [gaTracker] = window.ga.getAll();

        expect(gaTracker.send).not.toHaveBeenCalled();
    });

    test(
        'should not track custom events if eventOccurred is blacklisted, even if custom events are specified',
        async () => {
            const logger = createLoggerMock();
            const tracker = createTrackerMock();

            let listener: (event: EventInfo) => void = jest.fn();
            tracker.addListener = jest.fn().mockImplementation(callback => {
                listener = callback;
            });

            const options: Options = {
                variable: 'ga',
                category: 'Croct',
                events: {
                    eventOccurred: false,
                },
                customEvents: {
                    foo: true,
                },
            };

            const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

            await plugin.enable();

            listener(FOO_EVENT);
            listener(BAR_EVENT);

            const [gaTracker] = window.ga.getAll();

            expect(gaTracker.send).not.toHaveBeenCalled();
        },
    );

    test(
        'should not track custom events if eventOccurred is not whitelisted, even if custom events are specified',
        async () => {
            const logger = createLoggerMock();
            const tracker = createTrackerMock();

            let listener: (event: EventInfo) => void = jest.fn();
            tracker.addListener = jest.fn().mockImplementation(callback => {
                listener = callback;
            });

            const options: Options = {
                variable: 'ga',
                category: 'Croct',
                events: {},
                customEvents: {
                    foo: true,
                },
            };

            const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

            await plugin.enable();

            listener(FOO_EVENT);
            listener(BAR_EVENT);

            const [gaTracker] = window.ga.getAll();

            expect(gaTracker.send).not.toHaveBeenCalled();
        },
    );

    test('should track confirmed events only', async () => {
        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });

        const options: Options = {
            variable: 'ga',
            category: 'Croct',
            events: {goalCompleted: true},
        };

        const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

        await plugin.enable();

        listener({
            context: {
                tabId: 'tab-id',
                url: 'http://analytics.com',
            },
            timestamp: 0,
            event: {
                type: 'goalCompleted',
                goalId: 'someGoal',
            },
            status: 'pending',
        });

        const [gaTracker] = window.ga.getAll();

        expect(gaTracker.send).not.toHaveBeenCalled();
    });

    test('should not track events after the extension is disabled', async () => {
        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });
        tracker.removeListener = jest.fn().mockImplementation(() => {
            listener = jest.fn();
        });

        const options: Options = {
            variable: 'ga',
            category: 'foo',
            events: {goalCompleted: true},
        };

        const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

        await plugin.enable();

        listener({
            context: {tabId: 'tab-id', url: 'http://analytics.com'},
            timestamp: 0,
            event: {type: 'goalCompleted', goalId: 'someGoal'},
            status: 'confirmed',
        });

        await plugin.disable();

        listener({
            context: {
                tabId: 'tab-id',
                url: 'http://analytics.com',
            },
            event: {
                type: 'eventOccurred',
                name: 'personalizationApplied',
                personalizationId: 'someId',
                details: {},
            },
            timestamp: 0,
            status: 'confirmed',
        });

        const [gaTracker] = window.ga.getAll();

        expect(logger.debug).toHaveBeenCalledTimes(1);
        expect(logger.debug).toHaveBeenCalledWith('Event "goalCompleted" sent to Google Analytics.');
        expect(gaTracker.send).toHaveBeenCalledTimes(1);
        expect(gaTracker.send).toHaveBeenCalledWith('event', 'foo', 'goalCompleted', 'goalId: someGoal');
    });

    test('should not track events if the specified variable is undefined', async () => {
        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });

        const options: Options = {
            variable: 'bar',
            category: 'foo',
            events: {goalCompleted: true},
        };

        const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

        await plugin.enable();

        listener({
            context: {
                tabId: 'tab-id',
                url: 'http://analytics.com',
            },
            event: {
                type: 'goalCompleted',
                goalId: 'someGoal',
            },
            timestamp: 0,
            status: 'confirmed',
        });

        expect(logger.error).toHaveBeenCalledWith('The analytics.js variable "bar" is undefined.');
    });
});
