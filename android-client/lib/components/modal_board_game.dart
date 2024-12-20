import 'package:android_client/components/buttons/default_button.dart';
import 'package:flutter/material.dart';

class ConfirmationAlertDialog extends StatelessWidget {
  final String title;
  final String positiveButtonText;
  final String negativeButtonText;
  final VoidCallback onPositivePressed;
  final VoidCallback onNegativePressed;

  const ConfirmationAlertDialog({
    Key? key,
    required this.title,
    required this.positiveButtonText,
    required this.negativeButtonText,
    required this.onPositivePressed,
    required this.onNegativePressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      scrollable: true,
      title: Text(title),
      content: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            DefaultButton(
              buttonText: positiveButtonText,
              onPressed: onPositivePressed,
            ),
            const SizedBox(width: 10),
            DefaultButton(
              buttonText: negativeButtonText,
              onPressed: onNegativePressed,
            ),
          ],
        ),
      ),
    );
  }
}
