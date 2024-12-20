import 'package:android_client/constants/style.dart';
import 'package:flutter/material.dart';

ButtonStyle buildDefaultButtonStyle(BuildContext context) {
  return ButtonStyle(
    backgroundColor:
        MaterialStateProperty.resolveWith<Color>((Set<MaterialState> states) {
      if (states.contains(MaterialState.pressed)) {
        return accentColor;
      } else if (states.contains(MaterialState.disabled)) {
        return Color(0xFFE6E6E6);
      }
      return Colors.white;
    }),
    padding: MaterialStateProperty.all(
      EdgeInsets.symmetric(
        vertical: MediaQuery.of(context).size.height * 0.025,
        horizontal: MediaQuery.of(context).size.width * 0.04,
      ),
    ),
    textStyle: MaterialStateProperty.all(
      TextStyle(
        fontFamily: 'Roboto',
        fontWeight: FontWeight.w600,
        fontSize: MediaQuery.of(context).size.height * 0.02,
        letterSpacing: 0.1 * MediaQuery.of(context).size.width * 0.01,
      ),
    ),
    side: MaterialStateProperty.all(
        const BorderSide(color: Colors.black, width: 2)),
    shape: MaterialStateProperty.all(
      RoundedRectangleBorder(
        borderRadius:
            BorderRadius.circular(MediaQuery.of(context).size.width * 0.02),
      ),
    ),
  );
}

class DefaultButton extends StatelessWidget {
  // Note: To overwrite a button's default style, set the customStyle attribute.
  // Ex: customStyle: buildDefaultButtonStyle.copyWith(<styleProperty>: <value>, ...)

  final String? buttonText;
  final IconData? icon;
  final VoidCallback? onPressed;
  final ButtonStyle? customStyle;

  const DefaultButton({
    super.key,
    this.buttonText,
    this.onPressed,
    this.customStyle,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      style: customStyle ?? buildDefaultButtonStyle(context),
      onPressed: onPressed,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) Icon(icon, size: 24, color: Colors.black),
          if (buttonText != null && icon != null) const SizedBox(width: 8),
          Text(buttonText ?? "", style: const TextStyle(color: Colors.black)),
        ],
      ),
    );
  }
}
