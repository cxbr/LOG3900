import 'dart:convert';

import 'package:android_client/api/firebase_api.dart';
import 'package:android_client/classes/friend_notifier.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/firebase_options.dart';
import 'package:android_client/screens/config_screen.dart';
import 'package:android_client/screens/connection_screen.dart';
import 'package:android_client/screens/game_screen.dart';
import 'package:android_client/screens/main_screen.dart';
import 'package:android_client/screens/password_recuperation_screen.dart';
import 'package:android_client/screens/selection_screen.dart';
import 'package:android_client/screens/signup_screen.dart';
import 'package:android_client/screens/video_replay_screen.dart';
import 'package:android_client/screens/waiting_screen.dart';
import 'package:android_client/services/avatar_notifier_service.dart';
import 'package:android_client/services/chat_service.dart';
import 'package:android_client/services/play-area_service.dart';
import 'package:android_client/services/project_constants_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:fullscreen_window/fullscreen_window.dart';
import 'package:http/http.dart' as http;
import 'package:nested/nested.dart';
import 'package:provider/provider.dart';

final navigatorKey = GlobalKey<NavigatorState>();
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.android);
  //Retrieve the Firebase Token of the device.
  String token = await FirebaseMessaging.instance.getToken() as String;
  await FirebaseMessaging.instance.setAutoInitEnabled(true);
  await http.post(
    Uri.parse('${ProjectConstantsService.serverAddress}/user/fcm-token'),
    headers: {'Content-Type': 'application/json'},
    body: json.encode({'token': token}),
  );

  await FirebaseApi().initNotifications();

  runApp(const MainApp());
}

class MainApp extends StatefulWidget {
  const MainApp({super.key});

  @override
  State<MainApp> createState() => MainAppState();
}

class MainAppState extends State<MainApp> with WidgetsBindingObserver {
  String screenSizeText = "";
  void setFullScreen(bool isFullScreen) {
    FullScreenWindow.setFullScreen(isFullScreen);
  }

  @override
  void initState() {
    super.initState();
    ChatService.handleMessageNotification();
  }

  @override
  Widget build(BuildContext context) {
    setFullScreen(true);
    return MultiProvider(
        providers: <SingleChildWidget>[
          ChangeNotifierProvider<FriendNotifier>(
              create: (BuildContext context) => FriendNotifier()),
          ChangeNotifierProvider<ThemeModel>(
              create: (BuildContext context) => ThemeModel()),
          ChangeNotifierProvider<AvatarNotifier>(
              create: (BuildContext context) => AvatarNotifier()),
          ChangeNotifierProvider<PlayAreaService>(
              create: (BuildContext context) => PlayAreaService()),
        ],
        child: Consumer<ThemeModel>(builder:
            (BuildContext context, ThemeModel themeNotifier, Widget? child) {
          return MaterialApp(
            title: 'MISMATCH',
            theme: themeNotifier.isSwitched
                ? darkTheme.copyWith(
                    textTheme: ThemeData.dark().textTheme.apply(
                          bodyColor: themeNotifier.textColor,
                          displayColor: themeNotifier.textColor,
                        ),
                  )
                : lightTheme.copyWith(
                    textTheme: ThemeData.light().textTheme.apply(
                          bodyColor: themeNotifier.textColor,
                          displayColor: themeNotifier.textColor,
                        ),
                  ),
            routes: <String, WidgetBuilder>{
              // Routes that need parameters are not listed here
              "/connectionScreen": (BuildContext context) =>
                  const ConnectionScreen(),
              "/signupScreen": (BuildContext context) => const SignupScreen(),
              "/mainScreen": (BuildContext context) => const MainScreen(),
              "/configScreen": (BuildContext context) => const ConfigScreen(),
              "/selectionScreen": (BuildContext context) =>
                  const SelectionScreen(),
              "/waitingScreen": (BuildContext context) => const WaitingScreen(),
              "/gameScreen": (BuildContext context) => const GameScreen(),
              "/passwordRecuperationScreen": (BuildContext context) =>
                  PasswordRecuperationScreen(),
              "/videoReplayScreen": (BuildContext context) =>
                  const VideoReplayScreen(),
            },
            home: const ConnectionScreen(),
          );
        }));
  }
}
