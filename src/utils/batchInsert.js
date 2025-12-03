import db from "./db.js";

/**
 * Insert rows in batch into PostgreSQL
 * @param {string} table - nom de la table
 * @param {Array} columns - tableau des colonnes ["col1", "col2", ...]
 * @param {Array} rows - tableau de tableau de valeurs [[v1,v2,...],[...]]
 * @param {number} batchSize
 */
export async function batchInsert(table, columns, rows, batchSize = 1000) {
    if (!rows || rows.length === 0) return;

    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const placeholders = batch
            .map((r, idx) => `(${r.map((_, j) => `$${idx * r.length + j + 1}`).join(",")})`)
            .join(",");
        const flatValues = batch.flat();
        const query = `INSERT INTO ${table}(${columns.join(",")}) VALUES ${placeholders} ON CONFLICT DO NOTHING`;
        await db.query(query, flatValues);
    }
}
