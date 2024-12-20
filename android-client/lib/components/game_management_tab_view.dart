import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/carousel.dart';
import 'package:flutter/material.dart';

class GameManagementTabView extends StatelessWidget {
  const GameManagementTabView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(children: [
      Expanded(
          flex: 3,
          // child: Center(
          child: Padding(
            padding: EdgeInsets.fromLTRB(0.0, 30.0, 0.0, 0.0),
            child: Carousel(cardType: CardType.configCard),
          )),
      // ),
      Expanded(
          flex: 1,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              DefaultButton(buttonText: "Réinitialisation des scores"),
              SizedBox(width: 60.0),
              DefaultButton(buttonText: "Suppression des jeux")
            ],
          ))
    ]);
  }
}
