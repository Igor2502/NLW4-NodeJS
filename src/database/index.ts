import { Connection, createConnection, getConnectionOptions } from "typeorm";

export default async (): Promise<Connection> => {
    const defaultOtions = await getConnectionOptions();

    return createConnection(
        Object.assign(defaultOtions, {
            database: process.env.NODE_ENV === "test"
                ? "./src/database/database.test.sqlite"
                : defaultOtions.database,
        })
    );
}