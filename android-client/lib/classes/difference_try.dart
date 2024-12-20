import 'package:android_client/classes/Vec2.dart';
import 'package:android_client/classes/user_game.dart';

class DifferenceTry {
  bool validated;
  Vec2 differencePos;
  String username;
  List<PlayerDifferences> playerDifferences;

  DifferenceTry(this.validated, this.differencePos, this.username,
      this.playerDifferences);

  factory DifferenceTry.fromJson(Map<String, dynamic> json) {
    return DifferenceTry(
      json['validated'],
      Vec2.fromJson(json['differencePos']),
      json['username'],
      (json['everyoneScore'] as List)
          .map((e) => PlayerDifferences.fromJson(e))
          .toList(),
    );
  }
}
