import 'dart:convert';

import 'package:android_client/classes/game_constants.dart';
import 'package:android_client/classes/user_game.dart';

class GameRoom {
  UserGame userGame;
  String roomId;
  bool started;
  String gameMode;
  GameConstants? gameConstants;

  GameRoom({
    required this.userGame,
    required this.roomId,
    required this.started,
    required this.gameMode,
    this.gameConstants,
  });

  factory GameRoom.fromJson(Map<String, dynamic> json) {
    return GameRoom(
      userGame: UserGame.fromJson(json['userGame']),
      roomId: json['roomId'],
      started: json['started'],
      gameMode: json['gameMode'],
      gameConstants: json['gameConstants'] != null
          ? GameConstants.fromJson(json['gameConstants'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userGame': userGame.toJson(),
      'roomId': roomId,
      'started': started,
      'gameMode': gameMode,
      'gameConstants': gameConstants?.toJson(),
    };
  }

  String toJsonString() {
    return jsonEncode(toJson());
  }

  static GameRoom fromJsonString(String jsonString) {
    Map<String, dynamic> jsonMap = jsonDecode(jsonString);
    return GameRoom.fromJson(jsonMap);
  }
}
