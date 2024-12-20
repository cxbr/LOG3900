import { environment } from '@app/environments/environment';
import { NewUser } from '@app/model/dto/user/new-user.dto';
import { UserAvatar } from '@app/model/dto/user/user-avatar.dto';
import { ImageService } from '@app/services/image/image.service';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class AvatarImageService {
    private userPath: string = './assets/avatars/user';
    private predefinedPath: string = './assets/avatars/predefined';

    constructor(private readonly imageService: ImageService) {}

    async setAvatar(userObj: NewUser | UserAvatar): Promise<NewUser | UserAvatar> {
        if (userObj.avatarData != null) {
            userObj =
                // Windows data is of type base64string
                typeof userObj.avatarData === 'string'
                    ? await this.saveUserPic(Buffer.from(userObj.avatarData.split(',')[1], 'base64'), userObj)
                    : await this.saveUserPic(Buffer.from(userObj.avatarData), userObj);
        } else {
            await this.deleteUserPic(userObj._id);
            userObj.avatar = this.formatAvatarPath(userObj.avatar);
        }
        return userObj;
    }

    getAvatars(): string[] {
        const files = fs.readdirSync(this.predefinedPath);
        const filteredFiles = files
            .filter((file) => file !== '.gitkeep')
            .map((file) => {
                return `${environment.serverUrl}/avatars/predefined/` + file;
            });
        return filteredFiles;
    }

    getUserAvatarPath(avatarPath: string): string {
        return `${environment.serverUrl}/${avatarPath}`;
    }

    async deleteUserPic(id: string): Promise<void> {
        this.imageService.deleteImage(this.userPath, id);
    }

    // userPathExist(id: string): boolean {
    //     return fs.existsSync(`${this.userPath}/${id}.png`);
    // }

    private async saveUserPic(bufferObj: Buffer, userObj: NewUser | UserAvatar): Promise<NewUser | UserAvatar> {
        await this.imageService.saveImage(bufferObj, this.userPath, `${userObj._id}.png`);
        userObj.avatar = `avatars/user/${userObj._id}.png`;
        return userObj;
    }

    private formatAvatarPath(avatarPath: string) {
        const pathPosToSlice = -3;
        const pathParts = avatarPath.split('/');
        return pathParts.slice(pathPosToSlice).join('/');
    }
}
