import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { Readable } from 'stream';


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folder = 'intelliCampus';
    let allowed_formats = ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx', 'mp4', 'mov', 'avi'];
    let transformation: { width?: number; height?: number; crop?: string }[] = [];

    if (file.mimetype.startsWith('image/')) {
      folder = 'intelliCampus/images';
      transformation = [{ width: 500, height: 500, crop: 'limit' }];
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'intelliCampus/videos';
    } else if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      folder = 'intelliCampus/documents';
    }

    return {
      folder: folder,
      allowed_formats: allowed_formats,
      transformation: transformation
    };
  }
});

export const upload = multer({ storage: storage });

export async function uploadToCloudinary(file?: Express.Multer.File): Promise<string> {
  if (!file) {
    throw new Error('No file uploaded');
  }

  try {
    console.log('Uploading file to Cloudinary:', file.originalname, file.mimetype, file.size);

    // Convert buffer to stream
    const fileStream = Readable.from(file.buffer);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'intelli-campus',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary error:', error);
            return reject(new Error('Failed to upload file'));
          }
          if (!result) {
            return reject(new Error('No result from Cloudinary'));
          }
          console.log('Cloudinary upload success:', result.secure_url);
          resolve(result.secure_url);
        }
      );
      fileStream.pipe(uploadStream);
    });
  } catch (err) {
    console.error('File upload error:', err);
    throw new Error('Failed to upload file');
  }
}