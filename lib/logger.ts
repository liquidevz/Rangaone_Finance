const isProduction = process.env.NODE_ENV === 'production';

/**
 * Simple logger utility to control logging output based on environment.
 * In production, debug and info logs are suppressed to prevent log flooding.
 */
export const logger = {
    log: (...args: any[]) => {
        if (!isProduction) {
            console.log(...args);
        }
    },
    info: (...args: any[]) => {
        if (!isProduction) {
            console.info(...args);
        }
    },
    warn: (...args: any[]) => {
        console.warn(...args);
    },
    error: (...args: any[]) => {
        console.error(...args);
    },
    debug: (...args: any[]) => {
        if (!isProduction) {
            console.debug(...args);
        }
    }
};
