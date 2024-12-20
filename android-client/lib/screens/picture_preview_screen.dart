import 'dart:io';

import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/avatar_notifier_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class PicturePreviewScreen extends StatelessWidget {
  final String imagePath;
  final String initialRoute;
  final bool sendRightAway;

  late final AvatarNotifier _avatarNotifier;
  final UserService _userService = UserService();

  // ignore: prefer_const_constructors_in_immutables
  PicturePreviewScreen(
      {super.key,
      required this.imagePath,
      required this.initialRoute,
      required this.sendRightAway});

  Future<void> _setAvatar(BuildContext context) async {
    if (!sendRightAway) {
      _avatarNotifier.avatar = imagePath;
      _avatarNotifier.isLocalFile = true;
    } else {
      await _userService.setAvatar(context, true, imagePath);
      Provider.of<AvatarNotifier>(context, listen: false).avatar =
          '${UserService.loggedInUser!.avatar}?${UniqueKey()}';
    }
    Navigator.popUntil(context, ModalRoute.withName(initialRoute));
  }

  @override
  Widget build(BuildContext context) {
    _avatarNotifier = Provider.of<AvatarNotifier>(context, listen: false);
    return Scaffold(
      body: Column(children: [
        Stack(children: [
          AlignedButton(
              button: DefaultButton(
                buttonText: "Reprendre une photo",
                onPressed: () => Navigator.pop(context),
              ),
              screenTitle: "Aperçu",
              rowAlignment: MainAxisAlignment.start),
          AlignedButton(
              button: DefaultButton(
                buttonText: "Ajouter la photo de profil",
                onPressed: () async {
                  await _setAvatar(context);
                },
              ),
              rowAlignment: MainAxisAlignment.end)
        ]),
        Padding(
          padding: const EdgeInsets.only(top: 140),
          child: Container(
              decoration: circularBoxDecoration,
              width: 500,
              child: CircleAvatar(
                radius: 200,
                backgroundImage: FileImage(File(imagePath)),
              )),
        ),
      ]),
    );
  }
}
