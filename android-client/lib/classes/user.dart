import 'dart:typed_data';

class User {
  String id;
  String username;
  String password;
  String avatar;
  List<String> friendList;

  User(
      {required this.id,
      required this.username,
      required this.password,
      required this.avatar,
      required this.friendList});

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'username': username,
      'password': password,
      'avatar': avatar,
      'friendList': friendList
    };
  }

  static Future<User> fromJson(decode) {
    return Future.value(User(
        id: decode['_id'],
        username: decode['username'],
        password: decode['password'],
        avatar: decode['avatar'],
        friendList: (decode['friendList'] as List).cast<String>()));
  }

  // This version of fromJson allows every field to be optional (used in the chat service)
  factory User.fromJsonWithOptionalFields(Map<String, dynamic> json) {
    return User(
        id: json['_id'] ?? '',
        username: json['username'] ?? '_anon',
        password: json['password'] ?? '',
        avatar: json['avatar'] ?? '',
        friendList: (json['friendList'] as List).cast<String>());
  }
}

class LoginUser {
  String username;
  String password;

  LoginUser({required this.username, required this.password});

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'password': password,
    };
  }
}

class NewUser {
  String username;
  String email;
  String password;
  String avatar;
  Uint8List? avatarData;

  NewUser(
      {required this.username,
      required this.email,
      required this.password,
      required this.avatar,
      this.avatarData});

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'email': email,
      'password': password,
      'avatar': avatar,
      'avatarData': avatarData
    };
  }
}

class UserAvatar {
  String id;

  String avatar;
  Uint8List? avatarData;

  UserAvatar({required this.id, required this.avatar, this.avatarData});

  Map<String, dynamic> toJson() {
    return {'_id': id, 'avatar': avatar, 'avatarData': avatarData};
  }

  static Future<UserAvatar> fromJson(decode) {
    return Future.value(
        UserAvatar(id: decode['_id'], avatar: decode['avatar']));
  }
}

class Friend {
  String id;
  String username;
  String avatar;

  Friend({required this.id, required this.username, required this.avatar});

  static Future<Friend> fromJson(decode) {
    return Future.value(Friend(
        id: decode['_id'],
        avatar: decode['avatar'] ?? '',
        username: decode['username']));
  }
}

class UserProfile {
  String id;
  String username;
  String avatar;
  String state;

  UserProfile(
      {required this.id,
      required this.username,
      required this.avatar,
      required this.state});

  static Future<UserProfile> fromJson(decode) {
    return Future.value(UserProfile(
        id: decode['_id'],
        avatar: decode['avatar'] ?? '',
        username: decode['username'],
        state: decode['state']));
  }
}

class Connection {
  String userId;
  String username;
  String connectionType;
  int connectionTime;

  Connection(
      {required this.userId,
      required this.username,
      required this.connectionType,
      required this.connectionTime});

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'username': username,
      'connectionType': connectionType,
      'connectionTime': connectionTime,
    };
  }

  factory Connection.fromJson(Map<String, dynamic> json) {
    return Connection(
      userId: json['userId'],
      username: json['username'],
      connectionType: json['connectionType'],
      connectionTime: json['connectionTime'],
    );
  }
}

class UpdateUsername {
  String username;
  String email;
  String password;
  String id;

  UpdateUsername(
      {required this.username,
      required this.email,
      required this.password,
      required this.id});

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'email': email,
      'password': password,
      '_id': id,
    };
  }

  static Future<UpdateUsername> fromJson(decode) {
    return Future.value(UpdateUsername(
      username: decode['username'],
      email: decode['email'],
      password: decode['password'],
      id: decode['_id'],
    ));
  }
}

class ResetPasswordUser {
  String username;
  String userId;

  ResetPasswordUser({required this.username, required this.userId});

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'userId': userId,
    };
  }

  static Future<ResetPasswordUser> fromJson(decode) {
    return Future.value(ResetPasswordUser(
      username: decode['username'],
      userId: decode['userId'],
    ));
  }
}

class UpdateUsernameColor {
  String userId;
  String usernameColor;

  UpdateUsernameColor({required this.userId, required this.usernameColor});

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'usernameColor': usernameColor,
    };
  }

  static Future<UpdateUsernameColor> fromJson(decode) {
    return Future.value(UpdateUsernameColor(
      userId: decode['userId'],
      usernameColor: decode['usernameColor'],
    ));
  }
}

class UserProfileUI {
  String avatar;
  String usernameColor;

  UserProfileUI({required this.avatar, required this.usernameColor});

  Map<String, dynamic> toJson() {
    return {
      'avatar': avatar,
      'usernameColor': usernameColor,
    };
  }

  static Future<UserProfileUI> fromJson(decode) {
    return Future.value(UserProfileUI(
      avatar: decode['avatar'],
      usernameColor: decode['usernameColor'] ?? '',
    ));
  }
}
