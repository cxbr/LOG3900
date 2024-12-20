import { ConfigController } from '@app/controllers/config/config.controller';
import { GameController } from '@app/controllers/game/game.controller';
import { UserController } from '@app/controllers/user/user.controller';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { FriendGateway } from '@app/gateways/friend/friend.gateway';
import { GameFinderGateway } from '@app/gateways/game-finder/game-finder.gateway';
import { GameModeGateway } from '@app/gateways/game-mode/game-mode.gateway';
import { UserGateway } from '@app/gateways/user/user.gateway';
import { WaitingRoomGateway } from '@app/gateways/waiting-room/waiting-room.gateway';
import { Game, gameSchema } from '@app/model/database/game';
import { gameConstantsSchema } from '@app/model/database/game-constants';
import { gameHistorySchema } from '@app/model/database/game-history';
import { User, userSchema } from '@app/model/database/user';
import { ChatService } from '@app/services/chat/chat.service';
import { ConnectionsHistoryService } from '@app/services/connections-history/connections-history.service';
import { GameConstantsService } from '@app/services/game-constants/game-constants.service';
import { GameHistoryService } from '@app/services/game-history/game-history.service';
import { GameModeService } from '@app/services/game-mode/game-mode.service';
import { GameService } from '@app/services/game/game.service';
import { AvatarImageService } from '@app/services/image/avatar-image.service';
import { GameImageService } from '@app/services/image/game-image.service';
import { ImageService } from '@app/services/image/image.service';
import { UserService } from '@app/services/user/user.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ReplayController } from './controllers/replay/replay.controller';
import { ReplayGateway } from './gateways/replay/replay.gateway';
import { connectionsHistorySchema } from './model/database/connections-history';
import { TokenService } from './services/firebase/token.service';
import { RatingService } from './services/rating/rating.service';
import { ReplayService } from './services/replay/replay.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'), // Loaded from .env, add '_TESTING' to the end for the testing database
            }),
        }),
        MongooseModule.forFeature([
            { name: User.name, schema: userSchema },
            { name: Game.name, schema: gameSchema },
            { name: 'games-histories', schema: gameHistorySchema },
            { name: 'game-constants', schema: gameConstantsSchema },
            { name: 'connections-histories', schema: connectionsHistorySchema },
        ]),
    ],
    controllers: [GameController, ConfigController, UserController, ReplayController],
    providers: [
        GameFinderGateway,
        ConfigService,
        Logger,
        GameHistoryService,
        ConnectionsHistoryService,
        GameService,
        GameConstantsService,
        GameImageService,
        GameModeGateway,
        ChatGateway,
        GameModeService,
        ImageService,
        AvatarImageService,
        WaitingRoomGateway,
        UserService,
        ReplayService,
        UserGateway,
        ChatService,
        RatingService,
        ReplayGateway,
        FriendGateway,
        TokenService,
    ],
})
export class AppModule {}
