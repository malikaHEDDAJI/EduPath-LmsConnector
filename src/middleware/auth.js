import dotenv from "dotenv";
dotenv.config();

export default function checkOAuth(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth || auth !== "Bearer " + process.env.OAUTH_TOKEN) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    next();
}
