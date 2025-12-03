import fs from "fs";
import db from "../utils/db.js";
import normalize from "./normalize.service.js";
import { from as copyFrom } from "pg-copy-streams";
import pool from "../utils/db.js"; 
import csvParser from "csv-parser"; 
import { Transform } from "stream"; 
import readline from "readline";

function parseDate(d) {
    if (!d) return null;

    // essayer de parser en date
    const date = new Date(d);
    if (isNaN(date.getTime())) return null; // invalide -> NULL

    // renvoyer en format PostgreSQL
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}


/**
 * Load CSV en mémoire (pour petits fichiers)
 */
export function loadCSV(path) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(path)
            .pipe(csvParser())
            .on("data", (data) => rows.push(data))
            .on("end", () => resolve(rows))
            .on("error", reject);
    });
}

/**
 * Insert rows en batch dans PostgreSQL
 * @param {string} table - nom de la table
 * @param {Array} columns - colonnes de la table
 * @param {Array} rows - tableau de valeurs [[v1,v2],[v1,v2],...]
 * @param {number} batchSize
 */
export async function batchInsert(table, columns, rows, batchSize = 500) {
    if (!rows || rows.length === 0) return;

    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const placeholders = batch
            .map((r, idx) =>
                `(${r.map((_, j) => `$${idx * r.length + j + 1}`).join(",")})`
            )
            .join(",");
        const flatValues = batch.flat();
        const query = `INSERT INTO ${table}(${columns.join(",")}) VALUES ${placeholders} ON CONFLICT DO NOTHING`;
        await db.query(query, flatValues);
    }
}

// ---------------------------
// Import Students
// ---------------------------
export function normalizeStudentInfo(data) {
    return data.map((r) => ({
        student_id: r.id_student || null,
        code_module: r.code_module || null,
        code_presentation: r.code_presentation || null,
        gender: r.gender || null,
        region: r.region || null,
        highest_education: r.highest_education || null,
        imd_band: r.imd_band || null,
        age_band: r.age_band || null,
        num_of_prev_attempts: r.num_of_prev_attempts
            ? parseInt(r.num_of_prev_attempts)
            : null,
        studied_credits: r.studied_credits
            ? parseInt(r.studied_credits)
            : null,
        disability: r.disability || null,
        final_result: r.final_result || null,
    }));
}

export async function importStudentInfo(path) {
    const data = await loadCSV(path);
    const normalized = normalizeStudentInfo(data);

    const rows = normalized.map((r) => [
        r.student_id,
        r.code_module,
        r.code_presentation,
        r.gender,
        r.region,
        r.highest_education,
        r.imd_band,
        r.age_band,
        r.num_of_prev_attempts,
        r.studied_credits,
        r.disability,
        r.final_result,
    ]);

    await batchInsert(
        "students",
        [
            "student_id",
            "code_module",
            "code_presentation",
            "gender",
            "region",
            "highest_education",
            "imd_band",
            "age_band",
            "num_of_prev_attempts",
            "studied_credits",
            "disability",
            "final_result",
        ],
        rows
    );

    console.log(`Import des étudiants terminé : ${rows.length} lignes insérées`);
}


// ---------------------------
// Import Courses
// ---------------------------
export async function importCourses(path) {
    const data = await loadCSV(path);
    const normalized = normalize.courses(data);

    const rows = normalized.map(r => [
        r.code_module || null,
        r.code_presentation || null,
        parseInt(r.module_presentation_length) || null
    ]);

    await batchInsert("courses",
        ["code_module","code_presentation","module_presentation_length"],
        rows
    );
}

