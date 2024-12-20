/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */
import { sendgrid } from '@app/constants/sendgrid';
import { User, UserDocument } from '@app/model/database/user';
import { LoginUser } from '@app/model/dto/user/login-user.dto';
import { NewUser } from '@app/model/dto/user/new-user.dto';
import { ResetPasswordUser } from '@app/model/dto/user/reset-password-user.dto';
import { UpdateUsernameColor } from '@app/model/dto/user/update-username-color';
import { UserAvatar } from '@app/model/dto/user/user-avatar.dto';
import { UserProfileUI } from '@app/model/dto/user/user-profile-ui.dto';
import { ChatService } from '@app/services/chat/chat.service';
import { ConnectionsHistoryService } from '@app/services/connections-history/connections-history.service';
import { AvatarImageService } from '@app/services/image/avatar-image.service';
import { UserConnectInfo } from '@common/classes/user-connection';
import { UserProfile } from '@common/classes/user-profile';
import { ConnectionType } from '@common/connection-type';
import { UserState } from '@common/enums/user-state';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MailDataRequired } from '@sendgrid/mail';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
    activeUsers: Map<string, UserConnectInfo> = new Map();
    verificationCode: string;
    dirName = './assets/connection';

    constructor(
        @InjectModel(User.name) public userModel: Model<UserDocument>,
        private readonly avatarImageService: AvatarImageService,
        private logger: Logger,
        private readonly chatService: ChatService,
        private readonly connectionHistoryService: ConnectionsHistoryService,
    ) {}

    async createUser(newUser: NewUser): Promise<UserProfile> {
        try {
            newUser._id = randomUUID();
            newUser = (await this.avatarImageService.setAvatar(newUser)) as NewUser;
            await this.userModel.create(newUser);
            const user: UserProfile = await this.userModel.findOne({ _id: newUser._id }, { username: 1, avatar: 1 }).lean();
            user.state = UserState.IsStranger;
            user.avatar = this.avatarImageService.getUserAvatarPath(user.avatar);
            return Promise.resolve(user);
        } catch (error) {
            return Promise.reject(`Failed to create user: ${error}`);
        }
    }

    async login(loginUser: LoginUser): Promise<User> {
        try {
            const user = await this.userModel.findOne({ username: loginUser.username });
            if (user && user.password === loginUser.password) {
                user.avatar = this.avatarImageService.getUserAvatarPath(user.avatar);
                return Promise.resolve(user);
            }
            return Promise.resolve(undefined);
        } catch (error) {
            return Promise.reject(`Failed to login: ${error}`);
        }
    }
    async writeLastConnectionAndroid(username: string, channels: string[]): Promise<void> {
        const filePath = `${this.dirName}/latestConnection.json`;
        if (!fs.existsSync(this.dirName + '/')) fs.mkdirSync(this.dirName);
        fs.writeFile(filePath, this.serializeRatingToJSON({ usernameAndroid: username, channelsUserAndroid: channels }), () => {
            return;
        });
    }
    async readLastConnectionAndroid(): Promise<{ usernameAndroid: string; channelsUserAndroid: string[] }> {
        const filePath = `${this.dirName}/latestConnection.json`;
        const latestConnectionUsername = await fs.promises.readFile(filePath, 'utf8');
        const latestConnectionData = JSON.parse(latestConnectionUsername);

        return latestConnectionData;
    }

    async isUsernameTaken(username: string): Promise<boolean> {
        try {
            const user = await this.userModel.findOne({ username });
            if (user) {
                return Promise.resolve(true);
            }
            return Promise.resolve(false);
        } catch (error) {
            return Promise.reject(`Failed to get user: ${error}`);
        }
    }

    async getUserByEmail(email: string): Promise<ResetPasswordUser> {
        try {
            const user = await this.userModel.findOne({ email });
            if (!user) {
                return Promise.resolve(undefined);
            }
            const resetPasswordUser: ResetPasswordUser = {
                username: user.username,
                userId: user._id,
            };
            if (resetPasswordUser) {
                return Promise.resolve(resetPasswordUser);
            }
            return Promise.resolve(undefined);
        } catch (error) {
            return Promise.reject(`Failed to get user by email: ${error}`);
        }
    }

    async getUserByUsername(username: string): Promise<User> {
        try {
            const user = await this.userModel.findOne({ username });
            return Promise.resolve(user);
        } catch (error) {
            return Promise.reject(`Failed to get user: ${error}`);
        }
    }

    async addChannelToUser(username: string, channelId: string): Promise<void> {
        try {
            await this.userModel.updateOne(
                { username },
                { $addToSet: { joinedChannels: { channelId, numberOfUnreadMessages: 0 } } },
                { upsert: true },
            );
        } catch (error) {
            return Promise.reject(`Failed to add channel to user: ${error}`);
        }
    }

    async removeChannelFromUser(username: string, channelId: string): Promise<void> {
        try {
            await this.userModel.updateOne({ username }, { $pull: { joinedChannels: { channelId } } });
        } catch (error) {
            return Promise.reject(`Failed to remove channel from user: ${error}`);
        }
    }

    async incrementNumberOfUnreadMessages(username: string, channelId: string): Promise<void> {
        try {
            await this.userModel.updateOne(
                { username, 'joinedChannels.channelId': channelId },
                { $inc: { 'joinedChannels.$.numberOfUnreadMessages': 1 } },
            );
        } catch (error) {
            return Promise.reject(`Failed to increment number of unread messages: ${error}`);
        }
    }

    async resetNumberOfUnreadMessages(username: string, channelId: string): Promise<void> {
        try {
            await this.userModel.updateOne(
                { username, 'joinedChannels.channelId': channelId },
                { $set: { 'joinedChannels.$.numberOfUnreadMessages': 0 } },
            );
        } catch (error) {
            return Promise.reject(`Failed to reset number of unread messages: ${error}`);
        }
    }

    async getUsername(id: string): Promise<string> {
        try {
            const user = await this.userModel.findOne({ _id: id });
            if (user) {
                return Promise.resolve(user.username);
            }
        } catch (error) {
            return Promise.reject(`Failed to get username: ${error}`);
        }
    }

    getUsernameBySocketId(socketId: string): string {
        for (const user of this.activeUsers) {
            if (user[1].socketId === socketId) {
                return user[0];
            }
        }
        return '';
    }

    async disconnectUser(id: string) {
        for (const user of this.activeUsers) {
            if (user[1].socketId === id) {
                const userId = await this.getUserIdByUsername(user[0]);
                this.connectionHistoryService.saveConnectionHistory({
                    userId,
                    username: user[0],
                    connectionType: ConnectionType.disconnection,
                    connectionTime: Date.now(),
                });
                this.activeUsers.delete(user[0]);
            }
        }
    }

    isUserActive(username: string): boolean {
        return this.activeUsers.has(username);
    }

    addActiveUser(username: string, socketId: string, isConnectedToAndroid: boolean = false) {
        const userInfo: UserConnectInfo = { socketId, isConnectedToAndroid };
        this.activeUsers.set(username, userInfo);
    }

    async setAvatar(userAvatar: UserAvatar): Promise<void> {
        try {
            userAvatar = (await this.avatarImageService.setAvatar(userAvatar)) as UserAvatar;
            const filter = { _id: userAvatar._id };
            const updatedFields = { $set: { avatar: userAvatar.avatar } };
            await this.userModel.updateOne(filter, updatedFields);
            userAvatar.avatar = this.avatarImageService.getUserAvatarPath(userAvatar.avatar);
        } catch (error) {
            return Promise.reject(`Failed to create user: ${error}`);
        }
    }

    async updateUserName(user: User): Promise<void> {
        try {
            const oldUsername = await this.userModel.findOne({ _id: user._id }, { username: 1 });
            this.chatService.updateUsernameInOldMessages(oldUsername.username, user.username);
            this.chatService.writeChannelsToFile();
            await this.userModel.updateOne({ _id: user._id }, { $set: { username: user.username, password: user.password } });
            this.logger.log(`UserService: Username updated to ${user.username}`);
        } catch (error) {
            return Promise.reject(`Failed to update username: ${error}`);
        }
    }

    async updateUserPassword(user: User): Promise<void> {
        try {
            await this.userModel.updateOne({ _id: user._id }, { $set: { username: user.username, password: user.password } });
            this.logger.log(`UserService: Password updated for ${user.username}`);
        } catch (error) {
            return Promise.reject(`Failed to update password: ${error}`);
        }
    }

    async sendRecuperationEmail(email: string): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(sendgrid.apiKey);
        const minValue = 100000;
        const maxValue = 999999;
        const verificationCode = Math.floor(minValue + Math.random() * maxValue).toString();

        const mail: MailDataRequired = {
            to: email,
            from: 'mismatch.dev.team@gmail.com',
            subject: 'Récuperation de mot de passe',
            text:
                'Bonjour, voici votre code de récuperation: ' +
                verificationCode +
                "Utilisez ce code pour réinitialiser votre mot de passe. Si vous n'avez pas \
                demandé de récuperation de mot de passe, veuillez ignorer ce message. Cordialement, L'équipe Mismatch.",
            html:
                'Bonjour,<br><br> Voici votre code de récuperation: <strong>' +
                verificationCode +
                "</strong> <br><br> Utilisez ce code pour réinitialiser votre mot de passe.<br><br>Si vous n'avez pas \
                demandé de récuperation de mot de passe, veuillez ignorer ce message. <br><br>Cordialement, <br><br>L'équipe Mismatch.",
        };
        try {
            await sgMail.send(mail);
            this.verificationCode = verificationCode;
            this.logger.log(`UserService: Email sent to ${email}`);
        } catch (error) {
            return Promise.reject(`Failed to send email: ${error}`);
        }
    }

    async verifyCode(code: string): Promise<void> {
        if (code === this.verificationCode) {
            this.verificationCode = '';
        } else {
            return Promise.reject('Invalid code');
        }
    }

    async getUsersSubscribedToChannel(channelId: string): Promise<User[]> {
        try {
            if (channelId === 'home') {
                const everyone = await this.userModel.find({});
                return Promise.resolve(everyone);
            }

            const users = await this.userModel.find({ 'joinedChannels.channelId': channelId });
            return Promise.resolve(users);
        } catch (error) {
            return Promise.reject(`Failed to get users subscribed to channel: ${error}`);
        }
    }

    async updateUsernameColor(updateUsernameColorDto: UpdateUsernameColor): Promise<void> {
        try {
            await this.userModel.updateOne({ _id: updateUsernameColorDto.userId }, { $set: { usernameColor: updateUsernameColorDto.usernameColor } });
        } catch (error) {
            return Promise.reject(`Failed to update username color: ${error}`);
        }
    }

    async getUsernameUI(userId: string): Promise<UserProfileUI> {
        try {
            const user = await this.userModel.findOne({ _id: userId });
            const userProfileUI: UserProfileUI = {
                avatar: this.avatarImageService.getUserAvatarPath(user.avatar),
                usernameColor: user.usernameColor,
            };
            return Promise.resolve(userProfileUI);
        } catch (error) {
            return Promise.reject(`Failed to get username color: ${error}`);
        }
    }

    async getUserIdByUsername(username: string): Promise<string> {
        try {
            const user = await this.userModel.findOne({ username });
            if (user) {
                return Promise.resolve(user._id);
            }
            return Promise.resolve('');
        } catch (error) {
            return Promise.reject(`Failed to get user id by username: ${error}`);
        }
    }

    async getUsernameByUserId(id: string): Promise<string> {
        try {
            const user = await this.userModel.findOne({ _id: id });
            if (user) {
                return Promise.resolve(user.username);
            }
            return Promise.resolve('');
        } catch (error) {
            return Promise.reject(`Failed to get username by id: ${error}`);
        }
    }

    async getUserList(userId: string): Promise<UserProfile[]> {
        try {
            const users: UserProfile[] = await this.userModel.find({ _id: { $ne: userId } }, { _id: 1, username: 1, avatar: 1 }).lean();
            const friendListDetails = await this.userModel.findOne(
                { _id: userId },
                { friendList: 1, friendRequestReceived: 1, friendRequestSent: 1 },
            );
            users.forEach((user) => {
                user.avatar = this.avatarImageService.getUserAvatarPath(user.avatar);

                user.state = friendListDetails.friendList.includes(user._id)
                    ? UserState.IsFriend.toString()
                    : friendListDetails.friendRequestReceived.some((request) => request.userId === user._id && request.seen)
                    ? UserState.RequestReceived.toString()
                    : friendListDetails.friendRequestReceived.some((request) => request.userId === user._id && !request.seen)
                    ? UserState.RequestUnseen.toString()
                    : friendListDetails.friendRequestSent.includes(user._id)
                    ? UserState.RequestSent.toString()
                    : UserState.IsStranger.toString();
            });

            return users;
        } catch (error) {
            return Promise.reject(`Failed to retrieve all users: ${error}`);
        }
    }

    async getFriendList(userId: string): Promise<string[]> {
        try {
            const friendList: string[] = (await this.userModel.findOne({ _id: userId }, { _id: 0, friendList: 1 })).friendList;
            return friendList;
        } catch (error) {
            return Promise.reject(`Failed to retrieve friend list: ${error}`);
        }
    }

    async removeFriendRequest(userIdFrom: string, userIdTo: string): Promise<void> {
        try {
            await this.userModel.updateOne({ _id: userIdTo }, { $pull: { friendRequestReceived: { userId: userIdFrom } } });
            await this.userModel.updateOne({ _id: userIdFrom }, { $pull: { friendRequestSent: userIdTo } });
        } catch (error) {
            return Promise.reject(`Failed to remove friend request: ${error}`);
        }
    }

    async addFriendRequest(userIdFrom: string, userIdTo: string): Promise<void> {
        try {
            await this.userModel.updateOne({ _id: userIdTo }, { $addToSet: { friendRequestReceived: { userId: userIdFrom, seen: false } } });
            await this.userModel.updateOne({ _id: userIdFrom }, { $addToSet: { friendRequestSent: userIdTo } });
        } catch (error) {
            return Promise.reject(`Failed to add friend request: ${error}`);
        }
    }

    async addFriend(userIdFrom: string, userIdTo: string): Promise<void> {
        try {
            await this.userModel.updateOne({ _id: userIdTo }, { $addToSet: { friendList: userIdFrom } });
            await this.userModel.updateOne({ _id: userIdFrom }, { $addToSet: { friendList: userIdTo } });
        } catch (error) {
            return Promise.reject(`Failed to add users to friend lists: ${error}`);
        }
    }

    async removeFriend(userIdFrom: string, userIdTo: string): Promise<void> {
        try {
            await this.userModel.updateOne({ _id: userIdTo }, { $pull: { friendList: userIdFrom } });
            await this.userModel.updateOne({ _id: userIdFrom }, { $pull: { friendList: userIdTo } });
        } catch (error) {
            return Promise.reject(`Failed to remove users to friend lists: ${error}`);
        }
    }

    async markAllFriendRequestsAsSeen(userId: string): Promise<void> {
        try {
            await this.userModel.updateOne({ _id: userId }, { $set: { 'friendRequestReceived.$[].seen': true } });
        } catch (error) {
            return Promise.reject(`Failed to mark all friend requests as seen: ${error}`);
        }
    }

    async getUnseenFriendRequestCount(userId: string): Promise<number> {
        try {
            const document = await this.userModel.findOne({
                _id: userId,
            });
            const notificationCount: number = document.friendRequestReceived.filter((request) => !request.seen).length;
            return notificationCount;
        } catch (error) {
            return Promise.reject(`Failed to mark all friend requests as seen: ${error}`);
        }
    }

    async hasSeenFriendNotification(userIdFrom: string, userIdTo: string): Promise<boolean> {
        try {
            const request = await this.userModel.findOne(
                // eslint-disable-next-line quote-props
                { _id: userIdTo, 'friendRequestReceived.userId': userIdFrom },
                { 'friendRequestReceived.$': 1 },
            );
            return request.friendRequestReceived[0].seen;
        } catch (error) {
            return Promise.reject(`Failed to check if user has seen notification: ${error}`);
        }
    }
    private serializeRatingToJSON(token: { usernameAndroid: string; channelsUserAndroid: string[] }): string {
        const serializedData = JSON.stringify(token, null, 2);
        return serializedData;
    }
}
