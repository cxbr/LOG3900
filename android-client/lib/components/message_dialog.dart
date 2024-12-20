import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

openMessageDialog(String message, bool isDecision, BuildContext context) async {
  return await showDialog<bool>(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        backgroundColor:
            Provider.of<ThemeModel>(context, listen: false).primaryColor,
        content: Text(message,
            style: defaultFont.copyWith(
              color: Provider.of<ThemeModel>(context, listen: false).textColor,
            )),
        actions: <Widget>[
          if (isDecision)
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              DefaultButton(
                buttonText: 'Oui',
                onPressed: () {
                  Navigator.of(context).pop(true);
                },
              ),
              DefaultButton(
                buttonText: 'Non',
                onPressed: () {
                  Navigator.of(context).pop(false);
                },
              ),
            ])
        ],
      );
    },
  );
}
