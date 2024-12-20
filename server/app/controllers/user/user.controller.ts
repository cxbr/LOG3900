/* eslint-disable max-lines */
import { FriendGateway } from '@app/gateways/friend/friend.gateway';
import { User } from '@app/model/database/user';
import { ConnectionsHistory } from '@app/model/dto/connections-history/connections-history.dto';
import { LoginUser } from '@app/model/dto/user/login-user.dto';
import { NewUser } from '@app/model/dto/user/new-user.dto';
import { UserAvatar } from '@app/model/dto/user/user-avatar.dto';
import { UserProfileUI } from '@app/model/dto/user/user-profile-ui.dto';
import { ChatService } from '@app/services/chat/chat.service';
import { ConnectionsHistoryService } from '@app/services/connections-history/connections-history.service';
import { TokenService } from '@app/services/firebase/token.service';
import { AvatarImageService } from '@app/services/image/avatar-image.service';
import { UserService } from '@app/services/user/user.service';
import { UserProfile } from '@common/classes/user-profile';
import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put, Res } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('User')
@Controller('user')
export class UserController {
    // eslint-disable-next-line max-params
    constructor(
        private readonly userService: UserService,
        private readonly connectionHistoryService: ConnectionsHistoryService,
        private readonly avatarImageService: AvatarImageService,
        private readonly tokenService: TokenService,
        private readonly chatPersistenceService: ChatService,
        private readonly friendGateway: FriendGateway,
    ) {}

