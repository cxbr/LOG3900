import 'dart:io';

import 'package:flutter/material.dart';

class AvatarNotifier extends ChangeNotifier {
  String _avatarUrl = '';
  bool isLocalFile = false;

  String get avatar => _avatarUrl;

  set avatar(String url) {
    _avatarUrl = url;
    notifyListeners();
  }

  Object buildAvatar() {
    return isLocalFile ? FileImage(File(_avatarUrl)) : NetworkImage(_avatarUrl);
  }

  void resetAvatarProvider() {
    _avatarUrl = '';
    isLocalFile = false;
  }
}
