class StatsUser {
  num countGame;
  num countGameWin;
  num averageDiff;
  num averageTimer;
  StatsUser(
      {required this.countGame,
      required this.countGameWin,
      required this.averageDiff,
      required this.averageTimer});

  factory StatsUser.fromJson(Map<String, dynamic> json) {
    return StatsUser(
      countGame: json['countGame'],
      countGameWin: json['countGameWin'],
      averageDiff: json['averageDiff'],
      averageTimer: json['averageTimer'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'countGame': countGame,
      'countGameWin': countGameWin,
      'averageDiff': averageDiff,
      'averageTimer': averageTimer,
    };
  }
}
