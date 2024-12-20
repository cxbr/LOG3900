import 'package:android_client/classes/user.dart';
import 'package:android_client/components/avatar.dart';
import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/avatar_notifier_service.dart';
import 'package:android_client/services/input_filtering_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:email_validator/email_validator.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  SignupScreenState createState() => SignupScreenState();
}

class SignupScreenState extends State<SignupScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final UserService _userService = UserService();
  final bool _buttonClicked = false;

  late final AvatarNotifier _avatarNotifier;
  bool toggleAvatarError = false;

  bool _autoValidate = false;
  String _email = '';
  String _username = '';
  String _password = '';
  String _passwordConf = '';
  String _picUrl = '';

  @override
  void initState() {
    super.initState();
    _avatarNotifier = Provider.of<AvatarNotifier>(context, listen: false);
    _avatarNotifier.addListener(_setPicUrl);
  }

  @override
  void dispose() {
    _avatarNotifier.removeListener(_setPicUrl);
    super.dispose();
  }

  void _setPicUrl() {
    setState(() {
      _picUrl = _avatarNotifier.avatar;
    });
  }

  void _signUp() {
    setState(() {
      toggleAvatarError = _picUrl.isEmpty;
    });

    if (_formKey.currentState!.validate() && !_picUrl.isEmpty) {
      _userService.createNewUser(
        NewUser(
          username: _username,
          email: _email,
          password: _password,
          avatar: _picUrl,
        ),
        context,
      );
    } else {
      setState(() {
        _autoValidate = true;
      });
    }
  }

  String? _validateUsername(String? value) {
    if (value!.isEmpty) {
      return 'Entrée requise';
    }

    if (InputFilteringService.isMessageVulgar(value)) {
      return 'Nom d\'utilisateur trop vulgaire';
    }

    return null;
  }

  String? _validateEmail(String? value) {
    if (value!.isEmpty) {
      return 'Entrée requise';
    } else if (!EmailValidator.validate(value)) {
      return 'Adresse courriel invalide';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value!.isEmpty) {
      return 'Entrée requise';
    }
    return null;
  }

  String? _validatePasswordConf(String? value) {
    if (value!.isEmpty) {
      return 'Entrée requise';
    }
    return null;
  }

  String? _matchPassword(String? value) {
    if (value != _password) {
      return 'Les mots de passe ne correspondent pas';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          return SingleChildScrollView(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AlignedButton(
                    button: DefaultButton(
                      buttonText: "Déjà inscrit ?",
                      onPressed: () {
                        Navigator.pushNamed(context, "/connectionScreen");
                        Provider.of<AvatarNotifier>(context, listen: false)
                            .resetAvatarProvider();
                      },
                    ),
                    rowAlignment: MainAxisAlignment.end,
                  ),
                  const Text('Inscription', style: TextStyle(fontSize: 30)),
                  const SizedBox(
                    height: 40,
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: <Widget>[
                      const SizedBox(width: 200),
                      Avatar(
                        parentContext: context,
                        modify: true,
                        sendRightAway: false,
                        toggleError: toggleAvatarError,
                      ),
                      const SizedBox(width: 20),
                      SizedBox(
                        width: constraints.maxWidth * 0.5,
                        child: Form(
                          key: _formKey,
                          autovalidateMode: _autoValidate
                              ? AutovalidateMode.always
                              : AutovalidateMode.disabled,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              const Text(
                                "Adresse courriel",
                                style: defaultFont,
                              ),
                              Theme(
                                data: Theme.of(context).copyWith(
                                  primaryColor: const Color(0xFFFA959B),
                                  inputDecorationTheme: InputDecorationTheme(
                                    labelStyle: const TextStyle(
                                      color: Color(0xFFBDBDBD),
                                    ),
                                    focusedBorder: defaultTextInputStyle,
                                    enabledBorder: defaultTextInputStyle,
                                    errorBorder: errorTextInputStyle,
                                    focusedErrorBorder: errorTextInputStyle,
                                    filled: true,
                                    fillColor: Colors.white,
                                  ),
                                ),
                                child: ConstrainedBox(
                                  constraints:
                                      const BoxConstraints(maxWidth: 600),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: <Widget>[
                                      TextFormField(
                                        style: defaultFont.copyWith(
                                            color: Colors.black),
                                        keyboardType:
                                            TextInputType.emailAddress,
                                        onSaved: (value) => _email = value!,
                                        onChanged: (value) => _email = value,
                                        validator: _validateEmail,
                                        onFieldSubmitted: (value) => _signUp(),
                                        decoration: InputDecoration(
                                          errorText:
                                              _buttonClicked && _email.isEmpty
                                                  ? 'Entrée requise'
                                                  : null,
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      const Text(
                                        "Nom d'utilisateur",
                                        style: defaultFont,
                                      ),
                                      TextFormField(
                                        style: defaultFont.copyWith(
                                            color: Colors.black),
                                        onSaved: (value) => _username = value!,
                                        onChanged: (value) => _username = value,
                                        validator: _validateUsername,
                                        onFieldSubmitted: (value) => _signUp(),
                                        decoration: InputDecoration(
                                          errorText: _buttonClicked &&
                                                  _username.isEmpty
                                              ? 'Entrée requise'
                                              : null,
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      const Text(
                                        "Mot de passe",
                                        style: defaultFont,
                                      ),
                                      TextFormField(
                                        style: defaultFont.copyWith(
                                            color: Colors.black),
                                        obscureText: true,
                                        onSaved: (value) => _password = value!,
                                        onChanged: (value) => _password = value,
                                        validator: _validatePassword,
                                        onFieldSubmitted: (value) => _signUp(),
                                        decoration: InputDecoration(
                                          errorText: _buttonClicked &&
                                                  _password.isEmpty
                                              ? 'Entrée requise'
                                              : null,
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      const Text(
                                        "Confirmation de mot de passe",
                                        style: defaultFont,
                                      ),
                                      TextFormField(
                                        style: defaultFont.copyWith(
                                            color: Colors.black),
                                        obscureText: true,
                                        onSaved: (value) =>
                                            _passwordConf = value!,
                                        onChanged: (value) =>
                                            _passwordConf = value,
                                        validator: (value) {
                                          String? validationResponse =
                                              _validatePasswordConf(value);
                                          if (validationResponse != null) {
                                            return validationResponse;
                                          }
                                          return _matchPassword(value);
                                        },
                                        onFieldSubmitted: (value) => _signUp(),
                                        decoration: InputDecoration(
                                          errorText: _buttonClicked &&
                                                  _passwordConf.isEmpty
                                              ? 'Entrée requise'
                                              : null,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: EdgeInsets.all(40),
                    child: DefaultButton(
                        buttonText: "S'inscrire", onPressed: _signUp),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
