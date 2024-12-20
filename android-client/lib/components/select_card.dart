import 'package:android_client/classes/game_data.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/create_join_game_dialog.dart';
import 'package:android_client/components/game_card.dart';
import 'package:android_client/screens/waiting_screen.dart';
import 'package:android_client/services/game_setup_service.dart';
import 'package:flutter/material.dart';

class SelectCard extends StatefulWidget {
  final GameData gameCardData;

  const SelectCard({Key? key, required this.gameCardData}) : super(key: key);

  @override
  SelectCardState createState() => SelectCardState();
}

class SelectCardState extends State<SelectCard> {
  bool isJoinGameCalled = false;
  late final GameSetupService gameSetupService;
  bool isButtonPressed = false;

  @override
  void initState() {
    super.initState();
    gameSetupService = GameSetupService('mode Classique');
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: MediaQuery.of(context).size.width * 0.5,
      child: Stack(
        children: [
          GameCard(gameCardData: widget.gameCardData),
          Align(
            alignment: Alignment.topRight,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(0.0, 20.0, 20.0, 0.0),
              child: DefaultButton(
                buttonText: "Sélectionner",
                onPressed: onCardSelect,
                customStyle: buildDefaultButtonStyle(context).copyWith(
                    padding: MaterialStatePropertyAll<EdgeInsets>(
                        EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: MediaQuery.of(context).size.height * 0.025,
                ))),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void onCardSelect() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return CreateJoinGameDialog(
          gameName: widget.gameCardData.name,
          gameMode: 'mode Classique',
        );
      },
    );
  }

  void joinGame() {
    if (!isJoinGameCalled) {
      isJoinGameCalled = true;
      if (mounted) {
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const WaitingScreen()),
        );
      }
    }
  }
}
