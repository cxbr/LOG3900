import 'package:android_client/classes/friend_notifier.dart';
import 'package:android_client/classes/user.dart';
import 'package:android_client/services/socket_service.dart';
import 'package:android_client/services/user_http_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

enum UserState {
  isFriend,
  requestReceived,
  requestUnseen,
  requestSent,
  isStranger,
}

enum FriendEvent {
  seenOneRequest,
  seenRequests,
  registerId,
  removeId,
  request,
  sentRequest,
  receiveRequest,
  acceptRequest,
  declineRequest,
  removeFriend,
  addNewUser
}

class FriendService {
  late final FriendNotifier _friendNotifier;
  final SocketService _socketService = SocketService();
  final UserService _userService = UserService();

  FriendService();

  void setUsers(Function setUsersCallback) {
    _userService
        .getUserList()
        .then((List<UserProfile> users) => {setUsersCallback(users)});
  }

  void registerFriendSocket() {
    _socketService.send(
        FriendEvent.registerId.name, UserService.loggedInUser?.id);
  }

  void deregisterFriendSocket() {
    _socketService.send(
        FriendEvent.removeId.name, UserService.loggedInUser?.id);
  }

  void seenFriendRequests() {
    _socketService.send(
        FriendEvent.seenRequests.name, UserService.loggedInUser?.id);
  }

  void sendFriendRequest(String userId) {
    _socketService.send(FriendEvent.request.name,
        <String, String?>{'from': UserService.loggedInUser?.id, 'to': userId});
  }

  void acceptFriendRequest(String userId) {
    _socketService.send(FriendEvent.acceptRequest.name,
        <String, String?>{'from': userId, 'to': UserService.loggedInUser?.id});
  }

  void declineFriendRequest(String userId) {
    _socketService.send(FriendEvent.declineRequest.name,
        <String, String?>{'from': userId, 'to': UserService.loggedInUser?.id});
  }

  void removeFriend(String userId) {
    _socketService.send(FriendEvent.removeFriend.name,
        <String, String?>{'from': UserService.loggedInUser?.id, 'to': userId});
  }

  void resetSocketEvents(BuildContext context) {
    _friendNotifier = Provider.of<FriendNotifier>(context, listen: false);

    unbindSocketEvents();

    _socketService.on(FriendEvent.sentRequest.name, (dynamic userId) async {
      _friendNotifier.propagateEvent(FriendEvent.sentRequest.name, userId);
    });

    _socketService.on(FriendEvent.request.name, (dynamic userId) async {
      _friendNotifier.propagateEvent(FriendEvent.request.name, userId);
    });

    _socketService.on(FriendEvent.acceptRequest.name, (dynamic userId) async {
      _friendNotifier.propagateEvent(FriendEvent.acceptRequest.name, userId);
    });

    _socketService.on(FriendEvent.declineRequest.name, (dynamic userId) async {
      _friendNotifier.propagateEvent(FriendEvent.declineRequest.name, userId);
    });

    _socketService.on(FriendEvent.removeFriend.name, (dynamic userId) async {
      _friendNotifier.propagateEvent(FriendEvent.removeFriend.name, userId);
    });

    _socketService.on(FriendEvent.seenOneRequest.name, (dynamic userId) async {
      _friendNotifier.propagateEvent(FriendEvent.seenOneRequest.name, '');
    });

    _socketService.on(FriendEvent.seenRequests.name, (dynamic userId) async {
      _friendNotifier.propagateEvent(FriendEvent.seenRequests.name, '');
    });

    _socketService.on(FriendEvent.addNewUser.name, (dynamic user) async {
      user = await UserProfile.fromJson(user);
      UserHttpService.getReplacedUrl(user.avatar);
      _friendNotifier.addNewUser(FriendEvent.addNewUser.name, user);
    });
  }

  void unbindSocketEvents() {
    _socketService.off(FriendEvent.sentRequest.name);
    _socketService.off(FriendEvent.request.name);
    _socketService.off(FriendEvent.acceptRequest.name);
    _socketService.off(FriendEvent.declineRequest.name);
    _socketService.off(FriendEvent.removeFriend.name);
    _socketService.off(FriendEvent.seenOneRequest.name);
    _socketService.off(FriendEvent.seenRequests.name);
    _socketService.off(FriendEvent.addNewUser.name);
  }
}
