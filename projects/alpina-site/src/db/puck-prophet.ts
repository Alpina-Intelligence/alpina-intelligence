import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./puck-prophet-schema";

export const ppDb = drizzle(process.env.PUCK_PROPHET_DB_URL!, { schema });
