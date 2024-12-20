/* eslint-disable no-underscore-dangle */
import { Injectable } from '@angular/core';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { UserService } from '@app/services/user/user.service';
import { UserProfile } from '@common/classes/user-profile';
import { FriendEvents } from '@common/enums/friend.gateway.variables';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class FriendService {
    requestSent$: Subject<string> = new Subject<string>();
    requestReceived$: Subject<string> = new Subject<string>();
    requestAccepted$: Subject<string> = new Subject<string>();
    requestDeclined$: Subject<string> = new Subject<string>();
    requestsSeen$: Subject<null> = new Subject<null>();
    requestSeenOne$: Subject<null> = new Subject<null>();
    removeFriend$: Subject<string> = new Subject<string>();
    addUser$: Subject<UserProfile> = new Subject<UserProfile>();

    userId: string = '';

    constructor(private readonly userService: UserService, private readonly socketService: CommunicationSocketService) {}

    sendFriendRequest(userId: string) {
        this.socketService.send(FriendEvents.Request, { from: this.userService.loggedInUser?._id as string, to: userId });
    }

    acceptFriendRequest(userId: string) {
        this.socketService.send(FriendEvents.AcceptRequest, { from: userId, to: this.userService.loggedInUser?._id as string });
    }

    declineFriendRequest(userId: string) {
        this.socketService.send(FriendEvents.DeclineRequest, { from: userId, to: this.userService.loggedInUser?._id as string });
    }

    removeFriend(userId: string) {
        this.socketService.send(FriendEvents.RemoveFriend, { from: this.userService.loggedInUser?._id as string, to: userId });
    }

    seenFriendRequests() {
        this.socketService.send(FriendEvents.SeenRequests, this.userService.loggedInUser?._id);
    }

    registerFriendSocket() {
        this.socketService.send(FriendEvents.RegisterId, this.userService.loggedInUser?._id as string);
    }

    deregisterFriendSocket() {
        this.socketService.send(FriendEvents.RemoveId, this.userService.loggedInUser?._id as string);
    }

    registerSocketEvents(): void {
        this.socketService.on(FriendEvents.SentRequest, (userId: string) => {
            this.requestSent$.next(userId);
        });

        this.socketService.on(FriendEvents.Request, (userId: string) => {
            this.requestReceived$.next(userId);
        });

        this.socketService.on(FriendEvents.AcceptRequest, (userId: string) => {
            this.requestAccepted$.next(userId);
        });

        this.socketService.on(FriendEvents.DeclineRequest, (userId: string) => {
            this.requestDeclined$.next(userId);
        });

        this.socketService.on(FriendEvents.RemoveFriend, (userId: string) => {
            this.removeFriend$.next(userId);
        });

        this.socketService.on(FriendEvents.SeenRequests, () => {
            this.requestsSeen$.next(null);
        });

        this.socketService.on(FriendEvents.AddNewUser, (user: UserProfile) => {
            this.addUser$.next(user);
        });

        this.socketService.on(FriendEvents.SeenOneRequest, () => {
            this.requestSeenOne$.next(null);
        });
    }

    deregisterSocketEvents(): void {
        this.socketService.off(FriendEvents.SentRequest);
        this.socketService.off(FriendEvents.Request);
        this.socketService.off(FriendEvents.AcceptRequest);
        this.socketService.off(FriendEvents.DeclineRequest);
        this.socketService.off(FriendEvents.RemoveFriend);
        this.socketService.off(FriendEvents.SeenRequests);
        this.socketService.off(FriendEvents.SeenOneRequest);
        this.socketService.off(FriendEvents.AddNewUser);
    }
}