// ---------------------------
// Import Registrations
// ---------------------------
function normalizeDate(d) {
    if (!d) return null;

    // Déjà au format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;

    // Si format YY-MM-DD
    if (/^\d{2}-\d{2}-\d{2}$/.test(d)) {
        const [yy, mm, dd] = d.split("-");
        const year = parseInt(yy, 10);
        const fullYear = year >= 70 ? 1900 + year : 2000 + year;
        return `${fullYear}-${mm}-${dd}`;
    }

    // Autres formats → essayer de parser
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export async function importRegistrations(path) {
    const data = await loadCSV(path);
    const normalized = normalize.registrations(data);

    const rows = normalized.map(r => [
        r.student_id,
        r.code_module || null,
        r.code_presentation || null,
        normalizeDate(r.date_registration),
        normalizeDate(r.date_unregistration)
    ]);

    await batchInsert(
        "registrations",
        ["student_id","code_module","code_presentation","date_registration","date_unregistration"],
        rows
    );
}


// ---------------------------
// Import VLE Info
// ---------------------------
export async function importVleInfo(path) {
    const data = await loadCSV(path);
    const normalized = normalize.vleInfo(data);

    const rows = normalized.map(r => [
        r.id_site,
        r.code_module || null,
        r.code_presentation || null,
        r.activity_type || null,
        r.week_from || null,
        r.week_to || null
    ]);

    await batchInsert("vle_info",
        ["id_site","code_module","code_presentation","activity_type","week_from","week_to"],
        rows
    );
}


// ---------------------------
// Import Student VLE (batch insert)
// ---------------------------

/**
 * Normalise la date au format YYYY-MM-DD
 */
function normalizeActivityDate(val) {
    if (!val) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0 && n < 36525) {
        const baseDate = new Date(Date.UTC(1970, 0, 1));
        baseDate.setUTCDate(baseDate.getUTCDate() + n);
        const yyyy = baseDate.getUTCFullYear();
        const mm = String(baseDate.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(baseDate.getUTCDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    return null;
}

/**
 * Prétraite le CSV avec readline + writeStream
 */
async function preprocessCSV(inputPath, outputPath) {
    const rl = readline.createInterface({
        input: fs.createReadStream(inputPath),
        crlfDelay: Infinity
    });

    const outStream = fs.createWriteStream(outputPath);

    let isHeader = true;
    for await (const line of rl) {
        if (isHeader) {
            outStream.write("student_id,module,presentation,activity_date,activity_type,clicks\n");
            isHeader = false;
            continue;
        }

        if (!line.trim()) continue;

        const parts = line.split(",");
        const student_id = parts[2] || null;       // id_student
        const module = parts[0] || null;           // code_module
        const presentation = parts[1] || null;     // code_presentation
        const activity_date = normalizeActivityDate(parts[4]);
        const activity_type = parts[3] || null;    // id_site
        const clicks = parts[5] ? parseInt(parts[5], 10) : 0;

        if (!student_id || !activity_date) continue;

        outStream.write([student_id, module, presentation, activity_date, activity_type, clicks].join(",") + "\n");
    }

    outStream.end();
    return new Promise(resolve => outStream.on("finish", resolve));
}

/**
 * Import Student VLE
 */
export async function importStudentVle(path) {
    const client = await pool.connect();
    try {
        console.log("Rôle connecté:", (await client.query("SELECT current_user")).rows[0].current_user);

        const tmpPath = path + ".tmp.csv";
        await preprocessCSV(path, tmpPath);

        const stream = client.query(copyFrom(`
            COPY learning_logs(student_id, module, presentation, activity_date, activity_type, clicks)
            FROM STDIN WITH CSV HEADER
        `));

        const fileStream = fs.createReadStream(tmpPath);
        await new Promise((resolve, reject) => {
            fileStream.pipe(stream)
                .on("finish", resolve)
                .on("error", reject);
        });

        console.log("StudentVLE imported");
        fs.unlinkSync(tmpPath);
    } finally {
        client.release();
    }
}


// ---------------------------
// Import Student Assessment (streaming COPY)
// ---------------------------

// ---------------------------
// Parse activity_date
// ---------------------------
function parseActivityDate(val) {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    const n = parseInt(val);
    if (isNaN(n)) return "";

    const date = new Date(1970, 0, 1);
    date.setDate(date.getDate() + n);
    return date.toISOString().split("T")[0];
}

// ---------------------------
// Import Student Assessment (streaming COPY)
// ---------------------------
export async function importStudentAssessment(path) {
    const client = await pool.connect();

    try {
        console.log("Rôle connecté:", (await client.query("SELECT current_user")).rows[0].current_user);

        const stream = client.query(copyFrom(`
            COPY studentassessment(student_id, activity_date, activity_type, score, assessment_type)
            FROM STDIN WITH CSV HEADER
        `));

        const readStream = fs.createReadStream(path);

        // Transform pour nettoyer et normaliser les données
        const transformStream = new Transform({
            writableObjectMode: true,
            readableObjectMode: false,
            transform(row, encoding, callback) {
                const student_id = row.student_id;
                if (!student_id) return callback(); // ignore ligne si student_id manquant

                const activity_date = parseActivityDate(row.activity_date);
                const activity_type = row.activity_type || "unknown";
                const score = row.score || "";
                const assessment_type = row.assessment_type || "";

                const line = [student_id, activity_date, activity_type, score, assessment_type].join(",") + "\n";
                this.push(line);
                callback();
            }
        });

        // Pipeline CSV -> transform -> COPY
        readStream
            .pipe(csvParser())   // Parse CSV en objets
            .pipe(transformStream) // Nettoyer / normaliser
            .pipe(stream)          // Envoi vers PostgreSQL
            .on("finish", () => console.log("Student Assessment importé avec COPY !"))
            .on("error", (err) => console.error("Erreur COPY :", err));

        await new Promise((resolve, reject) => {
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

    } finally {
        client.release();
    }
}

// ---------------------------
// Import Assessments (batch insert)
// ---------------------------
export async function importAssessments(path) {
    const batch = [];
    const batchSize = 1000;

    return new Promise((resolve, reject) => {
        fs.createReadStream(path)
            .pipe(csvParser())
            .on("data", (row) => {
                if (!row.code_module || !row.id_assessment) return;

                const assessment_date = normalizeDate(row.date); // renommer parseDate en normalizeDate
                const weight = parseFloat(row.weight) || null;

                batch.push([
                    row.code_module || null,
                    row.code_presentation || null,
                    row.id_assessment || null,
                    row.assessment_type || null,
                    assessment_date,
                    weight
                ]);

                if (batch.length >= batchSize) {
                    fs.pause();
                    batchInsert(
                        "assessments",
                        ["code_module","code_presentation","id_assessment","assessment_type","assessment_date","weight"],
                        batch
                    )
                    .then(() => { batch.length = 0; fs.resume(); })
                    .catch(reject);
                }
            })
            .on("end", async () => {
                if (batch.length > 0) {
                    await batchInsert(
                        "assessments",
                        ["code_module","code_presentation","id_assessment","assessment_type","assessment_date","weight"],
                        batch
                    );
                }
                resolve();
            })
            .on("error", reject);
    });
}
