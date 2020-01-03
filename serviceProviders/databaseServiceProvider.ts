import { GlobalServiceProvider } from "../micro-node";
import { createConnection } from "mysql2/promise";
import { LocalLogger } from "../micro-node/LocalLogger";
import { camel } from "case";

export const databaseServiceProvider = new GlobalServiceProvider<DB | void>(
    "db",
    ["localLogger"],
    getGlobalServicePayload => {
        const localLogger = getGlobalServicePayload<LocalLogger>(
            "localLogger"
        ).tag("DB");

        const tryConnection = (tries = 1): Promise<any> => {
            localLogger.info("connecting");
            return new Promise((resolve, reject) => {
                return createConnection({
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_SCHEMA,
                    namedPlaceholders: true,
                    connectTimeout: 10000
                })
                    .then(resolve)
                    .catch(reason => {
                        if (tries < 100) {
                            localLogger.warning(
                                `Connection failed, tries ${tries}, reason:`,
                                reason
                            );
                            setTimeout(
                                () => resolve(tryConnection(tries++)),
                                500
                            );
                        } else {
                            localLogger.error(
                                `Connection failed, aborting, reason:`,
                                reason
                            );
                            reject(reason);
                        }
                    });
            });
        };
        return tryConnection()
            .then(connection => {
                localLogger.success("Connection successful");
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
                            camelResult[cacheCamel(snakeName)] =
                                result[snakeName];
                        }
                        return camelResult;
                    });
                };
                return {
                    query(sql: string, placeholders?: object) {
                        return connection
                            .query(sql, placeholders)
                            .then(prepareData);
                    },
                    execute(sql: string, placeholders?: object) {
                        return connection.execute(sql, placeholders);
                    }
                };
            })
            .catch(err => {
                localLogger.error("Connection failed:", err);
            });
    }
);

export interface DB {
    query(query: string, placeholders?: object): Promise<[any]>;
    execute(query: string, placeholders?: object): Promise<[any]>;
}