    @ApiCreatedResponse({
        description: 'User successfully registered',
        type: String,
    })
    @ApiBadRequestResponse({
        description: 'Username already exists',
        type: String,
    })
    @ApiConflictResponse({
        description: 'Email already exists',
        type: String,
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal Server error',
    })
    @Post('/signup')
    async signup(@Body() newUser: NewUser, @Res() response: Response) {
        try {
            if (await this.userService.isUsernameTaken(newUser.username)) {
                response.status(HttpStatus.BAD_REQUEST).send('Username already exists');
                return;
            }
            if (await this.userService.getUserByEmail(newUser.email)) {
                response.status(HttpStatus.CONFLICT).send('Email already exists');
                return;
            }
            const createdUser = await this.userService.createUser(newUser);
            this.friendGateway.addNewUser(createdUser);
            response.status(HttpStatus.CREATED).send(createdUser._id);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Users successfully logged in',
        type: User,
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal Server error',
    })
    @ApiUnauthorizedResponse({
        description: 'Invalid credentials',
        type: String,
    })
    @Post('/login')
    async login(@Body() loginUser: LoginUser, @Res() response: Response) {
        try {
            const token: User = await this.userService.login(loginUser);
            if (token) {
                response.status(HttpStatus.OK).send(token);
            } else {
                response.status(HttpStatus.UNAUTHORIZED).send('Invalid credentials');
            }
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'User successfully updated',
    })
    @ApiBadRequestResponse({
        description: 'Username already exists',
        type: String,
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal Server error',
    })
    @Put('/update-username')
    async updateUsername(@Body() user: User, @Res() response: Response) {
        try {
            if (await this.userService.isUsernameTaken(user.username)) {
                response.status(HttpStatus.BAD_REQUEST).send('Username already exists');
                return;
            }
            await this.userService.updateUserName(user);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Password successfully updated',
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal Server error',
    })
    @Put('/update-password')
    async updatePassword(@Body() user: User, @Res() response: Response) {
        try {
            await this.userService.updateUserPassword(user);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'get predefined profile pictures',
    })
    @Get('/avatars')
    async getPredefinedAvatars(@Res() response: Response) {
        try {
            const avatars = this.avatarImageService.getAvatars();
            response.status(HttpStatus.OK).send(avatars);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @Patch('/avatar')
    async changeUserAvatar(@Res() response: Response, @Body() userAvatar: UserAvatar) {
        try {
            await this.userService.setAvatar(userAvatar);
            response.status(HttpStatus.OK).send(userAvatar);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Returns all connections history',
        type: ConnectionsHistory,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Get('/connections')
    async getAllConnections(@Res() response: Response) {
        try {
            const allConnections = await this.connectionHistoryService.getConnectionsHistories();
            response.status(HttpStatus.OK).json(allConnections);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Returns connection history for a specific user',
        type: ConnectionsHistory,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Get('/connections/:userId')
    async getConnectionHistory(@Res() response: Response, @Param('userId') userId: string) {
        try {
            const connectionHistory = await this.connectionHistoryService.getConnectionHistory(userId);
            response.status(HttpStatus.OK).json(connectionHistory);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'update connection history',
        type: ConnectionsHistory,
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Post('/connections')
    async updateConnectionHistory(@Res() response: Response, @Body() connectionHistory: ConnectionsHistory) {
        try {
            await this.connectionHistoryService.saveConnectionHistory(connectionHistory);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'delete all connection history',
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Delete('/connections')
    async deleteConnectionHistory(@Res() response: Response) {
        try {
            await this.connectionHistoryService.deleteConnectionsHistories();
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Email sent successfully',
        type: String,
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal Server error',
    })
    @Post('/fcm-token')
    async saveFCMToken(@Res() response: Response, @Body('token') token: string) {
        try {
            this.tokenService.saveTokenInFile(token);
            response.status(HttpStatus.OK).send('Token sent successfully');
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }
    @Post('/send-recup-email')
    async resetPassword(@Res() response: Response, @Body('email') email: string) {
        try {
            await this.userService.sendRecuperationEmail(email);
            response.status(HttpStatus.OK).send('Email sent successfully');
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }
    @ApiOkResponse({
        description: 'Code verified successfully',
        type: String,
    })
    @ApiBadRequestResponse({
        description: 'Invalid code',
        type: String,
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal Server error',
    })
    @Post('/verify-code')
    async verifyCode(@Res() response: Response, @Body('code') code: string) {
        try {
            await this.userService.verifyCode(code);
            response.status(HttpStatus.OK).send('Code verified successfully');
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'returns the user ID',
        type: String,
    })
    @ApiNotFoundResponse({
        description: 'User with the provided email not found',
        type: String,
    })
    @Get('/by-email/:email')
    async getUserId(@Res() response: Response, @Param('email') email: string) {
        try {
            if (!email) {
                response.status(HttpStatus.BAD_REQUEST).send('Email not provided');
                return;
            }
            const user = await this.userService.getUserByEmail(email);
            if (user) {
                response.status(HttpStatus.OK).json(user);
            } else {
                response.status(HttpStatus.NOT_FOUND).send('User with the provided email not found');
            }
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'username profile UI',
        type: UserProfileUI,
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal Server error',
    })
    @Get('/username-color/:userId')
    async getUsernameUI(@Res() response: Response, @Param('userId') userId: string) {
        try {
            const userProfileUI = await this.userService.getUsernameUI(userId);
            response.status(HttpStatus.OK).json(userProfileUI);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'User ID',
        type: String,
    })
    @ApiNotFoundResponse({
        description: 'User not found',
        type: String,
    })
    @Get('/username/:username')
    async getUserIdByUsername(@Res() response: Response, @Param('username') username: string) {
        try {
            const userId = await this.userService.getUserIdByUsername(username);
            if (userId) {
                response.status(HttpStatus.OK).json(userId);
            }
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'username',
        type: String,
    })
    @ApiNotFoundResponse({
        description: 'User not found',
        type: String,
    })
    @Get('/id/:userId')
    async getUsernameByUserId(@Res() response: Response, @Param('userId') userId: string) {
        try {
            const username = await this.userService.getUsernameByUserId(userId);
            if (username) {
                response.status(HttpStatus.OK).json(username);
            }
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'get all users',
    })
    // TODO: Bad REST api. Should use 'users' as base controller
    @Get('/list/:userId')
    async getUserList(@Res() response: Response, @Param('userId') userId: string) {
        try {
            const userList: UserProfile[] = await this.userService.getUserList(userId);
            response.status(HttpStatus.OK).send(userList);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'get user friendlist',
    })
    @Get('/friend-list/:userId')
    async getFriendList(@Res() response: Response, @Param('userId') userId: string) {
        try {
            const friendList: string[] = await this.userService.getFriendList(userId);
            response.status(HttpStatus.OK).send(friendList);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'get user unseen friend request count',
    })
    @Get('/friend-requests/:userId')
    async getUnseenFriendRequestCount(@Res() response: Response, @Param('userId') userId: string) {
        try {
            const notificationCount: number = await this.userService.getUnseenFriendRequestCount(userId);
            response.status(HttpStatus.OK).send(notificationCount.toString());
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    // Warning: Make sure this handler is last because it will most-likely catch any request
    @ApiOkResponse({
        description: 'Username',
        type: String,
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal Server error',
    })
    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @Get('/:username')
    async getUsername(@Param('username') name: string, @Res() response: Response) {
        try {
            const username = await this.userService.getUsername(name);
            if (username) {
                response.status(HttpStatus.OK).json(username);
            } else {
                response.status(HttpStatus.NOT_FOUND).send();
            }
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }
}
