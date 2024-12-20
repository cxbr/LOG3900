class ChatMessageData {
  String message;
  String username;
  String roomId;
  int time;
  bool isAndroid;

  ChatMessageData(
      this.message, this.username, this.roomId, this.time, this.isAndroid);

  factory ChatMessageData.fromJson(Map<String, dynamic> json) {
    return ChatMessageData(json['message'], json['username'],
        json['roomId'] ?? "", json['time'] ?? 0, json['isAndroid'] ?? 0);
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

  Map<String, dynamic> toJson() => {
        'message': message,
        'username': username,
        'roomId': roomId,
        'time': time,
        'isAndroid': isAndroid,
      };
}
