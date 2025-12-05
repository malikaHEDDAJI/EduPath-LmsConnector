import express from "express";
import db from "../utils/db.js";
import checkOAuth from "../middleware/auth.js";

const router = express.Router();

router.get("/", checkOAuth, async (req, res) => {
    const { rows } = await db.query("SELECT * FROM assessments");
    res.json(rows);
});

router.get("/:id", checkOAuth, async (req, res) => {
    const { rows } = await db.query("SELECT * FROM assessments WHERE assessments=$1", [req.params.id]);
    res.json(rows);
});

export default router;
