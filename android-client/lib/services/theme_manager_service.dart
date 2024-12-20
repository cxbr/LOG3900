import 'package:shared_preferences/shared_preferences.dart';

class ThemeManager {
  static const themeKey = "theme_key";

  void setTheme(bool isDarkTheme) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    prefs.setBool(themeKey, isDarkTheme);
  }

  getTheme() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.getBool(themeKey);
  }
}
