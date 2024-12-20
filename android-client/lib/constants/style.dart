import 'package:flutter/material.dart';

// Color palette

Color lightPrimaryColor = const Color(0xFFFEDAC2);
Color darkPrimaryColor = const Color(0xFF262626);
Color accentColor = const Color(0xFFFA959B);

Color lightTextColor = Colors.white;
Color darkTextColor = Colors.black;

Color lightButtonColor = Colors.white;
Color darkButtonColor = accentColor;

// Themes

ThemeData lightTheme = ThemeData(
    scaffoldBackgroundColor: lightPrimaryColor,
    textTheme: const TextTheme(
        bodyLarge: TextStyle(
      fontFamily: "Roboto",
    )),
    textSelectionTheme:
        const TextSelectionThemeData(selectionHandleColor: Colors.black));

ThemeData darkTheme = ThemeData(
    scaffoldBackgroundColor: darkPrimaryColor,
    textTheme: const TextTheme(
        bodyLarge: TextStyle(
      fontFamily: "Roboto",
    )),
    textSelectionTheme:
        const TextSelectionThemeData(selectionHandleColor: Colors.black));

// Fonts

const TextStyle defaultFontTitle =
    TextStyle(fontSize: 20.0, letterSpacing: 2.0, fontWeight: FontWeight.bold);

const TextStyle defaultFont = TextStyle(fontSize: 20.0, letterSpacing: 2.0);

// Borders

BoxDecoration defaultBoxDecoration = BoxDecoration(
    border: Border.all(width: 3), borderRadius: BorderRadius.circular(25));

BoxDecoration boxDecorationWithBackground = BoxDecoration(
    border: Border.all(width: 3),
    borderRadius: BorderRadius.circular(25),
    color: Colors.white);

BoxDecoration circularBoxDecoration =
    BoxDecoration(border: Border.all(width: 3), shape: BoxShape.circle);

// Buttons

ButtonStyle genericButtonStyle = OutlinedButton.styleFrom(
    backgroundColor: Colors.white,
    side: const BorderSide(width: 2),
    textStyle: defaultFont,
    foregroundColor: Colors.black);

ButtonStyle defaultRectangularButtonStyle = genericButtonStyle.merge(
    OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 50.0)));

ButtonStyle defaultSquarishButtonStyle = genericButtonStyle.merge(
    OutlinedButton.styleFrom(
        padding: const EdgeInsets.all(30),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.0))));

ButtonStyle defaultCircularButtonStyle = genericButtonStyle.merge(
    OutlinedButton.styleFrom(
        shape: const CircleBorder(),
        padding: const EdgeInsets.all(20),
        minimumSize: const Size(80, 80)));

// Text Inputs

OutlineInputBorder defaultTextInputStyle = OutlineInputBorder(
    borderRadius: BorderRadius.circular(30.0),
    borderSide: const BorderSide(width: 3));

OutlineInputBorder errorTextInputStyle = defaultTextInputStyle.copyWith(
    borderSide: const BorderSide(color: Color(0xFFC13A31), width: 3));
