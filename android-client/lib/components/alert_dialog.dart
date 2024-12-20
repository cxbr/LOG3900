import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void openAlertDialog(String errorMessage, BuildContext context) {
  errorMessage = errorMessage.replaceAll('Exception: ', '');
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        backgroundColor:
            Provider.of<ThemeModel>(context, listen: false).primaryColor,
        content: Text(errorMessage, style: defaultFont),
        actions: <Widget>[
          DefaultButton(
            buttonText: 'Fermer',
            onPressed: () {
              Navigator.of(context).pop();
            },
          ),
        ],
      );
    },
  );
}
