import fs from "fs";
import path from "path";

import multer from "multer";

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "products"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname)
      .toLowerCase();

    callback(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      const error = new Error(
        "Only image files can be uploaded"
      );

      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});

export const uploadProductImage = upload.single("image");
