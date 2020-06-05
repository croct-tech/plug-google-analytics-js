import {EventInfo} from '@croct/plug/sdk/tracking';
import {Event, ExternalEvent} from '@croct/plug/sdk/event';
import GoogleAnalyticsPlugin, {Options} from '../src/plugin';
import {createLoggerMock, createTrackerMock} from './mocks';

beforeEach(() => {
    Object.defineProperty(window, 'analytics', {
        value: jest.fn(),
        writable: true,
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('A Google Analytics plugin', () => {
    test('should use the default variable and category to track events if they are not specified', async () => {
        const analytics = jest.spyOn(window as any, 'analytics');

        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });

        const options: Options = {
            variable: 'analytics',
            category: 'Croct',
            events: {},
        };

        const plugin = new GoogleAnalyticsPlugin(options, tracker, logger);

        await plugin.enable();

        const event: ExternalEvent<'goalCompleted'> = {
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

        expect(logger.debug).toHaveBeenCalledWith('Event "goalCompleted" sent to Google Analytics.');
        expect(analytics).toHaveBeenCalledWith('send', 'event', 'Croct', 'goalCompleted', 'goalId: someGoal', 1.2);
    });

    test.each<[string, string, number|undefined, Event]>([
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
        'should track an event with label %s by default',
        async (label: string, name: string, value: number|undefined, event: Event) => {
            const analytics = jest.spyOn(window as any, 'analytics');

            const logger = createLoggerMock();
            const tracker = createTrackerMock();

            let listener: (event: EventInfo) => void = jest.fn();
            tracker.addListener = jest.fn().mockImplementation(callback => {
                listener = callback;
            });

            const options: Options = {
                variable: 'analytics',
                category: 'foo',
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

            expect(logger.debug).toHaveBeenCalledWith(`Event "${name}" sent to Google Analytics.`);

            if (value === undefined) {
                expect(analytics).toHaveBeenCalledWith('send', 'event', 'foo', name, label);
            } else {
                expect(analytics).toHaveBeenCalledWith('send', 'event', 'foo', name, label, value);
            }
        },
    );

    test.each<[string, Event]>([
        [
            'goalCompleted',
            {
                type: 'goalCompleted',
                goalId: 'someGoal',
            },
        ],
        [
            'goalCompleted',
            {
                type: 'goalCompleted',
                goalId: 'someGoal',
                value: 1.2,
                currency: 'BRL',
            },
        ],
        [
            'testGroupAssigned',
            {
                type: 'testGroupAssigned',
                testId: 'someTest',
                groupId: 'someGroup',
            },
        ],
        [
            'eventOccurred',
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
            'eventOccurred',
            {
                type: 'eventOccurred',
                name: 'personalizationApplied',
                personalizationId: 'someId',
                details: {
                    foo: 'bar',
                },
            },
        ],
    ])('should not track event %s if not whitelisted', async (name: string, event: Event) => {
        const analytics = jest.spyOn(window as any, 'analytics');

        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });

        const options: Options = {
            variable: 'analytics',
            category: 'foo',
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

        expect(analytics).not.toHaveBeenCalledWith('send', 'event', 'foo', name, expect.anything());
    });

    test('should track confirmed events only', async () => {
        const analytics = jest.spyOn(window as any, 'analytics');

        const logger = createLoggerMock();
        const tracker = createTrackerMock();

        let listener: (event: EventInfo) => void = jest.fn();
        tracker.addListener = jest.fn().mockImplementation(callback => {
            listener = callback;
        });

        const options: Options = {
            variable: 'analytics',
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
            timestamp: 0,
            event: {
                type: 'goalCompleted',
                goalId: 'someGoal',
            },
            status: 'pending',
        });

        expect(analytics).not.toHaveBeenCalled();
    });

    test('should not track events after the extension is disabled', async () => {
        const analytics = jest.spyOn(window as any, 'analytics');

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
            variable: 'analytics',
            category: 'foo',
            events: {},
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

        expect(logger.debug).toHaveBeenCalledTimes(1);
        expect(logger.debug).toHaveBeenCalledWith('Event "goalCompleted" sent to Google Analytics.');
        expect(analytics).toHaveBeenCalledTimes(1);
        expect(analytics).toHaveBeenCalledWith('send', 'event', 'foo', 'goalCompleted', 'goalId: someGoal');
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
            events: {},
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

        expect(logger.error).toHaveBeenCalledWith('Google Analytics variable "bar" is not a function.');
    });
});
