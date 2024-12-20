import 'package:android_client/classes/game_data.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/game_card.dart';
import 'package:flutter/material.dart';

class ConfigCard extends StatelessWidget {
  final GameData gameCardData;
  const ConfigCard({super.key, required this.gameCardData});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
        width: MediaQuery.of(context).size.width * 0.5,
        child: Stack(children: [
          GameCard(gameCardData: gameCardData),
          const Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                  padding: EdgeInsets.fromLTRB(0.0, 0.0, 0.0, 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      DefaultButton(buttonText: "Supprimer"),
                      DefaultButton(buttonText: "Réinitialiser"),
                    ],
                  )))
        ]));
  }
}
