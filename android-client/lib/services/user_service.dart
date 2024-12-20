import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:android_client/classes/connection_type.dart';
import 'package:android_client/classes/user.dart';
import 'package:android_client/components/alert_dialog.dart';
import 'package:android_client/services/avatar_notifier_service.dart';
import 'package:android_client/services/chat_service.dart';
import 'package:android_client/services/socket_service.dart';
import 'package:android_client/services/user_http_service.dart';
import 'package:crypto/crypto.dart' as crypto;
import 'package:encrypt/encrypt.dart' as encrypt;
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class UserService {
  final String _tokenKey = 'token';
  static User? loggedInUser;
  late final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();
  late final UserHttpService _userHttpService;
  final _socketService = SocketService();
  static Map<String, UserProfileUI> usernameColorCache =
      <String, UserProfileUI>{};

  UserService() {
    _userHttpService = UserHttpService(http.Client());
    _socketService.connect();
  }

  void createNewUser(NewUser newUser, BuildContext context) async {
    LoginUser user =
        LoginUser(username: newUser.username, password: newUser.password);
    hashPassword(newUser);
    newUser = await _getLocalImageDataFromProvider(context, newUser);
    _userHttpService.signUp(newUser).then((userId) {
      final Connection connection = Connection(
          userId: userId,
          username: newUser.username,
          connectionType: ConnectionType.accountCreation.value,
          connectionTime: DateTime.now().millisecondsSinceEpoch);
      updateConnectionHistory(connection);
      Provider.of<AvatarNotifier>(context, listen: false).resetAvatarProvider();
      loginAfterSocket(
        user,
        context,
      );
    }).catchError((error) {
      openAlertDialog(error.toString(), context);
    });
  }

  void login(LoginUser user, BuildContext context) {
    _userHttpService.login(user).then((token) async {
      token.avatar = UserHttpService.getReplacedUrl(token.avatar);
      SharedPreferences prefs = await SharedPreferences.getInstance();
      prefs.setString(_tokenKey, user.username);
      loggedInUser = token;
      final Connection connection = Connection(
          userId: token.id.toString(),
          username: user.username,
          connectionType: ConnectionType.connection.value,
          connectionTime: DateTime.now().millisecondsSinceEpoch);
      updateConnectionHistory(connection);
      userLoggedIn();
      Navigator.of(context).pushReplacementNamed('/mainScreen');
      Provider.of<AvatarNotifier>(context, listen: false).avatar =
          loggedInUser!.avatar;
    }).catchError((error) {
      openAlertDialog(error.toString(), context);
    });
  }

  void logout(BuildContext context) async {
    _socketService.send('userDisconnected');
    Provider.of<AvatarNotifier>(context, listen: false).resetAvatarProvider();
    Navigator.of(context).pushReplacementNamed('/connectionScreen');
  }

  void isUserConnected(String username) {
    _socketService.send('isUserConnected', username);
  }

  void loginAfterSocket(LoginUser user, BuildContext context) {
    hashPassword(user);
    _socketService.on('isUserConnected', (isConnected) {
      if (isConnected) {
        openAlertDialog('Utilisateur déjà connecté', context);
      } else {
        login(user, context);
      }
      _socketService.off('isUserConnected');
    });
    isUserConnected(user.username);
  }

  Future<void> updateConnectionHistory(Connection connection) async {
    _userHttpService.updateConnectionHistory(connection);
  }

  Future<void> getAvatars(BuildContext context, Function callback) async {
    _userHttpService
        .getPredefinedAvatars()
        .then((data) => {callback(data)})
        .catchError((error) {
      openAlertDialog(error.toString(), context);
      return Future.value(<dynamic>{});
    });
  }

  Future<void> setAvatar(
      BuildContext context, bool isLocalFile, String avatarPath) async {
    UserAvatar userAvatar =
        UserAvatar(id: loggedInUser!.id, avatar: avatarPath);

    if (isLocalFile) {
      userAvatar.avatarData = await _getLocalImageData(userAvatar.avatar);
    }

    try {
      UserAvatar data = await _userHttpService.setAvatar(userAvatar);
      data.avatar = UserHttpService.getReplacedUrl(data.avatar);
      loggedInUser!.avatar = data.avatar;
      if (usernameColorCache.containsKey(loggedInUser!.username)) {
        final userProfileUI =
            usernameColorCache[loggedInUser!.username] as UserProfileUI;
        userProfileUI.avatar = data.avatar;
        usernameColorCache[loggedInUser!.username] = userProfileUI;
      }
    } on Exception catch (error) {
      print(error);
    }
  }

  void userLoggedIn() {
    _socketService.send('userConnected',
        {'username': loggedInUser?.username, 'isConnectedToAndroid': true});
    ChatService.resetSubscribedChannelsAndUnreadMessages();
    ChatService.handleRefreshListOfSubscribedChannels();
  }

  Future<bool> isLoggedIn() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final String? token = prefs.getString(_tokenKey);
    return token != null && token.isNotEmpty;
  }

  Future<String> getToken() async {
    return await isLoggedIn()
        ? (await SharedPreferences.getInstance()).getString(_tokenKey) ?? ''
        : '';
  }

  void hashPassword(dynamic user) {
    var key = crypto.md5.convert(utf8.encode(user.username)).toString();
    final encrypter = encrypt.Encrypter(
        encrypt.AES(encrypt.Key.fromUtf8(key), mode: encrypt.AESMode.ecb));
    var ivBtyes = Uint8List.fromList(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    final iv = encrypt.IV(ivBtyes);
    user.password = encrypter.encrypt(user.password, iv: iv).base64;
  }

  Future<Uint8List> _getLocalImageData(avatarUrl) async {
    return await File(avatarUrl).readAsBytes();
  }

  _getLocalImageDataFromProvider(context, newUser) async {
    final avatarNotifier = Provider.of<AvatarNotifier>(context, listen: false);
    if (avatarNotifier.isLocalFile) {
      newUser.avatarData = await _getLocalImageData(avatarNotifier.avatar);
    }
    return newUser;
  }

  String decryptPassword(String encryptedPassword, String username) {
    var key = crypto.md5.convert(utf8.encode(username)).toString();
    final encrypter = encrypt.Encrypter(
        encrypt.AES(encrypt.Key.fromUtf8(key), mode: encrypt.AESMode.ecb));
    var ivBtyes = Uint8List.fromList(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    final iv = encrypt.IV(ivBtyes);
    return encrypter.decrypt64(encryptedPassword, iv: iv);
  }

  Future<http.Response> updateUsername(String newUsername) async {
    final String oldKey = loggedInUser!.username;
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    var oldPassword =
        decryptPassword(loggedInUser!.password, loggedInUser!.username);
    var user = UpdateUsername(
        username: newUsername,
        email: 'nd@nd.com',
        password: oldPassword,
        id: loggedInUser!.id);
    hashPassword(user);

    final response = _userHttpService.updateUsername(user);
    return response.then((http.Response response) {
      if (response.statusCode != 200) {
        String errorMessage = 'Une erreur est survenue';
        if (response.statusCode == 400) {
          errorMessage = 'Ce nom d\'utilisateur est déjà pris';
        }
        throw Exception(errorMessage);
      }
      _socketService.send('userDisconnected');
      prefs.setString(_tokenKey, newUsername);
      loggedInUser!.username = newUsername;
      loggedInUser!.password = user.password;
      userLoggedIn();
      if (usernameColorCache.containsKey(oldKey)) {
        usernameColorCache[newUsername] =
            usernameColorCache[oldKey] as UserProfileUI;
        usernameColorCache.remove(oldKey);
      }
      return response;
    });
  }

  Future<ResetPasswordUser> getUserByEmail(String email) async {
    try {
      final response = _userHttpService.getUserByEmail(email);
      return response.then((ResetPasswordUser user) {
        return user;
      });
    } on Exception catch (error) {
      throw Exception(error.toString());
    }
  }

  Future<http.Response> sendPasswordRecuperationEmail(String email) {
    final response = _userHttpService.sendPasswordRecuperationEmail(email);
    return response.then((http.Response response) {
      if (response.statusCode != 200) {
        throw Exception('Une erreur est survenue');
      }
      return response;
    }).catchError((error) {
      throw Exception(error.toString());
    });
  }

  Future<http.Response> verifyCode(String code) {
    final response = _userHttpService.verifyCode(code);
    return response.then((http.Response response) {
      if (response.statusCode == 400) {
        throw Exception('Code invalide');
      }
      return response;
    }).catchError((error) {
      throw Exception(error.toString());
    });
  }

  Future<http.Response> updatePassword(
      ResetPasswordUser resetPasswordUser, String password) {
    var user = UpdateUsername(
        username: resetPasswordUser.username,
        email: 'nd@nd.com',
        password: password,
        id: resetPasswordUser.userId);
    hashPassword(user);

    final response = _userHttpService.updatePassword(user);
    return response.then((http.Response response) {
      if (response.statusCode != 200) {
        throw Exception('Une erreur est survenue');
      }
      return response;
    }).catchError((error) {
      throw Exception(error.toString());
    });
  }

  void updateUsernameColor(String usernameColor) {
    UpdateUsernameColor userColor = UpdateUsernameColor(
        userId: loggedInUser!.id, usernameColor: usernameColor);
    _socketService.send('usernameColorUpdated', userColor);
  }

  Future<UserProfileUI> getUsernameUI(String userId, String username) {
    if (usernameColorCache.containsKey(username)) {
      return Future.value(usernameColorCache[username]);
    }
    userId = userId.replaceAll('"', '');
    final response = _userHttpService.getUsernameUI(userId);
    return response.then((UserProfileUI response) {
      response.avatar = UserHttpService.getReplacedUrl(response.avatar);
      response.usernameColor =
          response.usernameColor == '' ? "#000000" : response.usernameColor;
      usernameColorCache[username] = response;
      return response;
    }).catchError((error) {
      throw Exception(error.toString());
    });
  }

  Future<String> getUserIdByUsername(String username) {
    final response = _userHttpService.getUserIdByUsername(username);
    return response.then((String response) {
      return response;
    }).catchError((error) {
      throw Exception(error.toString());
    });
  }

  Future<List<UserProfile>> getUserList() async {
    try {
      return await _userHttpService.getUserList(loggedInUser?.id as String);
    } on Exception catch (error) {
      throw Exception(error.toString());
    }
  }

  Future<List<String>> getFriendList(String userId) async {
    try {
      return await _userHttpService.getFriendList(userId);
    } on Exception catch (error) {
      throw Exception(error.toString());
    }
  }

  Future<String> getFriendNoticationCount(String userId) async {
    try {
      return await _userHttpService.getFriendNotificationCount(userId);
    } on Exception catch (error) {
      throw Exception(error.toString());
    }
  }

  Future<String> getUsernameByUserId(String userId) async {
    final response = _userHttpService.getUsername(userId);
    return response.then((String response) {
      return response;
    }).catchError((error) {
      throw Exception(error.toString());
    });
  }
}
