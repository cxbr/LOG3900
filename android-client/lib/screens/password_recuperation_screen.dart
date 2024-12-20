import 'package:android_client/classes/user.dart';
import 'package:android_client/components/alert_dialog.dart';
import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/future_alert_dialog.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/user_service.dart';
import 'package:email_validator/email_validator.dart';
import 'package:flutter/material.dart';

class PasswordRecuperationScreen extends StatefulWidget {
  const PasswordRecuperationScreen({super.key});

  @override
  _PasswordRecuperationScreenState createState() =>
      _PasswordRecuperationScreenState();
}

class _PasswordRecuperationScreenState
    extends State<PasswordRecuperationScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final UserService _userService = UserService();

  bool _autoValidate = false;
  String _email = '';
  String _validationCode = '';
  String _password = '';
  String _passwordConf = '';

  final ResetPasswordUser _resetPasswordUser =
      ResetPasswordUser(userId: '', username: '');
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _codeController = TextEditingController();

  bool _emailValidated = false;
  bool _codeValidated = false;

  String? _validateEmail(String? value) {
    if (value!.isEmpty) {
      return 'Entrée requise';
    } else if (!EmailValidator.validate(value)) {
      return 'Adresse courriel invalide';
    }
    return null;
  }

  String? _validateCode(String? value) {
    if (value!.isEmpty) {
      return 'Entrée requise';
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

  Widget _buildButton(BuildContext context) {
    if (!_emailValidated && !_codeValidated) {
      return Column(
        children: [
          DefaultButton(
              buttonText: "Envoyer", onPressed: () => verifyEmail(context)),
        ],
      );
    } else if (_emailValidated && !_codeValidated) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          DefaultButton(
              buttonText: "Renvoyer un email",
              onPressed: () => resendEmail(context)),
          const SizedBox(width: 10),
          DefaultButton(
              buttonText: "Valider", onPressed: () => verifyCode(context)),
        ],
      );
    } else {
      return Column(
        children: [
          DefaultButton(
              buttonText: "Confirmer",
              onPressed: () => updatePassword(context)),
        ],
      );
    }
  }

  void verifyEmail(BuildContext context) {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      _userService.getUserByEmail(_email).then((response) {
        _resetPasswordUser.username = response.username;
        _resetPasswordUser.userId = response.userId;
        sendPasswordRecuperationEmail(context);
      }).catchError((error) {
        openAlertDialog(error.toString(), context);
      });
    }
  }

  void resendEmail(BuildContext context) {
    sendPasswordRecuperationEmail(context);
  }

  void sendPasswordRecuperationEmail(BuildContext context) {
    _userService.sendPasswordRecuperationEmail(_email).then((_) async {
      try {
        await futureAlertDialog('Un email vous a été envoyé', context);
        setState(() {
          _emailValidated = true;
          _codeController.clear();
        });
      } catch (error) {
        await futureAlertDialog(error.toString(), context);
        Navigator.pushNamed(context, "/connectionScreen");
      }
    });
  }

  void verifyCode(BuildContext context) {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      _userService.verifyCode(_validationCode).then((_) {
        _codeController.clear();
        setState(() {
          _codeValidated = true;
        });
      }).catchError((error) {
        openAlertDialog(error.toString(), context);
      });
    }
  }

  void updatePassword(BuildContext context) async {
    if (_formKey.currentState!.validate() && _password == _passwordConf) {
      _formKey.currentState!.save();
      try {
        await _userService.updatePassword(_resetPasswordUser, _password);
        await futureAlertDialog('Mot de passe modifié', context);
        Navigator.pushNamed(context, "/connectionScreen");
      } catch (error) {
        openAlertDialog(error.toString(), context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: SingleChildScrollView(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          AlignedButton(
              button: DefaultButton(
                  buttonText: "Connexion",
                  onPressed: () =>
                      {Navigator.pushNamed(context, "/connectionScreen")}),
              rowAlignment: MainAxisAlignment.start),
          Column(
            children: [
              Image.asset(
                'assets/images/logo.png',
                fit: BoxFit.contain,
                width: 200,
                height: 300,
              ),
              const Text('Récupération du mot de passe',
                  style: TextStyle(fontSize: 30)),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 500),
            child: Form(
              key: _formKey,
              autovalidateMode: _autoValidate
                  ? AutovalidateMode.always
                  : AutovalidateMode.disabled,
              child: Theme(
                  data: Theme.of(context).copyWith(
                    primaryColor: const Color(0xFFFA959B),
                    inputDecorationTheme: InputDecorationTheme(
                      labelStyle: const TextStyle(
                        color: Color(0xFFBDBDBD),
                      ),
                      focusedBorder: defaultTextInputStyle,
                      enabledBorder: defaultTextInputStyle,
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                  child: Column(
                    children: <Widget>[
                      if (!_emailValidated && !_codeValidated)
                        TextFormField(
                          controller: _emailController,
                          style: defaultFont.copyWith(color: Colors.black),
                          decoration: const InputDecoration(
                            hintText: 'Adresse courriel',
                          ),
                          keyboardType: TextInputType.emailAddress,
                          onSaved: (value) => _email = value!,
                          onChanged: (value) => _email = value,
                          validator: _validateEmail,
                          onFieldSubmitted: (value) => verifyEmail(context),
                        ),
                      if (_emailValidated && !_codeValidated)
                        TextFormField(
                          controller: _codeController,
                          style: defaultFont.copyWith(color: Colors.black),
                          decoration: const InputDecoration(
                            hintText: 'Code de validation',
                          ),
                          onSaved: (value) => _validationCode = value!,
                          onChanged: (value) => _validationCode = value,
                          validator: _validateCode,
                          onFieldSubmitted: (value) => verifyCode(context),
                        ),
                      if (_emailValidated && _codeValidated)
                        TextFormField(
                          style: defaultFont.copyWith(color: Colors.black),
                          decoration: const InputDecoration(
                            hintText: 'Nouveau mot de passe',
                          ),
                          obscureText: true,
                          onSaved: (value) => _password = value!,
                          onChanged: (value) => _password = value,
                          validator: _validatePassword,
                          onFieldSubmitted: (value) => updatePassword(context),
                        ),
                      if (_emailValidated && _codeValidated)
                        TextFormField(
                          style: defaultFont.copyWith(color: Colors.black),
                          decoration: const InputDecoration(
                            hintText: 'Confirmation de mot de passe',
                          ),
                          obscureText: true,
                          onSaved: (value) => _passwordConf = value!,
                          onChanged: (value) => _passwordConf = value,
                          validator: (value) {
                            String? validationResponse =
                                _validatePasswordConf(value);
                            if (validationResponse != null) {
                              return validationResponse;
                            }
                            return _matchPassword(value);
                          },
                          onFieldSubmitted: (value) => updatePassword(context),
                        ),
                    ],
                  )),
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: Container(
              width: MediaQuery.of(context).size.width / 2,
              child: _buildButton(context),
            ),
          ),
        ],
      ),
    ));
  }
}
