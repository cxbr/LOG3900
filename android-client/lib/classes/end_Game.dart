class EndGame {
  String winner;
  String roomId;
  List<String> players;
  bool gameFinished;
  List<String> abandoned;
  String gameMode;
  String gameName;
  int gameDuration;
  List<String> tiedPlayers;

  EndGame(
      {required this.winner,
      required this.roomId,
      required this.players,
      required this.gameFinished,
      required this.abandoned,
      required this.gameMode,
      required this.gameName,
      required this.gameDuration,
      required this.tiedPlayers});

  Map<String, dynamic> toJson() {
    return {
      'winner': winner,
      'roomId': roomId,
      'players': players,
      'gameFinished': gameFinished,
      'abandoned': abandoned,
      'gameMode': gameMode,
      'gameName': gameName,
      'gameDuration': gameDuration,
      'tiedPlayers': tiedPlayers,
    };
  }

  factory EndGame.fromJson(Map<String, dynamic> json) {
    if (json['players'] is List) {
      // Filter out any empty maps from the players list
      json['players'] = json['players']
          .where((player) => player is Map && player.isNotEmpty)
          .toList();
    }
    if (json['abandoned'] is List) {
      // Filter out any empty maps from the players list
      json['abandoned'] = json['abandoned']
          .where((player) => player is Map && player.isNotEmpty)
          .toList();
    }
    return EndGame(
      winner: json['winner'] as String,
      roomId: json['roomId'] as String,
      players: List<String>.from(json['players']),
      gameFinished: json['gameFinished'] as bool,
      abandoned: List<String>.from(json['abandoned']),
      gameMode: json['gameMode'] as String,
      gameName: json['gameName'] as String,
      gameDuration: json['gameDuration'] as int,
      tiedPlayers: json['tiedPlayers'] != null
          ? List<String>.from(json['tiedPlayers'])
          : [],
    );
  }
}
