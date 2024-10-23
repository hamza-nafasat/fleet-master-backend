import createHttpError from "http-errors";
import multer from "multer";
import path from "path";

const fileFilter = (req: any, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
    const allowedExtension = [".jpg", ".png", ".jpeg", ".webp"];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtension.includes(fileExtension)) {
        return callback(null, true);
    }
    callback(createHttpError(400, "File Upload Error"));
};

const singleUpload = multer({
    storage: multer.memoryStorage(),
    // fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");

export { singleUpload };
