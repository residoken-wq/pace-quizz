import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('upload')
export class UploadController {
    @UseGuards(JwtAuthGuard)
    @Post()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                return cb(new HttpException('Only image files are allowed!', HttpStatus.BAD_REQUEST), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('File upload failed', HttpStatus.BAD_REQUEST);
        }
        // Return relative URL that will be served by ServeStaticModule
        return {
            url: `/uploads/${file.filename}`
        };
    }
}
