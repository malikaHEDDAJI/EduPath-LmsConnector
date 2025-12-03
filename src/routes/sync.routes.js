import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import checkOAuth from "../middleware/auth.js";
import {
    importStudentInfo,
    importStudentVle,
    importStudentAssessment
} from "../services/import.service.js";

dotenv.config();
const router = express.Router();

// Limite augmentée pour très gros fichiers
const MAX_SIZE = process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 536870912; // 512 MB par défaut

const upload = multer({ 
    dest: "uploads/",
    limits: { fileSize: MAX_SIZE }
});

// Fonction utilitaire pour gérer l'upload et les erreurs
const handleUpload = (serviceFunction) => {
    return (req, res) => {
        upload.single("file")(req, res, async (err) => {
            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        success: false,
                        message: `Fichier trop volumineux. Taille maximale : ${MAX_SIZE / (1024 * 1024)} MB.`
                    });
                }
                return res.status(500).json({ success: false, message: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ success: false, message: "Aucun fichier reçu." });
            }

            try {
                await serviceFunction(req.file.path);
                res.json({ success: true, message: `${req.file.originalname} importé avec succès.` });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });
    };
};

// Routes
router.post("/student-info", checkOAuth, handleUpload(importStudentInfo));
router.post("/student-vle", checkOAuth, handleUpload(importStudentVle));
router.post("/student-assessment", checkOAuth, handleUpload(importStudentAssessment));

export default router;
