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
        if (!req.file) return res.status(400).json({ error: "Aucun fichier envoyé" });
        await importFunction(req.file.path);
        res.status(200).json({ message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

// ---------------------------------------------
// POST — IMPORT CSV vers PostgreSQL
// ---------------------------------------------
app.post("/student-info", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importStudentInfo, "StudentInfo importé")
);

app.post("/student-vle", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importStudentVle, "StudentVLE importé avec succès")
);

app.post("/student-assessment", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importStudentAssessment, "StudentAssessment importé")
);

app.post("/courses", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importCourses, "Courses importés")
);

app.post("/registrations", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importRegistrations, "Registrations importées")
);

app.post("/vle-info", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importVleInfo, "VLE Info importé")
);

app.post("/assessments", checkOAuth, upload.single("file"), (req, res) =>
    handleImport(req, res, importAssessments, "Assessments importés")
);

// ------------------------------------------------------
// GET — Microservice suivant récupère les données JSON
// ------------------------------------------------------
app.get("/students", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM students");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/courses", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM courses");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/registrations", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM registrations");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/vle-info", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM vle_info");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/student-vle", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM studentvle");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/assessments", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM assessments");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
