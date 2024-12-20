import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/chat_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/create_join_game_dialog.dart';
import 'package:android_client/components/friend_button.dart';
import 'package:android_client/services/friend_service.dart';
import 'package:android_client/services/game_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});
  @override
  MainScreenState createState() => MainScreenState();
}

class MainScreenState extends State<MainScreen> {
  final UserService _userService = UserService();
  final GameService _gameService = GameService();
  final FriendService _friendService = FriendService();

  void _disconnect() {
    _friendService.deregisterFriendSocket();
    _userService.logout(
      context,
    );
  }

  @override
  void initState() {
    super.initState();
    _friendService.registerFriendSocket();
    _gameService.getAllGames();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          Stack(
            children: [
              Column(
                children: [
                  AlignedButton(
                    button: DefaultButton(
                      buttonText: "Déconnexion",
                      onPressed: _disconnect,
                    ),
                    rowAlignment: MainAxisAlignment.start,
                  ),
                  const ChatButton(
                    padding: EdgeInsets.fromLTRB(30, 0, 0, 0),
                  ),
                  const FriendButton(),
                ],
              ),
              Column(children: [
                AlignedButton(
                  button: DefaultButton(
                    buttonText: "Profil",
                    onPressed: () =>
                        Navigator.pushNamed(context, "/configScreen"),
                  ),
                  rowAlignment: MainAxisAlignment.end,
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(0.0, 0.0, 30.0, 0.0),
                  child: Align(
                    alignment: Alignment.topRight,
                    child: DefaultButton(
                      icon: const IconData(0xe6a5, fontFamily: 'MaterialIcons'),
                      onPressed: () =>
                          Navigator.pushNamed(context, "/videoReplayScreen"),
                    ),
                  ),
                ),
              ])
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/images/logo.png',
                fit: BoxFit.contain,
                width: 300,
                height: 250,
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  DefaultButton(
                    buttonText: "Mode Classique",
                    onPressed: () =>
                        Navigator.pushNamed(context, "/selectionScreen"),
                  ),
                  const SizedBox(width: 60.0),
                  DefaultButton(
                    buttonText: "Mode Temps Limité",
                    onPressed: onCardSelect,
                  ),
                ],
              ),
            ],
          ),
          const Row(children: [
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    "Équipe 101",
                    style: TextStyle(fontSize: 20),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      CreditText(text: "Younes Benabbou"),
                      CreditText(text: "Ahmed Ben Rhouma"),
                      CreditText(text: "Ibrahim Boulahchiche"),
                      CreditText(text: "Coralie Brodeur"),
                      CreditText(text: "Juliette Legault"),
                      CreditText(text: "Dumitru Zlotea"),
                    ],
                  ),
                ],
              ),
            ),
          ]),
        ],
      ),
    );
  }

  void onCardSelect() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        // Corrected: Use the correct parameter name 'data' as expected in the constructor
        return const CreateJoinGameDialog(
            gameName: null, gameMode: 'mode Temps Limité');
      },
    );
  }
}

class CreditText extends StatelessWidget {
  final String text;

  const CreditText({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(20.0),
      child: Text(text, style: const TextStyle(fontSize: 20)),
    );
  }
}
