import { v2 as cloudinary } from "cloudinary";
import { extname } from "path";
import sharp from "sharp";
import { Readable } from "stream";

const uploadToCloudinary = async (files, folder) => {
  try {
    const maxFiles = 7;
    let filesArray = Array.isArray(files) ? files : [files];

    if (filesArray.length > maxFiles) {
      throw new Error(`You cannot upload more than ${maxFiles} pictures`);
    }

    const uploadedUrls = [];

    // Helper to convert buffer to readable stream
    const bufferToStream = (buffer) => {
      const readable = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        },
      });
      return readable;
    };

    for (const file of filesArray) {
      const fileExt = extname(file.originalname).toLowerCase();

      if (![".jpg", ".jpeg", ".png", ".webp"].includes(fileExt)) {
        throw new Error("Please select jpg/jpeg/png/webp image");
      }

      // Convert image to webp buffer with quality 80
      const webpBuffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();

      // Upload to Cloudinary using upload_stream and Promise
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        bufferToStream(webpBuffer).pipe(stream);
      });

      uploadedUrls.push(uploadResult.secure_url);
    }

    return uploadedUrls;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export default uploadToCloudinary;
