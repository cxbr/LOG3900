import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WaitingRoomComponent } from '@app/components/waiting-room-dialog/waiting-room-dialog.component';
import { CameraPageComponent } from '@app/pages/camera-page/camera-page.component';
import { ConfigPageComponent } from '@app/pages/config-page/config-page.component';
import { ConnectionPageComponent } from '@app/pages/connection-page/connection-page.component';
import { CreationGamePageComponent } from '@app/pages/creation-game-page/creation-game-page.component';
import { GameManagementPageComponent } from '@app/pages/game-management-page/game-management-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { PasswordRecuperationPageComponent } from '@app/pages/password-recuperation-page/password-recuperation-page.component';
import { PicturePreviewPageComponent } from '@app/pages/picture-preview-page/picture-preview-page.component';
import { SelectPageComponent } from '@app/pages/select-page/select-page.component';
import { SignupPageComponent } from '@app/pages/signup-page/signup-page.component';
import { VideoReplayPageComponent } from '@app/pages/video-replay-page/video-replay-page.component';

const routes: Routes = [
    { path: '', redirectTo: '/connection', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'connection', component: ConnectionPageComponent },
    { path: 'signup', component: SignupPageComponent },
    { path: 'selection', component: SelectPageComponent },
    { path: 'config', component: ConfigPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'creation', component: CreationGamePageComponent },
    { path: 'waiting', component: WaitingRoomComponent },
    { path: 'capture', component: CameraPageComponent },
    { path: 'cature-preview', component: PicturePreviewPageComponent },
    { path: 'game-management', component: GameManagementPageComponent },
    { path: 'password-recuperation', component: PasswordRecuperationPageComponent },
    { path: 'video-replay', component: VideoReplayPageComponent },
    { path: '**', redirectTo: '/connection' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
