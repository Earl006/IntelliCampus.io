import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

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

export const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  try {
    if (!file || !file.path) {
      throw new Error('No file uploaded');
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'intelliCampus',
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx', 'mp4', 'mov', 'avi'],
      resource_type: file.mimetype.startsWith('video/') ? 'video' : 'auto'
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload file');
  }
};