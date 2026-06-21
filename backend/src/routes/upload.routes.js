import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post("/api/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "Không tìm thấy file tải lên." });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        return res.status(200).json({ success: true, url: fileUrl });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
