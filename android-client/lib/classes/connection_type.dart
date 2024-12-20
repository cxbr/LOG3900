class ConnectionType {
  final String value;

  const ConnectionType._(this.value);

  static const ConnectionType connection = ConnectionType._('Connexion');
  static const ConnectionType disconnection = ConnectionType._('Déconnexion');
  static const ConnectionType accountCreation = ConnectionType._('Inscription');
}
