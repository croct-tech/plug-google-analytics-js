import croct from '@croct/plug';
import '../src/index';
import {PluginFactory, PluginSdk} from '@croct/plug/plugin';
import {createLoggerMock, createTrackerMock} from './mocks';
import GoogleAnalyticsPlugin, {Options} from '../src/plugin';

jest.mock('@croct/plug', () => ({
    default: {
        extend: jest.fn(),
    },
    __esModule: true,
}));

jest.mock('../src/plugin', () => {
    const actual = jest.requireActual('../src/plugin');

    return {
        ...actual,
        default: jest.fn(),
        __esModule: true,
    };
});

beforeEach(() => {
    (GoogleAnalyticsPlugin as jest.Mock).mockReset();
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('A Google Analytics plugin installer', () => {
    test('should register the plugin with default options', () => {
        expect(croct.extend).toBeCalledWith('googleAnalytics', expect.anything());

        const [, factory]: [string, PluginFactory] = (croct.extend as jest.Mock).mock.calls[0];

        const tracker = createTrackerMock();
        const logger = createLoggerMock();

        const sdk: Partial<PluginSdk> = {
            tracker: tracker,
            getLogger: () => logger,
        };

        factory({options: {}, sdk: sdk as PluginSdk});

        const options: Options = {
            variable: 'ga',
            category: 'Croct',
            events: {},
        };

        expect(GoogleAnalyticsPlugin).toBeCalledTimes(1);
        expect(GoogleAnalyticsPlugin).toBeCalledWith(options, tracker, logger);
    });

    test('should register the plugin with the provided options', () => {
        expect(croct.extend).toBeCalledWith('googleAnalytics', expect.anything());

        const [, factory]: [string, PluginFactory] = (croct.extend as jest.Mock).mock.calls[0];

        const tracker = createTrackerMock();
        const logger = createLoggerMock();

        const sdk: Partial<PluginSdk> = {
            tracker: tracker,
            getLogger: () => logger,
        };

        const options: Options = {
            variable: 'foo',
            category: 'bar',
            events: {
                eventOccurred: false,
                goalCompleted: false,
                testGroupAssigned: false,
            },
            customEvents: {
                foo: true,
                bar: true,
            },
        };

        factory({options: options, sdk: sdk as PluginSdk});

        expect(GoogleAnalyticsPlugin).toBeCalledWith(options, tracker, logger);
    });

    test.each<[any]>([
        [
            {},
        ],
        [
            {variable: 'foo'},
        ],
        [
            {category: 'foo'},
        ],
        [
            {events: {}},
        ],
        [
            {events: {eventOccurred: true}},
        ],
        [
            {customEvents: {}},
        ],
        [
            {customEvents: {foo: true}},
        ],
        [
            {
                variable: 'foo',
                category: 'bar',
                events: {eventOccurred: true},
                customEvents: {someName: true},
            },
        ],
    ])('should accept options %p', (options: any) => {
        const [, factory]: [string, PluginFactory] = (croct.extend as jest.Mock).mock.calls[0];

        const sdk: Partial<PluginSdk> = {
            tracker: createTrackerMock(),
            getLogger: () => createLoggerMock(),
        };

        function create(): void {
            factory({options: options, sdk: sdk as PluginSdk});
        }

        expect(create).not.toThrowError();
    });

    test.each<[any, string]>([
        [
            {variable: 1},
            "Expected value of type string at path '/variable', actual integer.",
        ],
        [
            {variable: '1'},
            "Invalid identifier format at path '/variable'.",
        ],
        [
            {category: null},
            "Expected value of type string at path '/category', actual null.",
        ],
        [
            {category: ''},
            "Expected at least 1 character at path '/category', actual 0.",
        ],
        [
            {events: ''},
            "Expected value of type object at path '/events', actual string.",
        ],
        [
            {events: {1: true}},
            "Unknown property '/events/1'.",
        ],
        [
            {events: {foo: true}},
            "Unknown property '/events/foo'.",
        ],
        [
            {events: {testGroupAssigned: 1}},
            "Expected value of type boolean at path '/events/testGroupAssigned', actual integer.",
        ],
        [
            {customEvents: ''},
            "Expected value of type object at path '/customEvents', actual string.",
        ],
        [
            {customEvents: {foo: 1}},
            "Expected value of type boolean at path '/customEvents/foo', actual integer.",
        ],
    ])('should reject options %p', (options: any, error: string) => {
        const [, factory]: [string, PluginFactory] = (croct.extend as jest.Mock).mock.calls[0];

        const sdk: Partial<PluginSdk> = {
            tracker: createTrackerMock(),
            getLogger: () => createLoggerMock(),
        };

        function create(): void {
            factory({options: options, sdk: sdk as PluginSdk});
        }

        expect(create).toThrow(error);
    });
});
