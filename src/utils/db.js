import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    user: "postgres",               // ton rôle PostgreSQL
    password: "123456",             // mot de passe
    host: "localhost",
    port: 5432,
    database: "lmsconnector"
});

export default pool;
