import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ReplayHttpService } from '@app/services/replay-http/replay-http.service';
import { UserService } from '@app/services/user/user.service';
import { Replay } from '@common/classes/replay';
import { ReplayVisibility } from '@common/enums/replay-visibility';

@Component({
    selector: 'app-video-replay-page',
    templateUrl: './video-replay-page.component.html',
    styleUrls: ['./video-replay-page.component.scss'],
})
export class VideoReplayPageComponent implements OnInit {
    @ViewChild('carousel', { static: false }) carouselElement: ElementRef;

    noReplays: boolean = false;
    allReplays: Replay[] = [];
    publicReplays: Replay[] = [];
    publicFilteredReplays: Replay[] = [];
    privateFilteredReplays: Replay[] = [];
    privateReplays: Replay[] = [];
    slickConfig = {
        slidesToShow: 2,
        slidesToScroll: 2,
        infinite: false,
    };
    selectedTabIndex = 0;
    searchText: string = '';
    replayVisibility = ReplayVisibility;
    resetKey = true;
    privateResetKey = true;

    constructor(private replayHttpService: ReplayHttpService, private userService: UserService, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.getAllReplays();
        this.cdr.detectChanges();
    }

    getAllReplays(): void {
        this.replayHttpService.getAllReplays().subscribe((replays) => {
            if (replays.length === 0) {
                this.noReplays = true;
                return;
            }
            this.allReplays = replays;
            this.fetchUsernames();
            this.filterUsableReplays();
            this.setReplays();
        });
    }

    isOwnReplay(replayOwnerUsername: string): boolean {
        return replayOwnerUsername === this.userService.loggedInUser?._id;
    }

    onTabChange(event: MatTabChangeEvent): void {
        this.selectedTabIndex = event.index;
    }

    deleteReplay(replayId: string): void {
        this.replayHttpService.deleteReplay(replayId).subscribe(() => {
            this.allReplays = this.allReplays.filter((replay) => replay.id !== replayId);
            this.setReplays();
        });
    }

    changeVisibility(replayId: string): void {
        const replay = this.allReplays.find((r) => r.id === replayId);
        if (replay) {
            replay.public = !replay.public;
            this.replayHttpService.updateReplay(replay).subscribe(() => {
                this.setReplays();
            });
        }
    }

    filterPublicReplays(): void {
        this.publicFilteredReplays =
            this.searchText === ''
                ? this.publicReplays
                : this.publicReplays.filter(
                      (replay) =>
                          replay.gameName.toLowerCase().startsWith(this.searchText.toLowerCase()) ||
                          replay.creatorUsername?.toLowerCase().startsWith(this.searchText.toLowerCase()),
                  );
        this.resetKey = false;
        setTimeout(() => (this.resetKey = true), 0);
    }

    filterPrivateReplays(): void {
        this.privateFilteredReplays =
            this.searchText === ''
                ? this.privateReplays
                : this.privateReplays.filter(
                      (replay) =>
                          replay.creator === this.userService.loggedInUser?._id &&
                          (replay.gameName.toLowerCase().startsWith(this.searchText.toLowerCase()) ||
                              replay.creatorUsername?.toLowerCase().startsWith(this.searchText.toLowerCase())),
                  );
        this.privateResetKey = false;
        setTimeout(() => (this.privateResetKey = true), 0);
    }

    trackByReplay(index: unknown, item: { id: unknown }) {
        return item.id;
    }

    deleteUserReplays(): void {
        if (!this.userService.loggedInUser?._id) return;
        this.replayHttpService.deleteAllUserReplays(this.userService.loggedInUser?._id).subscribe(() => {
            this.allReplays = this.allReplays.filter((r) => r.creator !== this.userService.loggedInUser?._id);
            this.noReplays = this.allReplays.length === 0;
            this.setReplays();
        });
    }

    private setReplays(): void {
        this.publicReplays = this.allReplays.filter((replay) => replay.public);
        this.filterPublicReplays();
        this.privateReplays = this.allReplays.filter((replay) => this.userService.loggedInUser?._id === replay.creator);
        this.filterPrivateReplays();
    }

    private filterUsableReplays(): void {
        this.allReplays = this.allReplays.filter((replay) => replay.snapshots.length > 0);
    }

    private fetchUsernames(): void {
        this.allReplays.forEach((replay) => {
            this.userService.getUsernameById(replay.creator).subscribe((username) => {
                replay.creatorUsername = username;
            });
        });
    }
}
