import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/constants/style.dart';
import 'package:flutter/material.dart';

class AlignedButton extends StatelessWidget {
  final DefaultButton button;
  final MainAxisAlignment rowAlignment;
  final String screenTitle;

  const AlignedButton(
      {super.key,
      required this.button,
      required this.rowAlignment,
      this.screenTitle = ""});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(30.0, 30.0, 30.0, 0),
      child: Stack(
        children: [
          Row(
            mainAxisAlignment: rowAlignment,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [button],
          ),
          Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Text(screenTitle, style: defaultFont))
              ])
        ],
      ),
    );
  }
}
