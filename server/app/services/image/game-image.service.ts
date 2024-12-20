import { NewGame } from '@app/model/dto/game/new-game.dto';
import { ImageService } from '@app/services/image/image.service';
import { DifferencesHashMap } from '@common/classes/differences-hashmap';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class GameImageService {
    constructor(private readonly imageService: ImageService) {}

    async saveImage(bufferObj: Buffer, name: string, index: string): Promise<void> {
        const dirName = `./assets/games/${name}`;
        await this.imageService.saveImage(bufferObj, dirName, `image${index}.bmp`);
    }

    async getMatrix(name: string): Promise<number[][]> {
        const dirName = `./assets/games/${name}`;
        if (!fs.existsSync('./assets/games') || !fs.existsSync(dirName)) return Promise.reject('Could not find game');
        const data = fs.readFileSync(`${dirName}/differenceMatrix.txt`, 'utf8');
        return this.convertMatrixStringToMatrix(data);
    }

    async saveMatrix(newGame: NewGame): Promise<void> {
        const dirName = `./assets/games/${newGame.name}`;
        if (!fs.existsSync('./assets/games')) await fs.mkdirSync('./assets/games', { recursive: true });
        if (!fs.existsSync(dirName)) await fs.mkdirSync(dirName, { recursive: true });
        const matrixToString = newGame.differenceMatrix.map((row) => row.join(',')).join(';');
        fs.writeFile(`${dirName}/differenceMatrix.txt`, matrixToString, () => {
            return; // folder already exists
        });
    }

    async getDifferencesHashMap(name: string): Promise<DifferencesHashMap[]> {
        const dirName = `./assets/games/${name}`;
        if (!fs.existsSync(dirName)) return Promise.reject('Could not find game');
        const data = fs.readFileSync(`${dirName}/differenceHashMap.json`, 'utf8');
        return JSON.parse(data);
    }

    async saveDifferencesHashMap(newGame: NewGame): Promise<void> {
        const dirName = `./assets/games/${newGame.name}`;
        if (!fs.existsSync('./assets/games')) await fs.mkdirSync('./assets/games');
        if (!fs.existsSync(dirName)) await fs.mkdirSync(dirName);
        const hashMapToString = JSON.stringify(newGame.differenceHashMap);
        fs.writeFile(`${dirName}/differenceHashMap.json`, hashMapToString, () => {
            return; // folder already exists
        });
    }

    async imagesExist(name: string): Promise<boolean> {
        return fs.existsSync(this.getFirstFilePath(name)) && fs.existsSync(this.getSecondFilePath(name));
    }

    async diffImageExist(name: string): Promise<boolean> {
        return fs.existsSync(this.getDiffHashMapPath(name)) && fs.existsSync(this.getDiffMatrixPath(name));
    }

    async saveImages(newGame: NewGame): Promise<void> {
        let bufferObjImage = Buffer.from(newGame.image1, 'base64');
        await this.saveImage(bufferObjImage, newGame.name, '1');
        bufferObjImage = Buffer.from(newGame.image2, 'base64');
        await this.saveImage(bufferObjImage, newGame.name, '2');
    }

    deleteImages(name: string): void {
        const dirName = `./assets/games/${name}`;
        this.imageService.deleteImageDirectory(dirName);
    }

    private getFirstFilePath(name: string): string {
        return `assets/games/${name}/image1.bmp`;
    }

    private getSecondFilePath(name: string): string {
        return `assets/games/${name}/image2.bmp`;
    }

    private getDiffHashMapPath(name: string): string {
        return `assets/games/${name}/differenceHashMap.json`;
    }

    private getDiffMatrixPath(name: string): string {
        return `assets/games/${name}/differenceMatrix.txt`;
    }

    private convertMatrixStringToMatrix(matrixString: string): number[][] {
        const matrix = matrixString.split(';').map((row) => row.split(','));
        return matrix.map((row) => row.map((cell) => parseInt(cell, 10)));
    }
}
