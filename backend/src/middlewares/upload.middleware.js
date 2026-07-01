// Path: backend/src/middlewares/upload.middleware.js
"use strict";

import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Chỉ hỗ trợ tải lên file ảnh!"), false);
    }
};
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit per file
    },
    fileFilter: fileFilter
});

export default upload;
