import {Logger} from '@croct/plug/sdk';
import {EventInfo, Tracker} from '@croct/plug/sdk/tracking';
import {ObjectType, StringType} from '@croct/plug/sdk/validation';
import {Plugin} from '@croct/plug/plugin';

type Send = (command: string, hitType: string, category: string, action: string, label: string, value?: number) => {};

export type Options = {
    variable: string,
    category: string,
}

export const optionsSchema = new ObjectType({
    properties: {
        variable: new StringType({
            format: 'identifier',
        }),
        category: new StringType({
            minLength: 1,
        }),
    },
});

export default class GoogleAnalyticsPlugin implements Plugin {
    private readonly tracker: Tracker;

    private readonly logger: Logger;

    private readonly options: Options;

    public constructor(options: Options, tracker: Tracker, logger: Logger) {
        this.options = options;
        this.tracker = tracker;
        this.logger = logger;
        this.track = this.track.bind(this);
    }

    public enable(): void {
        this.tracker.addListener(this.track);
    }

    public disable(): void {
        this.tracker.removeListener(this.track);
    }

    private track({event, status}: EventInfo): void {
        if (status !== 'confirmed') {
            return;
        }

        switch (event.type) {
            case 'testGroupAssigned': {
                this.send(event.type, `testId: ${event.testId}, groupId: ${event.groupId}`);
                break;
            }

            case 'goalCompleted': {
                const entries: string[] = [`goalId: ${event.goalId}`];

                if (event.currency !== undefined) {
                    entries.push(`currency: ${event.currency}`);
                }

                this.send(event.type, entries.join(', '), event.value);
                break;
            }

            case 'eventOccurred': {
                const entries: string[] = [];

                if (event.testId !== undefined) {
                    entries.push(`testId: ${event.testId}`);
                }

                if (event.groupId !== undefined) {
                    entries.push(`groupId: ${event.groupId}`);
                }

                if (event.personalizationId !== undefined) {
                    entries.push(`personalizationId: ${event.personalizationId}`);
                }

                if (event.audience !== undefined) {
                    entries.push(`audience: ${event.audience}`);
                }

                this.send(event.name, entries.join(', '));
                break;
            }
        }
    }

    private send(action: string, label: string, value?: number): void {
        const ga: Send = window[this.options.variable as any] as unknown as Send;

        if (typeof ga !== 'function') {
            this.logger.error(`Google Analytics variable "${this.options.variable}" is not a function.`);

            return;
        }

        if (value === undefined) {
            ga('send', 'event', this.options.category, action, label);
        } else {
            ga('send', 'event', this.options.category, action, label, value);
        }

        this.logger.debug(`Event "${action}" sent to Google Analytics.`);
    }
}
