import { GlobalServiceProvider } from "../micro-node";
import {
    createConnection,
    PromiseConnection,
    createPool
} from "mysql2/promise";
import { LocalLogger } from "../micro-node/LocalLogger";
import { camel } from "case";

export const databaseServiceProvider = new GlobalServiceProvider<DB | void>(
    "db",
    ["localLogger"],
    getGlobalServicePayload => {
        const localLogger = getGlobalServicePayload<LocalLogger>(
            "localLogger"
        ).tag("DB");

        let connectionPool = createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_SCHEMA,
            namedPlaceholders: true
        });

        const prepareData = ([results, meta]) => {
            const cache = {};
            const cacheCamel = (snake: string) => {
                if (cache[snake]) return cache[snake];
                cache[snake] = camel(snake);
                return cache[snake];
            };
            return results.map(result => {
                const camelResult = {};
                for (const snakeName in result) {
                    if (!result.hasOwnProperty(snakeName)) continue;
                    camelResult[cacheCamel(snakeName)] = result[snakeName];
                }
                return camelResult;
            });
        };

        const query = (sql: string, placeholders?: object) => {
            return connectionPool
                .query(sql, placeholders)
                .catch(error => {
                    localLogger.warning(
                        "Connection error. Message:",
                        error.message
                    );
                    return Promise.reject(error);
                })
                .then(prepareData);
        };

        const execute = (sql: string, placeholders?: object) => {
            return connectionPool.execute(sql, placeholders).catch(error => {
                localLogger.warning(
                    "Connection error. Message:",
                    error.message
                );
                return Promise.reject(error);
            });
        };

        return Promise.resolve({
            query,
            execute
        });
    }
);

export interface DB {
    query(query: string, placeholders?: object): Promise<any[]>;
    execute(query: string, placeholders?: object): Promise<any[]>;
}
