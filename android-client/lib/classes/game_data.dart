import 'package:android_client/classes/best_time.dart';
import 'package:android_client/classes/differences_hashmap.dart';

class GameData {
  String name;
  String creator;
  bool wantShoutout;
  int nbDifference;
  String image1url;
  String image2url;
  String difficulty;
  List<BestTime> soloBestTimes;
  List<BestTime> vsBestTimes;
  List<List<int>>? differenceMatrix;
  List<DifferencesHashMap>? differenceHashMap;

  GameData({
    required this.name,
    required this.creator,
    required this.wantShoutout,
    required this.nbDifference,
    required this.image1url,
    required this.image2url,
    required this.difficulty,
    required this.soloBestTimes,
    required this.vsBestTimes,
    this.differenceMatrix,
    this.differenceHashMap,
  });

  // Factory constructor to create GameData instance from JSON
  factory GameData.fromJson(Map<String, dynamic> json) {
    return GameData(
      name: json['name'],
      creator: json['creator'],
      wantShoutout: json['wantShoutout'],
      nbDifference: json['nbDifference'],
      image1url: json['image1url'],
      image2url: json['image2url'],
      difficulty: json['difficulty'],
      soloBestTimes:
          // TODO: Check why this give error
          List<BestTime>.from(json['soloBestTimes']
              .map((dynamic time) => BestTime.fromJson(time))),
      vsBestTimes: List<BestTime>.from(
          json['vsBestTimes'].map((dynamic time) => BestTime.fromJson(time))),
      differenceMatrix: json['differenceMatrix'] != null
          ? List<List<int>>.from(json['differenceMatrix']
              .map((dynamic row) => List<int>.from(row)))
          : null,
      differenceHashMap: json['differenceHashMap'] != null
          ? List<DifferencesHashMap>.from(json['differenceHashMap']
              .map((dynamic row) => DifferencesHashMap.fromJson(row)))
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'creator': creator,
      'wantShoutout': wantShoutout,
      'nbDifference': nbDifference,
      'image1url': image1url,
      'image2url': image2url,
      'difficulty': difficulty,
      'soloBestTimes': soloBestTimes,
      'vsBestTimes': vsBestTimes,
      'differenceMatrix': differenceMatrix,
      'differenceHashMap': differenceHashMap,
    };
  }

  @override
  String toString() {
    return '''
      Name: $name
      Creator: $creator
      Want Shoutout: $wantShoutout
      Number of Differences: $nbDifference
      Image 1 URL: $image1url
      Image 2 URL: $image2url
      Difficulty: $difficulty
      Solo Best Times: $soloBestTimes
      VS Best Times: $vsBestTimes
    ''';
  }
}
