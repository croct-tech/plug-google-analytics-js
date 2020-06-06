import croct from '@croct/plug';
import {PluginArguments} from '@croct/plug/plugin';
import GoogleAnalyticsPlugin, {Options, optionsSchema} from './plugin';

declare module '@croct/plug/plug' {
    export interface PluginConfigurations {
        googleAnalytics?: Partial<Options> | boolean;
    }
}

croct.extend('googleAnalytics', ({options, sdk}: PluginArguments<Partial<Options>>) => {
    optionsSchema.validate(options);

    return new GoogleAnalyticsPlugin(
        {
            ...options,
            variable: options.variable ?? 'ga',
            category: options.category ?? 'Croct',
            events: options.events ?? {},
        },
        sdk.tracker,
        sdk.getLogger(),
    );
});
