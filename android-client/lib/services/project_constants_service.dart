// ignore: avoid_classes_with_only_static_members
class ProjectConstantsService {
  // This class is used to retrieve constants used in the app

  static const String _localServerAddress = "$_localServerBaseAddress/api";
  static const String _remoteServerAddress = "$_remoteServerBaseAddress/api";
  static const String _localServerBaseAddress = "http://192.168.0.163:3000";
  static const String _remoteServerBaseAddress =
      "http://ec2-35-183-113-250.ca-central-1.compute.amazonaws.com:3000";
  static const bool _useLocalServer = false;

  static String get serverAddress =>
      _useLocalServer ? _localServerAddress : _remoteServerAddress;

  static String get serverBaseAddress =>
      _useLocalServer ? _localServerBaseAddress : _remoteServerBaseAddress;
}
