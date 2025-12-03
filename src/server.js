import express from "express";
import multer from "multer";
import checkOAuth from "./middleware/auth.js";
import { setupSwagger } from "./utils/swagger.js";
import pool from "./utils/db.js";

import {
    importStudentInfo,
    importStudentVle,
    importStudentAssessment,
    importCourses,
    importRegistrations,
    importVleInfo,
    importAssessments
} from "./services/import.service.js";

const app = express();
const upload = multer({ dest: "uploads/" });

// Middleware JSON
app.use(express.json());

// Swagger
setupSwagger(app);

// ---------------------------------------------
// Helper pour gérer les imports CSV
// ---------------------------------------------
async function handleImport(req, res, importFunction, message) {
    try {
        await importFunction(req.file.path);
        res.status(200).json({ message });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
}

// ---------------------------------------------
// POST — IMPORT CSV vers PostgreSQL
// ---------------------------------------------
app.post("/student-info", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importStudentInfo, "StudentInfo imported")
);

app.post("/student-vle", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importStudentVle, "StudentVLE imported")
);

app.post("/student-assessment", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importStudentAssessment, "StudentAssessment imported")
);

app.post("/courses", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importCourses, "Courses imported")
);

app.post("/registrations", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importRegistrations, "Registrations imported")
);

app.post("/vle-info", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importVleInfo, "VLE Info imported")
);

app.post("/assessments", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importAssessments, "Assessments imported")
);

// ------------------------------------------------------
// GET — Microservice suivant récupère les données JSON
// ------------------------------------------------------

// GET all students
app.get("/students", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM students");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all courses
app.get("/courses", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM courses");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all registrations
app.get("/registrations", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM registrations");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all VLE info
app.get("/vle-info", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM vle_info");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all learning logs
app.get("/learning-logs", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM learning_logs");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all assessments
app.get("/assessments", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM assessments");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all student assessment logs
app.get("/student-assessment", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM studentassessment");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serveur
app.listen(3001, () => console.log("LMSConnector running on port 3001"));
