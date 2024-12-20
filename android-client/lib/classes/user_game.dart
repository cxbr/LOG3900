import 'dart:convert';

class UserGame {
  List<CurrentPlayer> currentPlayers;
  String? gameName;
  int nbDifferenceFound;
  int chosenDifference;
  int timer;
  String creator;
  List<Observer>? observers;
  List<PlayerDifferences> differenceFoundByPlayers;
  List<CurrentPlayer>? abandonedPlayers;
  List<CurrentPlayer>? potentialPlayers;
  UserGame({
    required this.currentPlayers,
    required this.gameName,
    required this.nbDifferenceFound,
    required this.chosenDifference,
    required this.creator,
    required this.differenceFoundByPlayers,
    required this.timer,
    this.potentialPlayers,
    this.abandonedPlayers,
    this.observers,
  });

  factory UserGame.fromJson(Map<String, dynamic> json) {
    return UserGame(
      currentPlayers: json['currentPlayers']
          .map<CurrentPlayer>((player) => CurrentPlayer.fromJson(player))
          .toList(),
      gameName: json['gameName'],
      nbDifferenceFound: json['nbDifferenceFound'],
      chosenDifference: json['chosenDifference'],
      creator: json['creator'],
      differenceFoundByPlayers: json['differenceFoundByPlayers']
          .map<PlayerDifferences>(
              (player) => PlayerDifferences.fromJson(player))
          .toList(),
      timer: json['timer'],
      potentialPlayers: json['potentialPlayers'] != null
          ? json['potentialPlayers']
              .map<CurrentPlayer>((player) => CurrentPlayer.fromJson(player))
              .toList()
          : null,
      abandonedPlayers: json['abandonedPlayers'] != null
          ? json['currentPlayers']
              .map<CurrentPlayer>((player) => CurrentPlayer.fromJson(player))
              .toList()
          : null,
      observers: json['observers'] != null
          ? json['observers']
              .map<Observer>((player) => Observer.fromJson(player))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'currentPlayers': currentPlayers
          .map((CurrentPlayer player) => player.toJson())
          .toList(),
      'gameName': gameName,
      'nbDifferenceFound': nbDifferenceFound,
      'chosenDifference': chosenDifference,
      'timer': timer,
      'potentialPlayers': potentialPlayers
          ?.map((CurrentPlayer player) => player.toJson())
          .toList(),
      'creator': creator,
      'observers':
          observers?.map((Observer player) => player.toJson()).toList(),
      'differenceFoundByPlayers': differenceFoundByPlayers
          .map((PlayerDifferences player) => player.toJson())
          .toList(),
      'abandonedPlayers': abandonedPlayers
          ?.map((CurrentPlayer player) => player.toJson())
          .toList(),
    };
  }

  String toJsonString() {
    return jsonEncode(toJson());
  }

  static UserGame fromJsonString(String jsonString) {
    Map<String, dynamic> jsonMap = jsonDecode(jsonString);
    return UserGame.fromJson(jsonMap);
  }
}

class PlayerDifferences {
  String username;
  int differencesFound;

  PlayerDifferences({
    required this.username,
    required this.differencesFound,
  });

  factory PlayerDifferences.fromJson(Map<String, dynamic> json) {
    return PlayerDifferences(
      username: json['username'],
      differencesFound: json['differencesFound'],
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'username': username,
      'differencesFound': differencesFound,
    };
  }

  String toJsonString() {
    return jsonEncode(toJson());
  }

  static PlayerDifferences fromJsonString(String jsonString) {
    Map<String, dynamic> jsonMap = jsonDecode(jsonString);
    return PlayerDifferences.fromJson(jsonMap);
  }

  @override
  String toString() {
    return 'PlayerDifferences(username: $username, differencesFound: $differencesFound)';
  }
}

class Observer {
  String username;
  String color;
  bool isAndroid;

  Observer({
    required this.username,
    required this.color,
    required this.isAndroid,
  });

  factory Observer.fromJson(Map<String, dynamic> json) {
    return Observer(
      username: json['username'],
      color: json['color'],
      isAndroid: json['isAndroid'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'color': color,
      'isAndroid': isAndroid,
    };
  }

  String toJsonString() {
    return jsonEncode(toJson());
  }

  static Observer fromJsonString(String jsonString) {
    Map<String, dynamic> jsonMap = jsonDecode(jsonString);
    return Observer.fromJson(jsonMap);
  }
}

class CurrentPlayer {
  String username;
  bool isAndroid;

  CurrentPlayer({
    required this.username,
    required this.isAndroid,
  });

  factory CurrentPlayer.fromJson(Map<String, dynamic> json) {
    return CurrentPlayer(
      username: json['username'],
      isAndroid: json['isAndroid'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'isAndroid': isAndroid,
    };
  }

  String toJsonString() {
    return jsonEncode(toJson());
  }

  static CurrentPlayer fromJsonString(String jsonString) {
    Map<String, dynamic> jsonMap = jsonDecode(jsonString);
    return CurrentPlayer.fromJson(jsonMap);
  }
}
