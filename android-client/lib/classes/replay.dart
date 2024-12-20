import 'package:android_client/classes/game_room.dart';

class Replay {
  String creator;
  String gameName;
  int timeCreated;
  List<ReplayEvent> events;
  List<GameStateSnapshot> snapshots;
  bool public;
  String id;
  String? gameId;
  String? creatorUsername;

  Replay({
    required this.creator,
    required this.gameName,
    required this.timeCreated,
    required this.events,
    required this.snapshots,
    required this.public,
    required this.id,
    this.gameId,
    this.creatorUsername,
  });

  factory Replay.fromJson(Map<String, dynamic> json) {
    return Replay(
      creator: json['creator'],
      gameName: json['gameName'],
      timeCreated: json['timeCreated'],
      events: List<ReplayEvent>.from(
          json['events'].map((dynamic event) => ReplayEvent.fromJson(event))),
      snapshots: List<GameStateSnapshot>.from(json['snapshots']
          .map((dynamic snapshot) => GameStateSnapshot.fromJson(snapshot))),
      public: json['public'],
      id: json['id'],
      gameId: json['gameId'] != null ? json['gameId'] : null,
      creatorUsername:
          json['creatorUsername'] != null ? json['creatorUsername'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'creator': creator,
      'gameName': gameName,
      'timeCreated': timeCreated,
      'events': events.map((event) => event.toJson()).toList(),
      'snapshots': snapshots.map((snapshot) => snapshot.toJson()).toList(),
      'public': public,
      'id': id,
      'gameId': gameId,
      'creatorUsername': creatorUsername,
    };
  }
}

class ReplayEvent {
  String action;
  String? imageData1;
  String? imageData2;
  int timestamp;
  String? username;
  String? cheatData;

  ReplayEvent({
    required this.action,
    required this.timestamp,
    this.imageData1,
    this.imageData2,
    this.username,
    this.cheatData,
  });

  factory ReplayEvent.fromJson(Map<String, dynamic> json) {
    return ReplayEvent(
      action: json['action'],
      timestamp: json['timestamp'],
      imageData1: json['imageData1'] != null ? json['imageData1'] : null,
      imageData2: json['imageData2'] != null ? json['imageData2'] : null,
      username: json['username'] != null ? json['username'] : null,
      cheatData: json['cheatData'] != null ? json['cheatData'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'action': action,
      'timestamp': timestamp,
      'imageData1': imageData1,
      'imageData2': imageData2,
      'username': username,
      'cheatData': cheatData,
    };
  }
}

class GameStateSnapshot {
  GameRoom gameRoom;
  String imageData1;
  String imageData2;

  GameStateSnapshot({
    required this.gameRoom,
    required this.imageData1,
    required this.imageData2,
  });

  factory GameStateSnapshot.fromJson(Map<String, dynamic> json) {
    return GameStateSnapshot(
      gameRoom: GameRoom.fromJson(json['gameRoom']),
      imageData1: json['imageData1'],
      imageData2: json['imageData2'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'gameRoom': gameRoom.toJson(),
      'imageData1': imageData1,
      'imageData2': imageData2,
    };
  }
}

class NewReplay {
  String creator;
  String gameName;
  List<ReplayEvent> events;
  List<GameStateSnapshot> snapshots;

  NewReplay({
    required this.creator,
    required this.gameName,
    required this.events,
    required this.snapshots,
  });

  Map<String, dynamic> toJson() {
    return {
      'creator': creator,
      'gameName': gameName,
      'events': events.map((event) => event.toJson()).toList(),
      'snapshots': snapshots.map((snapshot) => snapshot.toJson()).toList(),
    };
  }

  factory NewReplay.fromJson(Map<String, dynamic> json) {
    return NewReplay(
      creator: json['creator'],
      gameName: json['gameName'],
      events: List<ReplayEvent>.from(
          json['events'].map((dynamic event) => ReplayEvent.fromJson(event))),
      snapshots: List<GameStateSnapshot>.from(json['snapshots']
          .map((dynamic snapshot) => GameStateSnapshot.fromJson(snapshot))),
    );
  }
}

class Comment {
  String comment;
  String userId;
  int time;

  Comment({
    required this.comment,
    required this.userId,
    required this.time,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      comment: json['comment'],
      userId: json['userId'],
      time: json['time'],
    );
  }

  String get getTimestamp {
    DateTime dateTime = DateTime.fromMillisecondsSinceEpoch(time);
    DateTime today = DateTime.now();
    DateTime yesterday = DateTime.now().subtract(const Duration(days: 1));

    if (dateTime.year == yesterday.year &&
        dateTime.month == yesterday.month &&
        dateTime.day == yesterday.day) {
      return 'Hier '
          '${dateTime.hour.toString().padLeft(2, '0')}:'
          '${dateTime.minute.toString().padLeft(2, '0')}:'
          '${dateTime.second.toString().padLeft(2, '0')}';
    }

    if (dateTime.year == today.year &&
        dateTime.month == today.month &&
        dateTime.day == today.day) {
      return 'Aujourd\'hui '
          '${dateTime.hour.toString().padLeft(2, '0')}:'
          '${dateTime.minute.toString().padLeft(2, '0')}:'
          '${dateTime.second.toString().padLeft(2, '0')}';
    }

    String formattedTime = '${dateTime.year.toString().padLeft(4, '0')}/'
        '${dateTime.month.toString().padLeft(2, '0')}/'
        '${dateTime.day.toString().padLeft(2, '0')} '
        '${dateTime.hour.toString().padLeft(2, '0')}:'
        '${dateTime.minute.toString().padLeft(2, '0')}:'
        '${dateTime.second.toString().padLeft(2, '0')}';
    return formattedTime;
  }

  Map<String, dynamic> toJson() {
    return {
      'comment': comment,
      'userId': userId,
      'time': time,
    };
  }
}
