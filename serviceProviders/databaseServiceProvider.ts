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

        let currentConnection = null;

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
                    .then(connection => {
                        currentConnection = connection;
                        localLogger.success("Connection successful");
                        resolve(connection);
                    })
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
            return currentConnection
                .query(sql, placeholders)
                .catch(reason => {
                    localLogger.warning(
                        "Connection dropped. Reconnecting, reason:",
                        reason
                    );
                    return tryConnection().then(() => {
                        return query(sql, placeholders);
                    });
                })
                .then(prepareData);
        };

        const execute = (sql: string, placeholders?: object) => {
            return currentConnection
                .execute(sql, placeholders)
                .catch(reason => {
                    localLogger.warning(
                        "Connection dropped. Reconnecting, reason:",
                        reason
                    );
                    return tryConnection().then(() => {
                        return execute(sql, placeholders);
                    });
                });
        };

        return tryConnection()
            .then(connection => {
                return {
                    query,
                    execute
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
