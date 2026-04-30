import { config } from "dotenv";

const NODE_ENV = process.env.NODE_ENV || "development";
if (NODE_ENV !== "production") config({ path: `.env.${NODE_ENV}.local` });

export const PORT        = process.env.PORT        || 4000;
export const API_URL     = process.env.API_URL     || "http://localhost:3000";
export const SESSION_SECRET = process.env.SESSION_SECRET || "change-me";
export const NODE_ENV_VALUE = NODE_ENV;
