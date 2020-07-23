import {Logger} from '@croct/plug/sdk';
import {Tracker} from '@croct/plug/sdk/tracking';

export function createLoggerMock(): Logger {
    return {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}

export function createTrackerMock(): Tracker {
    const {
        Tracker: TrackerMock,
    } = jest.genMockFromModule<{Tracker: {new(): Tracker}}>('@croct/plug/sdk/tracking');

    return new TrackerMock();
}
