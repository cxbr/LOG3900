import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class ImageService {
    constructor(private readonly logger: Logger) {}

    async saveImage(bufferObj: Buffer, dirName: string, fileName: string): Promise<void> {
        if (!fs.existsSync(dirName)) fs.mkdirSync(dirName);
        fs.writeFile(`${dirName}/${fileName}`, bufferObj, () => {
            return; // folder already exists
        });
    }

    deleteImageDirectory(dirName: string): void {
        fs.rmSync(dirName, { recursive: true, force: true });
    }

    deleteImage(dirName: string, fileName: string): void {
        const filePath = `${dirName}/${fileName}.png`;
        try {
            this.logger.log(`Attempt to delete ${filePath}`);
            if (fs.existsSync(filePath)) {
                fs.rmSync(filePath);
            } else {
                this.logger.error(`File ${filePath} does not exist`);
            }
        } catch (error) {
            this.logger.error(`Error while deleting image ${filePath}: ${error}`);
        }
    }
}
