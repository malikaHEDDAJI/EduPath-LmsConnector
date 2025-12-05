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

// ---------------------------
// IMPORT STUDENT VLE
// ---------------------------


// Fonctions utilitaires pour nettoyer les données
function safeInt(value) {
    const n = parseInt(value);
    return isNaN(n) ? null : n;
}

function safeDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

function safeString(value) {
    if (!value) return null;
    const str = String(value).trim();
    return str.length === 0 ? null : str;
}

// Import StudentVLE avec filtration des doublons
export async function importStudentVle(path) {
    const client = await pool.connect();
    try {
        console.log("Rôle connecté:", (await client.query("SELECT current_user")).rows[0].current_user);

        const seen = new Set();

        const stream = client.query(copyFrom(`
            COPY studentvle(code_module, code_presentation, id_student, id_site, activity_date, sum_click)
            FROM STDIN WITH CSV HEADER
        `));

        const transformStream = new Transform({
            writableObjectMode: true,
            readableObjectMode: false,
            transform(row, encoding, callback) {
                const code_module = safeString(row.code_module);
                const code_presentation = safeString(row.code_presentation);
                const id_student = safeInt(row.id_student);
                const id_site = safeInt(row.id_site);
                const activity_date = safeDate(row.date || row.activity_date);
                const sum_click = safeInt(row.sum_click || 0);

                // Vérifier données essentielles
                if (!code_module || !code_presentation || !id_student || !id_site || !activity_date) {
                    return callback(); // ignore lignes incomplètes
                }

                // Générer une clé unique pour filtrer les doublons
                const key = `${code_module}|${code_presentation}|${id_student}|${id_site}|${activity_date}`;
                if (seen.has(key)) return callback(); // doublon → ignore
                seen.add(key);

                const line = [code_module, code_presentation, id_student, id_site, activity_date, sum_click].join(",") + "\n";
                this.push(line);
                callback();
            }
        });

        await new Promise((resolve, reject) => {
            fs.createReadStream(path)
                .pipe(csvParser())
                .pipe(transformStream)
                .pipe(stream)
                .on("finish", resolve)
                .on("error", reject);
        });

        console.log("StudentVLE importé avec succès !");
    } finally {
        client.release();
    }
}

// ---------------------------
// IMPORT STUDENT ASSESSMENT
// ---------------------------

/**
 * Convertit un entier → date (YYYY-MM-DD)
 */
function convertAssessmentDate(n) {
    const val = parseInt(n, 10);
    if (isNaN(val)) return "";

    const d = new Date(1970, 0, 1);
    d.setDate(d.getDate() + val);
    return d.toISOString().split("T")[0];
}

export async function importStudentAssessment(path) {
    const client = await pool.connect();
    try {
        const copyStream = client.query(copyFrom(`
            COPY studentassessment(student_id, activity_date, activity_type, score, assessment_type)
            FROM STDIN WITH CSV HEADER
        `));

        const transform = new Transform({
            writableObjectMode: true,
            readableObjectMode: false,
            transform(row, enc, cb) {
                if (!row.id_student) return cb();

                const activity_date = convertAssessmentDate(row.date_submitted);

                const line = [
                    row.id_student,
                    activity_date,
                    row.id_assessment,   // stocké comme activity_type
                    row.score,
                    row.is_banked        // ou "0"/"1"
                ].join(",") + "\n";

                this.push(line);
                cb();
            }
        });

        fs.createReadStream(path)
            .pipe(csvParser())
            .pipe(transform)
            .pipe(copyStream);

        await new Promise((resolve, reject) => {
            copyStream.on("finish", resolve);
            copyStream.on("error", reject);
        });

        console.log("StudentAssessment importé !");
    } finally {
        client.release();
    }
}
