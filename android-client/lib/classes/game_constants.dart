class GameConstants {
  int gameDuration;
  int penaltyTime;
  int bonusTime;
  bool cheatMode;

  GameConstants({required this.gameDuration, required this.penaltyTime, required this.bonusTime, required this.cheatMode});

  factory GameConstants.fromJson(Map<String, dynamic> json) {
    return GameConstants(
      gameDuration: json['gameDuration'] as int,
      penaltyTime: json['penaltyTime'] as int,
      bonusTime: json['bonusTime'] as int,
      cheatMode: json['cheatMode'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'gameDuration': gameDuration,
      'penaltyTime': penaltyTime,
      'bonusTime': bonusTime,
      'cheatMode': cheatMode,
    };
  }
}
