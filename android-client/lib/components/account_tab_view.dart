import 'package:android_client/classes/user.dart';
import 'package:android_client/components/alert_dialog.dart';
import 'package:android_client/components/avatar.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/buttons/switch_button.dart';
import 'package:android_client/components/text_input.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/input_filtering_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import 'package:provider/provider.dart';

class AccountTabView extends StatelessWidget {
  const AccountTabView({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(children: [
          SizedBox(
              width: 1000,
              height: 300,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Avatar(
                    parentContext: context,
                    modify: true,
                    sendRightAway: true,
                  ),
                  const SizedBox(
                    width: 600,
                    height: 250,
                    child: InputContainer(),
                  )
                ],
              )),
          const SizedBox(
            height: 80.0,
          ),
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text("Thème sombre", style: defaultFont),
              SizedBox(
                width: 100.0,
              ),
              SwitchButton<ThemeModel>()
            ],
          )
        ]),
      ),
    );
  }
}

class InputContainer extends StatefulWidget {
  const InputContainer({super.key});

  @override
  InputContainerState createState() => InputContainerState();
}

class InputContainerState extends State<InputContainer> {
  String _username = "";
  String _modifiedUsername = "";
  Color _selfColor = Colors.black;
  Color currentColor = Colors.black;
  Color pickerColor = Colors.black;
  final TextEditingController _usernameController = TextEditingController();
  final UserService _userService = UserService();
  late Future<void> _tokenFuture = Future.value();

  @override
  void initState() {
    super.initState();
    _tokenFuture = getToken();
  }

  Future<void> getToken() async {
    await _userService.getToken().then((value) => {
          if (value.isNotEmpty)
            {
              _usernameController.text = value,
              _username = value,
              getOwnUsernameColor()
            }
        });
  }

  Future<void> getOwnUsernameColor() async {
    await _userService.getUserIdByUsername(_username).then((String userId) => {
          if (userId.isNotEmpty)
            {
              _userService
                  .getUsernameUI(userId, _username)
                  .then((UserProfileUI value) => {
                        _selfColor = _getColorFromHex(value.usernameColor),
                        setState(() {
                          currentColor = _getColorFromHex(value.usernameColor);
                        })
                      })
            }
        });
  }

  Color _getColorFromHex(String hexColor) {
    final hexCode = hexColor.replaceAll('#', '').replaceAll('"', '');
    return Color(int.parse('FF$hexCode', radix: 16));
  }

  void changeUsername(BuildContext context) {
    if (_username == _modifiedUsername) {
      String message =
          "Veuillez entrer un nom d'utilisateur différent du nom actuel";
      openAlertDialog(message, context);
      return;
    }
    if (_modifiedUsername.isEmpty) {
      String message = "Veuillez entrer un nom d'utilisateur valide";
      openAlertDialog(message, context);
      return;
    }
    if (InputFilteringService.isMessageVulgar(_modifiedUsername)) {
      String message = "Votre nom d'utilisateur contient des mots vulgaires!";
      openAlertDialog(message, context);
      return;
    }
    _userService.updateUsername(_modifiedUsername).then((response) {
      String message = "Nom d'utilisateur modifié avec succès";
      openAlertDialog(message, context);
      setState(() {
        _tokenFuture = getToken();
      });
    }).catchError((error) {
      openAlertDialog(error.toString(), context);
    });
  }

  void updateUsernameColor(BuildContext context) {
    String colorString =
        '#${currentColor.value.toRadixString(16).padLeft(8, '0').substring(2)}';
    _userService.updateUsernameColor(colorString);
    setState(() {
      _selfColor = currentColor;
      pickerColor = currentColor;
    });
    if (UserService.usernameColorCache.containsKey(_username)) {
      UserService.usernameColorCache[_username]!.usernameColor = colorString;
    }

    String message =
        "La couleur de votre nom d'utilisateur a été changée avec succès";
    openAlertDialog(message, context);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _tokenFuture,
      builder: (BuildContext context, AsyncSnapshot<void> snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const CircularProgressIndicator();
        } else {
          if (snapshot.hasError) {
            return Text('Error: ${snapshot.error}');
          } else {
            _modifiedUsername = _usernameController.text;
            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Nom d'utilisateur",
                      style: defaultFont,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: TextInput(
                            color: currentColor,
                            controller: _usernameController,
                            onChanged: (String s) => {
                              setState(() {
                                _modifiedUsername = _usernameController.text;
                              })
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        DefaultButton(
                          onPressed: _username != _modifiedUsername
                              ? () => changeUsername(context)
                              : null,
                          icon: Icons.save,
                        ),
                      ],
                    ),
                    const SizedBox(
                      height: 20.0,
                    ),
                    const Text(
                      "Couleur du nom d'utilisateur",
                      style: defaultFont,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              showDialog(
                                  context: context,
                                  builder: (BuildContext context) {
                                    return AlertDialog(
                                      backgroundColor: Provider.of<ThemeModel>(
                                              context,
                                              listen: false)
                                          .primaryColor,
                                      title: const Text('Choisir une couleur!'),
                                      content: SingleChildScrollView(
                                        child: ColorPicker(
                                          pickerColor: currentColor,
                                          onColorChanged: (Color color) {
                                            setState(() {
                                              currentColor = color;
                                            });
                                          },
                                          pickerAreaHeightPercent: 0.8,
                                        ),
                                      ),
                                      actions: <Widget>[
                                        DefaultButton(
                                          buttonText: 'Choisir',
                                          onPressed: () {
                                            setState(() =>
                                                pickerColor = currentColor);
                                            Navigator.of(context).pop();
                                          },
                                        ),
                                      ],
                                    );
                                  });
                            },
                            child: InputDecorator(
                              decoration: InputDecoration(
                                hintText: 'Choisir une couleur',
                                filled: true,
                                fillColor: currentColor,
                                enabledBorder: defaultTextInputStyle,
                                focusedBorder: defaultTextInputStyle,
                                contentPadding: const EdgeInsets.symmetric(
                                    vertical: 20.0, horizontal: 10.0),
                              ),
                              child: Container(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        DefaultButton(
                          onPressed: _selfColor != currentColor
                              ? () => updateUsernameColor(context)
                              : null,
                          icon: Icons.save,
                        ),
                      ],
                    ),
                  ],
                )
              ],
            );
          }
        }
      },
    );
  }
}
