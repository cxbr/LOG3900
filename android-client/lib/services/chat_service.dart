import 'package:android_client/classes/channel.dart';
import 'package:android_client/classes/message_data.dart';
import 'package:android_client/classes/user.dart';
import 'package:android_client/screens/chat_dialog.dart';
import 'package:android_client/services/socket_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:audioplayers/audioplayers.dart';

class ChatService {
  final SocketService _socketService;

  ChannelData? _selectedChannel;

  ChannelData? get selectedChannel => _selectedChannel;

  set selectedChannel(ChannelData? channel) {
    _selectedChannel = channel;
    currentChannelId = channel?.channelId;

    if (currentChannelId != null) {
      setNumberOfUnreadMessagesInChannel(currentChannelId!, 0);
    }
  }

  ChatService(SocketService socketService) : _socketService = socketService;

  static Map<String, int> channelUnreadMessages = {};
  static List<String> subscribedChannels = [];
  static String? currentChannelId = null;
  static ChatDialogState? _currentChatDialogState;

  static ChatDialogState? get currentChatDialogState => _currentChatDialogState;

  static set currentChatDialogState(ChatDialogState? state) {
    _currentChatDialogState = state;
    _currentChatDialogState
        ?.onReceiveMessageNotification(channelUnreadMessages);
  }

  static ChatService? _instance;

  static void handleMessageNotification() {
    // Based on this from the server :
    // sendNewMessageNotification(roomId: string, message: Message): void {
    //    this.server.emit(ChatEvents.NotifyMessageSentInChannel, { roomId, message });
    // }

    void handler(dynamic message) {
      // Do something with the message
      String roomID = message["roomId"];
      ChatMessageData messageData =
          ChatMessageData.fromJson(message["message"]);

      if (!subscribedChannels.contains(roomID)) {
        print(
            "SERVICE Received message notification from channel we are not subscribed to (roomID: $roomID) (subscribedChannels: $subscribedChannels)");
        return; // Ignore messages from channels we are not subscribed to
      }

      print(
          "SERVICE Received message notification: $message (subscribedChannels: $subscribedChannels)");

      // If the message wasnt sent by us, play a sound
      if (messageData.username != UserService.loggedInUser?.username) {
        AudioPlayer().play(AssetSource('audio/message.wav'));
      }

      if (_instance != null) {
        _instance!.requestSubscribedChannels();
      }

      // if (currentChannelId == roomID) {
      //   channelUnreadMessages[roomID] = 0;
      //   return; // Messages from the current channel are not counted as unread
      // }

      // if (channelUnreadMessages.containsKey(roomID)) {
      //   channelUnreadMessages[roomID] = channelUnreadMessages[roomID]! + 1;
      // } else {
      //   channelUnreadMessages[roomID] = 1;
      // }
    }

    SocketService staticSocketService = SocketService();

    staticSocketService.connect();
    staticSocketService.on("notifyMessageSentInChannel", handler);

    _instance = ChatService(staticSocketService);
  }

  static void handleRefreshListOfSubscribedChannels() {
    var service = _instance!;

    service.registerSubscribedChannelsHandler(
        ChatService.refreshSubscribedChannels);

    service.requestSubscribedChannels();
  }

  static void refreshSubscribedChannels(List<ChannelData> channels) {
    print("SERVICE Received subscribed channels: $channels");
    subscribedChannels = channels.map((e) => e.channelId).toList();

    // Completely reset the number of unread messages for each channel
    channelUnreadMessages = <String, int>{}; // Clear the map

    // For each subscribed channel, extract the number of unread messages
    for (var channel in channels) {
      channelUnreadMessages[channel.channelId] = channel.numberOfUnreadMessages;
    }

    // Remove the number of unread messages for channels we are no longer subscribed to
    channelUnreadMessages.removeWhere((key, value) {
      return !subscribedChannels.contains(key);
    });

    if (currentChatDialogState != null) {
      currentChatDialogState!
          .onReceiveMessageNotification(channelUnreadMessages);
    }
  }

