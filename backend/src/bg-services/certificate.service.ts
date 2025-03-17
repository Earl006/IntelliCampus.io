import { PrismaClient } from '@prisma/client';
import { injectable } from 'inversify';
import PDFDocument from 'pdfkit';
import { uploadToCloudinary } from './file-upload.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for generating and managing course completion certificates
 */
@injectable()
export default class CertificateService {
  private prisma: PrismaClient;
  private certificateTemplates: Record<string, CertificateTemplate>;

  constructor() {
    this.prisma = new PrismaClient();
    
    // Initialize certificate templates
    this.certificateTemplates = {
      'standard': {
        id: 'standard',
        name: 'Standard',
        background: '#ffffff',
        primaryColor: '#0d47a1',
        secondaryColor: '#1976d2',
        accentColor: '#e3f2fd',
        font: 'Helvetica',
        logo: true,
      },
      'elegant': {
        id: 'elegant',
        name: 'Elegant',
        background: '#f5f5f5',
        primaryColor: '#212121',
        secondaryColor: '#757575',
        accentColor: '#f9a825',
        font: 'Times-Roman',
        logo: true,
      },
      'modern': {
        id: 'modern',
        name: 'Modern',
        background: '#eceff1',
        primaryColor: '#006064',
        secondaryColor: '#00acc1',
        accentColor: '#e0f7fa',
        font: 'Helvetica-Bold',
        logo: true,
      }
    };
  }

