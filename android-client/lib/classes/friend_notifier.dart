import 'package:android_client/classes/user.dart';
import 'package:android_client/services/friend_service.dart';
import 'package:flutter/material.dart';

class FriendNotifier extends ChangeNotifier {
  String _friendEvent = '';
  String _userId = '';
  late UserProfile _user;

  void propagateEvent(String event, String userId) {
    _friendEvent = event;
    _userId = userId;
    notifyListeners();
  }

  void addNewUser(String event, UserProfile user) {
    _friendEvent = event;
    _user = user;
    notifyListeners();
  }

  String get friendEvent => _friendEvent;
  String get userId => _userId;
  UserProfile get user => _user;

  void onFriendEvent(Function setUserState) {
    switch (friendEvent) {
      case "sentRequest":
        setUserState(UserState.requestSent);
        break;
      case "request":
        setUserState(UserState.requestUnseen);
        break;
      case "acceptRequest":
        setUserState(UserState.isFriend);
        break;
      case "declineRequest":
        setUserState(UserState.isStranger);
        break;
      case "removeFriend":
        setUserState(UserState.isStranger);
        break;
    }
  }
}
