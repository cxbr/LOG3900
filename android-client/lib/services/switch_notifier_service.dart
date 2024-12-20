import 'package:android_client/constants/style.dart';
import 'package:android_client/services/theme_manager_service.dart';
import 'package:flutter/material.dart';

abstract class SwitchStateNotifier extends ChangeNotifier {
  bool _isSwitched = false;

  bool get isSwitched => _isSwitched;

  void updateSwitch(bool value) {
    _isSwitched = value;
    notifyListeners();
  }
}

class ThemeModel extends SwitchStateNotifier {
  ThemeManager _manager = ThemeManager();
  late Color _primaryColor;
  late Color _textColor = darkTextColor;
  late Color _buttonColor = darkButtonColor;

  ThemeModel() {
    _manager = ThemeManager();
    _getPreferences().then((_) {});
  }

  void _setColors() {
    _primaryColor = _isSwitched ? darkPrimaryColor : lightPrimaryColor;
    _textColor = _isSwitched ? lightTextColor : darkTextColor;
    _buttonColor = _isSwitched ? darkButtonColor : lightButtonColor;
  }

  get primaryColor => _primaryColor;
  get textColor => _textColor;
  get buttonColor => _buttonColor;

  Future<void> _getPreferences() async {
    bool? isDarkTheme = await _manager.getTheme();

    if (isDarkTheme == null) {
      updateSwitch(false);
      _isSwitched = false;
    } else {
      _isSwitched = isDarkTheme;
    }
    _setColors();
    notifyListeners();
  }

  @override
  updateSwitch(bool value) {
    _isSwitched = value;
    _setColors();
    _manager.setTheme(value);
    notifyListeners();
  }
}
