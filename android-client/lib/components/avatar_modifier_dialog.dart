import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/message_dialog.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/screens/camera_screen.dart';
import 'package:android_client/services/camera_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';

openAvatarModifierDialog(context, parentContext, sendRightAway) async {
  return await showDialog<String>(
      context: context,
      builder: (BuildContext context) => AvatarModifierDialog(
          sendRightAway: sendRightAway,
          initialRoute: ModalRoute.of(parentContext)!.settings.name as String));
}

class AvatarModifierDialog extends StatefulWidget {
  final String initialRoute;
  final bool sendRightAway;

  const AvatarModifierDialog(
      {Key? key, required this.initialRoute, required this.sendRightAway})
      : super(key: key);

  @override
  ProfileModifierState createState() => ProfileModifierState();
}

class ProfileModifierState extends State<AvatarModifierDialog> {
  late final UserService _userService;
  late final CameraService _cameraService;

  List<String> avatarUrls = [];

  ProfileModifierState() {
    _userService = UserService();
    _cameraService = CameraService();
  }

  void setAvatarUrls(data) {
    setState(() {
      avatarUrls = data;
    });
  }

  @override
  void initState() {
    super.initState();
    _userService.getAvatars(context, setAvatarUrls);
  }

  Future<void> _accessCamera() async {
    _cameraService.checkCameraAccess(context).then((permissionStatus) {
      if (permissionStatus.isGranted) {
        Navigator.push(
          context,
          MaterialPageRoute(
              builder: (context) => CameraScreen(
                    initialRoute: widget.initialRoute,
                    sendRightAway: widget.sendRightAway,
                  )),
        );
      } else if (permissionStatus.isPermanentlyDenied) {
        openMessageDialog(
            "Accédez aux paramètres de l'application pour autoriser Mismatch à prendre des photos.",
            false,
            context);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor:
          Provider.of<ThemeModel>(context, listen: false).primaryColor,
      child: Container(
        width: 1000,
        height: 400,
        decoration: defaultBoxDecoration,
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  DefaultButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    buttonText: "Annuler",
                  ),
                  DefaultButton(
                    onPressed: _accessCamera,
                    buttonText: "Prendre une photo",
                  ),
                ],
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(30.0),
                  child: GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                      crossAxisSpacing: 40.0,
                      mainAxisSpacing: 40.0,
                    ),
                    itemCount: avatarUrls.length,
                    itemBuilder: (context, index) {
                      return OutlinedButton(
                        style: defaultCircularButtonStyle.copyWith(
                            padding: const MaterialStatePropertyAll(
                                EdgeInsets.all(0))),
                        onPressed: () {
                          Navigator.pop(context, avatarUrls[index]);
                        },
                        child: CircleAvatar(
                          radius: 100,
                          backgroundImage: NetworkImage(avatarUrls[index]),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
