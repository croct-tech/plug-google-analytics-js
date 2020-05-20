import croct from '@croct/plug';
import {PluginArguments} from '@croct/plug/plugin';
import GoogleAnalyticsPlugin, {Options, optionsSchema} from './plugin';

declare module '@croct/plug/plug' {
    export interface PluginConfigurations {
        googleAnalytics?: Options;
    }
}

croct.extend('googleAnalytics', ({options, sdk}: PluginArguments<Options>) => {
    optionsSchema.validate(options);

    return new GoogleAnalyticsPlugin(
        {
            variable: options.variable ?? 'ga',
            category: options.category ?? 'Croct',
        },
        sdk.tracker,
        sdk.getLogger(),
    );
});