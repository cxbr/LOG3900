class GameHistory {
  String name;
  int startTime;
  int timer;
  List<String> players;
  String gameMode;
  List<String>? abandoned;
  List<String>? deletedByUsers;
  String? winner;
  String id;

  GameHistory({
    required this.name,
    required this.startTime,
    required this.timer,
    required this.players,
    required this.gameMode,
    this.deletedByUsers,
    required this.id,
    this.abandoned,
    required this.winner,
  });

  factory GameHistory.fromJson(Map<String, dynamic> json) {
    return GameHistory(
      name: json['name'],
      startTime: json['startTime'],
      timer: json['timer'],
      players: List<String>.from(json['players']),
      id: json['_id'],
      gameMode: json['gameMode'],
      abandoned: json['abandoned'] != null
          ? List<String>.from(json['abandoned'])
          : null,
      deletedByUsers: json['deletedByUsers'] != null
          ? List<String>.from(json['deletedByUsers'])
          : null,
      winner: json['winner'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'startTime': startTime,
      'timer': timer,
      'players': players,
      'deletedByUsers': deletedByUsers,
      '_id': id,
      'gameMode': gameMode,
      'abandoned': abandoned,
      'winner': winner,
    };
  }

  @override
  String toString() {
    return '''
      Name: $name
      Start Time: $startTime
      Timer: $timer
      Players: $players
      deletedByUsers: $deletedByUsers
      id: $id
      Game Mode: $gameMode
      Abandoned: $abandoned
      Winner: $winner
    ''';
  }
}
