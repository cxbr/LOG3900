import 'package:android_client/classes/user.dart';
import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';

class ConnectionScreen extends StatefulWidget {
  const ConnectionScreen({super.key});

  @override
  ConnectionScreenState createState() => ConnectionScreenState();
}

class ConnectionScreenState extends State<ConnectionScreen> {
  late final GlobalKey<NavigatorState> navigatorKey;
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final UserService _userService = UserService();
  final bool _buttonClicked = false;

  @override
  void initState() {
    super.initState();
    getLastUser();
  }

  void getLastUser() async {
    _userService.getToken().then((value) => {
          if (value.isNotEmpty) {_usernameController.text = value}
        });
  }

  void _connect() {
    if (_formKey.currentState!.validate()) {
      _userService.loginAfterSocket(
        LoginUser(
          username: _usernameController.text,
          password: _passwordController.text,
        ),
        context,
      );
    }
  }

  String? _validateUsername(String? value) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          return SingleChildScrollView(
              child: Container(
            height: MediaQuery.of(context).size.height,
            width: MediaQuery.of(context).size.width,
            child: Stack(children: [
              AlignedButton(
                button: DefaultButton(
                  buttonText: "Pas de compte ?",
                  onPressed: () =>
                      Navigator.pushNamed(context, "/signupScreen"),
                ),
                rowAlignment: MainAxisAlignment.end,
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Image.asset(
                    'assets/images/logo.png',
                    fit: BoxFit.contain,
                    width: 300,
                    height: constraints.maxHeight * 0.30,
                  ),
                  const Text('Connexion', style: TextStyle(fontSize: 30)),
                  const SizedBox(
                    height: 20,
                  ),
                  Column(
                    mainAxisSize:
                        MainAxisSize.min, // Use min to fit content size
                    mainAxisAlignment: MainAxisAlignment
                        .center, // Center the column content vertically
                    children: <Widget>[
                      Container(
                        padding: EdgeInsets.symmetric(
                            horizontal: constraints.maxWidth * 0.1),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: <Widget>[
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  const Text(
                                    "Nom d'utilisateur",
                                    style: defaultFont,
                                  ),
                                  Theme(
                                    data: Theme.of(context).copyWith(
                                      primaryColor: const Color(0xFFFA959B),
                                      inputDecorationTheme:
                                          InputDecorationTheme(
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
                                      child: TextFormField(
                                        controller: _usernameController,
                                        style: const TextStyle(
                                            fontSize: 20, color: Colors.black),
                                        decoration: InputDecoration(
                                          errorText: _buttonClicked &&
                                                  _usernameController
                                                      .text.isEmpty
                                              ? 'Entrée requise'
                                              : null,
                                        ),
                                        validator: _validateUsername,
                                        onFieldSubmitted: (value) => _connect(),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  const Text(
                                    "Mot de passe",
                                    style: defaultFont,
                                  ),
                                  Theme(
                                    data: Theme.of(context).copyWith(
                                      primaryColor: const Color(0xFFFA959B),
                                      inputDecorationTheme:
                                          InputDecorationTheme(
                                        labelStyle: const TextStyle(
                                          color: Color(0xFFBDBDBD),
                                        ),
                                        focusedBorder: defaultTextInputStyle,
                                        enabledBorder: defaultTextInputStyle,
                                        filled: true,
                                        fillColor: Colors.white,
                                        errorBorder: errorTextInputStyle,
                                        focusedErrorBorder: errorTextInputStyle,
                                      ),
                                    ),
                                    child: ConstrainedBox(
                                      constraints:
                                          const BoxConstraints(maxWidth: 600),
                                      child: TextFormField(
                                        controller: _passwordController,
                                        obscureText: true,
                                        style: const TextStyle(
                                            fontSize: 20, color: Colors.black),
                                        decoration: InputDecoration(
                                          errorText: _buttonClicked &&
                                                  _passwordController
                                                      .text.isEmpty
                                              ? 'Entrée requise'
                                              : null,
                                        ),
                                        validator: _validatePassword,
                                        onFieldSubmitted: (value) => _connect(),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 30),
                              Center(
                                // Use Center for buttons to ensure they're centered
                                child: SizedBox(
                                  width: 260,
                                  child: DefaultButton(
                                    buttonText: 'Se connecter',
                                    onPressed: _connect,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Center(
                                child: DefaultButton(
                                  buttonText: 'Mot de passe oublié ?',
                                  onPressed: () => Navigator.pushNamed(
                                      context, "/passwordRecuperationScreen"),
                                ),
                              ),
                              const SizedBox(height: 30),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ]),
          ));
        },
      ),
    );
  }
}