  static void setNumberOfUnreadMessagesInChannel(String channelID, int value) {
    channelUnreadMessages[channelID] = value;
  }

  static void resetSubscribedChannelsAndUnreadMessages() {
    _instance = ChatService(SocketService());
    subscribedChannels = [];
    channelUnreadMessages = {};
    currentChannelId = null;
    _currentChatDialogState = null;
  }

  void sendMessage(String messageContent, String author, {String roomID = ""}) {
    ChatMessageData messageToSend =
        ChatMessageData(messageContent, author, roomID, 0, true);
    _socketService.send<ChatMessageData>("requestSendMessage", messageToSend);
  }

  // Set the function to be called when a message is received.
  // The argument of the function is the ChatMessageData received.
  void registerMessageHandler(Function action) {
    handler(dynamic message) {
      ChatMessageData convertedMessageData = ChatMessageData.fromJson(message);
      action(convertedMessageData);
    }

    _socketService.on<ChatMessageData>("messageSent", handler);
  }

  void requestAvailableChannels() {
    _socketService.send("requestListOfChannels");
  }

  void requestSubscribedChannels() {
    print("requesting subscribed channels");

    _socketService.send("requestUserSubscribedChannels", getUserNickname());
  }

  void requestToEnterChannel(String channelID) {
    _socketService.send("requestJoinChannel", {
      "channelId": channelID,
      "username": getUserNickname(),
    });
  }

  void requestToExitChannel(String channelID) {
    print("requesting to exit channel $channelID");

    _socketService.send("requestExitChannel", {
      "username": getUserNickname(),
      "channelId": channelID,
    });
  }

  void subscribeToChannel(String channelID) {
    _socketService.send("requestChannelSubscription", {
      "channelId": channelID,
      "username": getUserNickname(),
    });
  }

  void unsubscribeFromChannel(String channelID) {
    _socketService.send("requestChannelUnsubscription", {
      "channelId": channelID,
      "username": getUserNickname(),
    });
  }

  void requestChannelCreation(String channelName) {
    _socketService.send("requestChannelCreation", channelName);
  }

  void requestChannelDeletion(String channelId) {
    _socketService.send("requestChannelDeletion", channelId);
  }

  void registerAvailableChannelsHandler(Function action) {
    handler(dynamic message) {
      List<ChannelData> convertedChannelData = [];
      for (var channel in message) {
        convertedChannelData.add(ChannelData.fromJson(channel));
      }

      action(convertedChannelData);
    }

    _socketService.on("listOfChannelsSent", handler);
  }

  void registerSubscribedChannelsHandler(Function action) {
    handler(dynamic message) {
      List<ChannelData> convertedChannelData = <ChannelData>[];
      for (var channel in message) {
        convertedChannelData.add(ChannelData.fromJson(channel));
      }

      action(convertedChannelData);
    }

    _socketService.on("userSubscribedChannelsSent", handler);
  }

  void registerListOfUsersInSpecificChannelHandler(Function action) {
    handler(dynamic message) {
      // received message is in this format : { roomId, subscribedUsers }

      String roomID = message["roomId"];

      print("BEFORE Received users in channel $roomID");

      List<User> subscribedUsers = [];

      for (dynamic user in message["subscribedUsers"]) {
        User userObj = User.fromJsonWithOptionalFields(user);
        subscribedUsers.add(userObj);
      }

      print(
          "AFTER Received users in channel: $subscribedUsers (channel id: $roomID)");

      action(roomID, subscribedUsers);
    }

    _socketService.on("listOfUsersInSpecificChannelSent", handler);
  }

  void unbindMessageHandler() {
    _socketService.off("messageSent");
  }

  void unbindChannelHandler() {
    _socketService.off("listOfChannelsSent");
  }

  void unbindSubscribedChannelsHandler() {
    _socketService.off("userSubscribedChannelsSent");

    handleRefreshListOfSubscribedChannels();
  }

  void unbindListOfUsersInSpecificChannelHandler() {
    _socketService.off("listOfUsersInSpecificChannelSent");
  }

  getUserNickname() {
    return UserService.loggedInUser?.username ?? "anon";
  }
}
