class ChannelData {
  String channelId;
  String displayName;
  int numberOfUnreadMessages = 0;
  bool isPrivate = false;

  ChannelData(this.channelId, this.displayName, this.numberOfUnreadMessages,
      this.isPrivate);

  factory ChannelData.fromJson(Map<String, dynamic> json) {
    return ChannelData(json['channelId'], json['displayName'],
        json['numberOfUnreadMessages'] ?? 0, json['isPrivate'] ?? false);
  }

  @override
  String toString() {
    return '(Id: $channelId, Name: $displayName, Unread: $numberOfUnreadMessages, Private: $isPrivate)';
  }

  Map<String, dynamic> toJson() => {
        'channelId': channelId,
        'displayName': displayName,
        'numberOfUnreadMessages': numberOfUnreadMessages,
        'isPrivate': isPrivate
      };
}
