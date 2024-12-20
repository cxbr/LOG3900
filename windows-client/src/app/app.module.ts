import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AccountTabComponent } from '@app/components/account-tab/account-tab.component';
import { AvatarModalComponent } from '@app/components/avatar-modal/avatar-modal.component';
import { AvatarComponent } from '@app/components/avatar/avatar.component';
import { ChannelSelectionItemComponent } from '@app/components/channel-selection-item/channel-selection-item.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { ChatModalComponent } from '@app/components/chat-modal/chat-modal.component';
import { ConfigParamsComponent } from '@app/components/config-params/config-params.component';
import { ConnectionHistoryComponent } from '@app/components/connection-history/connection-history.component';
import { CreateJoinGameDialogComponent } from '@app/components/create-join-game-dialog/create-join-game-dialog.component';
import { CreationDialogComponent } from '@app/components/creation-dialog/creation-dialog.component';
import { DeleteDialogComponent } from '@app/components/delete-dialog/delete-dialog.component';
import { EndgameDialogComponent } from '@app/components/endgame-dialog/endgame-dialog.component';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { GameHistoryComponent } from '@app/components/game-history/game-history.component';
import { GameScoreboardComponent } from '@app/components/game-scoreboard/game-scoreboard.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { UpdateUsernameDialogComponent } from '@app/components/update-username-dialog/update-username-dialog.component';
import { VideoReplayDialogComponent } from '@app/components/video-replay-dialog/video-replay-dialog.component';
import { WaitingRoomComponent } from '@app/components/waiting-room-dialog/waiting-room-dialog.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { CameraPageComponent } from '@app/pages/camera-page/camera-page.component';
import { ConfigPageComponent } from '@app/pages/config-page/config-page.component';
import { ConnectionPageComponent } from '@app/pages/connection-page/connection-page.component';
import { CreationGamePageComponent } from '@app/pages/creation-game-page/creation-game-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { PicturePreviewPageComponent } from '@app/pages/picture-preview-page/picture-preview-page.component';
import { SelectPageComponent } from '@app/pages/select-page/select-page.component';
import { SignupPageComponent } from '@app/pages/signup-page/signup-page.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { PrivateFilterPipe, PublicFilterPipe } from './classes/video-replay-pipe';
import { AvatarImageComponent } from './components/avatar-image/avatar-image.component';
import { ChatButtonComponent } from './components/chat-button/chat-button.component';
import { FriendButtonComponent } from './components/friend-button/friend-button.component';
import { FriendDialogComponent } from './components/friend-dialog/friend-dialog.component';
import { GameStatisticsComponent } from './components/game-statistics/game-statistics.component';
import { ManagementDialogComponent } from './components/management-dialog/management-dialog.component';
import { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
import { ProfileDialogComponent } from './components/profile-dialog/profile-dialog.component';
import { ProfileListComponent } from './components/profile-list/profile-list.component';
import { RenameDialogComponent } from './components/rename-dialog/rename-dialog.component';
import { ReviewModalComponent } from './components/review-modal/review-modal.component';
import { StarRatingComponent } from './components/star-rating/star-rating.component';
import { UpdatePasswordDialogComponent } from './components/update-password-dialog/update-password-dialog.component';
import { UpdateUsernameColorDialogComponent } from './components/update-username-color-dialog/update-username-color-dialog.component';
import { UsernameComponent } from './components/username/username.component';
import { VideoReplayCardDialogComponent } from './components/video-replay-card-dialog/video-replay-card-dialog.component';
import { VideoReplayCardComponent } from './components/video-replay-card/video-replay-card.component';
import { ReplayGameScoreboardComponent } from './components/video-replay-game-scoreboard/replay-game-scoreboard.component';
import { ReplayPlayAreaComponent } from './components/video-replay-play-area/replay-play-area.component';
import { GameManagementPageComponent } from './pages/game-management-page/game-management-page.component';
import { PasswordRecuperationPageComponent } from './pages/password-recuperation-page/password-recuperation-page.component';
import { VideoReplayPageComponent } from './pages/video-replay-page/video-replay-page.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        ConnectionPageComponent,
        SignupPageComponent,
        GamePageComponent,
        MainPageComponent,
        PlayAreaComponent,
        GameScoreboardComponent,
        ChatBoxComponent,
        GameCardComponent,
        CreationGamePageComponent,
        ConfigParamsComponent,
        GameHistoryComponent,
        EndgameDialogComponent,
        CreationDialogComponent,
        WaitingRoomComponent,
        DeleteDialogComponent,
        VideoReplayDialogComponent,
        CreateJoinGameDialogComponent,
        ChatModalComponent,
        SelectPageComponent,
        PicturePreviewPageComponent,
        ChannelSelectionItemComponent,
        ConnectionHistoryComponent,
        AccountTabComponent,
        AvatarComponent,
        AvatarModalComponent,
        ConfigPageComponent,
        PublicFilterPipe,
        PrivateFilterPipe,
        CameraPageComponent,
        MessageDialogComponent,
        UpdateUsernameDialogComponent,
        GameManagementPageComponent,
        PasswordRecuperationPageComponent,
        UpdatePasswordDialogComponent,
        RenameDialogComponent,
        ChatButtonComponent,
        StarRatingComponent,
        ReviewModalComponent,
        ManagementDialogComponent,
        UsernameComponent,
        UpdateUsernameColorDialogComponent,
        FriendDialogComponent,
        AvatarImageComponent,
        GameStatisticsComponent,
        VideoReplayPageComponent,
        VideoReplayCardComponent,
        VideoReplayCardDialogComponent,
        ProfileDialogComponent,
        FriendButtonComponent,
        ProfileListComponent,
        ReplayGameScoreboardComponent,
        ReplayPlayAreaComponent,
    ],
    bootstrap: [AppComponent],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        MatSlideToggleModule,
        MatGridListModule,
        HttpClientModule,
        SlickCarouselModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        CommonModule,
        MatDialogModule,
        ColorPickerModule,
        MatSliderModule,
        MatProgressBarModule,
        ReactiveFormsModule,
        MatTabsModule,
        MatSlideToggleModule,
        MatGridListModule,
    ],
    providers: [
        {
            provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
            useValue: { appearance: 'fill', hideRequiredMarker: true },
        },
    ],
})
export class AppModule {}
