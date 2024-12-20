import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/chat_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/carousel.dart';
import 'package:flutter/material.dart';

class SelectionScreen extends StatelessWidget {
  const SelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: Column(children: [
      AlignedButton(
          screenTitle: "Sélection",
          button: DefaultButton(
            buttonText: "Retour",
            onPressed: () => {Navigator.pushNamed(context, "/mainScreen")},
          ),
          rowAlignment: MainAxisAlignment.start),
      const ChatButton(padding: EdgeInsets.fromLTRB(30.0, 0, 0, 0)),
      const Expanded(child: Carousel(cardType: CardType.selectCard))
    ]));
  }
}
