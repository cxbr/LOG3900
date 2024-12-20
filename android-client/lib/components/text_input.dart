import 'package:android_client/constants/style.dart';
import 'package:flutter/material.dart';

class TextInput extends StatelessWidget {
  final String? hintText;
  final double? width;

  // Function to call on submit
  final Function? onSubmitted;

  // Function to call when the text changes
  final Function? onChanged;

  // Function to call on submit
  final Function? onEditingComplete;

  // The controller used to get the text
  final TextEditingController? controller;

  final bool? readOnly;
  final TextAlign? textAlign;

  final Color? color;

  final int maxLength;

  final FocusNode? focusNode;

  const TextInput(
      {super.key,
      this.hintText,
      this.width = 280.0,
      this.onSubmitted,
      this.onChanged,
      this.controller,
      this.readOnly = false,
      this.textAlign = TextAlign.start,
      this.color,
      this.onEditingComplete,
      this.maxLength = 100,
      this.focusNode = null});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: TextField(
        textAlign: textAlign!,
        readOnly: readOnly!,
        controller: controller,
        maxLength: maxLength,
        decoration: InputDecoration(
          hintText: hintText,
          filled: true,
          fillColor: Colors.white,
          enabledBorder: defaultTextInputStyle,
          focusedBorder: defaultTextInputStyle,
          counterText: "",
        ),
        onSubmitted: onSubmitted as void Function(String)?,
        onEditingComplete: onEditingComplete as void Function()?,
        onChanged: onChanged as void Function(String)?,
        style: TextStyle(color: color ?? Colors.black),
        focusNode: focusNode,
      ),
    );
  }
}