  /**
   * Generate a certificate for a user who completed a course
   */
  async generateCertificate(userId: string, courseId: string, templateId: string = 'standard'): Promise<string> {
    // Check if certificate already exists
    const existingCertificate = await this.prisma.certificate.findFirst({
      where: {
        userId,
        courseId
      }
    });

    if (existingCertificate) {
      console.log(`Certificate already exists for user ${userId} and course ${courseId}`);
      return existingCertificate.pdfUrl || '';
    }

    try {
      // Get user and course details
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          instructor: true
        }
      });

      if (!user || !course) {
        throw new Error('User or course not found');
      }

      // Get template
      const template = this.certificateTemplates[templateId] || this.certificateTemplates['standard'];

      // Create temporary file path
      const tempFilePath = path.join(os.tmpdir(), `certificate-${uuidv4()}.pdf`);
      
      // Generate PDF
      await this.createCertificatePdf(
        tempFilePath,
        template,
        {
          studentName: `${user.firstName} ${user.lastName}`,
          courseName: course.title,
          instructorName: `${course.instructor.firstName} ${course.instructor.lastName}`,
          completionDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          certificateId: uuidv4().substring(0, 8).toUpperCase()
        }
      );

      // Upload to Cloudinary
      const pdfUrl = await this.uploadCertificate(tempFilePath, userId, courseId);
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      // Save certificate to database
      const certificate = await this.prisma.certificate.create({
        data: {
          userId,
          courseId,
          templateId,
          pdfUrl,
        }
      });

      console.log(`Certificate generated for user ${userId} and course ${courseId}: ${pdfUrl}`);
      
      return pdfUrl;
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      throw new Error(`Failed to generate certificate: ${error.message}`);
    }
  }

  /**
   * Create a beautifully styled PDF certificate
   */
  private createCertificatePdf(
    outputPath: string,
    template: CertificateTemplate,
    data: {
      studentName: string;
      courseName: string;
      instructorName: string;
      completionDate: string;
      certificateId: string;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create a PDF document
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margin: 0,
        });

        // Pipe output to file
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Set up document
        const width = doc.page.width;
        const height = doc.page.height;
        
        // Background
        doc.rect(0, 0, width, height).fill(template.background);
        
        // Add border
        const borderWidth = 15;
        doc.rect(borderWidth, borderWidth, width - (borderWidth * 2), height - (borderWidth * 2))
           .lineWidth(2)
           .stroke(template.secondaryColor);

        // Inner border with decoration
        const innerBorder = 40;
        doc.rect(innerBorder, innerBorder, width - (innerBorder * 2), height - (innerBorder * 2))
           .lineWidth(1)
           .stroke(template.primaryColor);
           
        // Add decorative corners
        this.drawDecorationCorner(doc, innerBorder, innerBorder, template.accentColor);
        this.drawDecorationCorner(doc, width - innerBorder, innerBorder, template.accentColor, 90);
        this.drawDecorationCorner(doc, width - innerBorder, height - innerBorder, template.accentColor, 180);
        this.drawDecorationCorner(doc, innerBorder, height - innerBorder, template.accentColor, 270);

        // Logo/header area
        doc.fontSize(30)
           .font(`${template.font}-Bold`)
           .fill(template.primaryColor)
           .text('IntelliCampus', width / 2, innerBorder + 40, { align: 'center' });

        doc.fontSize(14)
           .font(template.font)
           .fill(template.secondaryColor)
           .text('CERTIFICATE OF COMPLETION', width / 2, innerBorder + 75, { align: 'center' });

        // Main content
        doc.fontSize(12)
           .fill(template.secondaryColor)
           .text('This is to certify that', width / 2, height / 2 - 80, { align: 'center' });

        // Student name
        doc.fontSize(28)
           .font(`${template.font}-Bold`)
           .fill(template.primaryColor)
           .text(data.studentName, width / 2, height / 2 - 50, { align: 'center' });

        // Course details
        doc.fontSize(12)
           .font(template.font)
           .fill(template.secondaryColor)
           .text('has successfully completed the course', width / 2, height / 2, { align: 'center' });

        doc.fontSize(20)
           .font(`${template.font}-Bold`)
           .fill(template.primaryColor)
           .text(data.courseName, width / 2, height / 2 + 30, { align: 'center' });

        // Bottom section - Date and signatures
        const signatureY = height - innerBorder - 80;

        // Draw signature lines
        const leftSignX = width / 3;
        const rightSignX = (width / 3) * 2;
        
        doc.moveTo(leftSignX - 70, signatureY)
           .lineTo(leftSignX + 70, signatureY)
           .stroke(template.secondaryColor);
           
        doc.moveTo(rightSignX - 70, signatureY)
           .lineTo(rightSignX + 70, signatureY)
           .stroke(template.secondaryColor);
        
        // Add signatures labels
        doc.fontSize(10)
           .font(template.font)
           .fill(template.secondaryColor)
           .text(data.instructorName, leftSignX, signatureY + 10, { align: 'center' })
           .text('Instructor', leftSignX, signatureY + 25, { align: 'center' })
           .text('IntelliCampus', rightSignX, signatureY + 10, { align: 'center' })
           .text('Authorized Signatory', rightSignX, signatureY + 25, { align: 'center' });

        // Date and certificate ID
        doc.fontSize(10)
           .text(`Date: ${data.completionDate}`, width / 2, height - innerBorder - 30, { align: 'center' })
           .text(`Certificate ID: ${data.certificateId}`, width / 2, height - innerBorder - 15, { align: 'center' });

        // Add watermark
        doc.rotate(-45, { origin: [width / 2, height / 2] });
        doc.fontSize(60)
           .fillOpacity(0.05)
           .fill(template.primaryColor)
           .text('INTELLICAMPUS', width / 2 - 250, height / 2, { align: 'center' });
        doc.rotate(45, { origin: [width / 2, height / 2] });
        doc.fillOpacity(1);

        // Finalize the PDF
        doc.end();
        
        // Handle completion
        stream.on('finish', () => {
          resolve();
        });
        
        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw decorative corner element
   */
  private drawDecorationCorner(
    doc: PDFKit.PDFDocument, 
    x: number, 
    y: number, 
    color: string, 
    rotation = 0
  ) {
    doc.save();
    doc.translate(x, y);
    doc.rotate(rotation);
    
    // Draw flourish
    doc.path('M 0,0 C 10,-15 20,-20 30,-20 C 15,-10 10,-5 0,0 Z')
       .fill(color);
       
    doc.restore();
  }

  /**
   * Upload certificate PDF to Cloudinary
   */
  private async uploadCertificate(filePath: string, userId: string, courseId: string): Promise<string> {
    try {
      // Use the file upload service to upload to cloudinary
      const fileBuffer = fs.readFileSync(filePath);
      
      // Create a File object that matches what uploadToCloudinary expects
      const file = {
        buffer: fileBuffer,
        originalname: `certificate-${userId}-${courseId}.pdf`
      } as Express.Multer.File;
      
      // Upload to Cloudinary with certificates/ folder
      const cloudinaryUrl = await uploadToCloudinary(file);
      return cloudinaryUrl;
    } catch (error) {
      console.error('Error uploading certificate to Cloudinary:', error);
      throw new Error('Failed to upload certificate');
    }
  }
  
  /**
   * Get available certificate templates
   */
  getAvailableTemplates(): CertificateTemplate[] {
    return Object.values(this.certificateTemplates);
  }
  
  /**
   * Get a certificate by user and course
   */
  async getCertificate(userId: string, courseId: string) {
    return this.prisma.certificate.findFirst({
      where: {
        userId,
        courseId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            title: true,
            instructor: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * Get all certificates for a user
   */
  async getUserCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: {
        userId
      },
      include: {
        course: {
          select: {
            title: true,
            instructor: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        issueDate: 'desc'
      }
    });
  }
  
  /**
   * Get all certificates for a course
   */
  async getCourseCertificates(courseId: string) {
    return this.prisma.certificate.findMany({
      where: {
        courseId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        issueDate: 'desc'
      }
    });
  }
}

interface CertificateTemplate {
  id: string;
  name: string;
  background: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  font: string;
  logo: boolean;
}