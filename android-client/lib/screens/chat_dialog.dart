import 'package:android_client/classes/channel.dart';
import 'package:android_client/classes/user.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/chat_box.dart';
import 'package:android_client/components/text_input.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/chat_service.dart';
import 'package:android_client/services/input_filtering_service.dart';
import 'package:android_client/services/socket_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

Future<void> openChatDialog(BuildContext context) {
  return showDialog(
    context: context,
    builder: (BuildContext context) {
      return const ChatDialog();
    },
  );
}

class ChatDialog extends StatefulWidget {
  const ChatDialog({super.key});

  @override
  State<StatefulWidget> createState() => ChatDialogState();
}

enum ChatView { allChannelsView, chat, subscribedChannels, currentChannelInfo }

class ChatDialogState extends State<ChatDialog> {
  SocketService socketService = SocketService();
  late ChatService _chatService;

  final _channelCreationController = TextEditingController();

  ChatView currentView = ChatView.subscribedChannels;

  List<ChannelData> availableChannels = [];
  List<ChannelData> subscribedChannels = [];

  List<User> usersInCurrentChannel = [];

  Map<String, int> channelUnreadMessages = {};

  String filter = "";
  List<ChannelData> availableChannelsWithFilter =
      []; // The channels that are displayed after filtering

  static const String mainChannelId =
      "home"; // Id of the channel that is always available and can't be deleted

  @override
  void initState() {
    super.initState();
    socketService.connect();

    _chatService = ChatService(socketService);
    _chatService.registerAvailableChannelsHandler(onReceiveChannels);
    _chatService.registerSubscribedChannelsHandler(onReceiveSubscribedChannels);
    _chatService.registerListOfUsersInSpecificChannelHandler(
        onReceiveListOfUsersInSpecificChannel);
    _chatService.requestAvailableChannels();
    _chatService.requestSubscribedChannels();

    ChatService.currentChatDialogState = this;
  }

  void onReceiveChannels(List<ChannelData> newChannels) {
    print("Received available channels: $newChannels");
    setState(() {
      availableChannels = newChannels;
    });

    if (_chatService.selectedChannel != null &&
        !availableChannels.contains(_chatService.selectedChannel)) {
      var channelName = _chatService.selectedChannel?.displayName ?? "";

      void showChannelDeletedPopup() {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: Text('$channelName a été supprimé'),
              content: Text('Le canal $channelName n\'existe plus'),
              actions: [
                TextButton(
                  child: const Text('OK'),
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                ),
              ],
            );
          },
        );
      }

      showChannelDeletedPopup();
      changeView(ChatView.allChannelsView);
    }

    updateAvailableChannelsWithFilter();
  }

  void onReceiveSubscribedChannels(List<ChannelData> newChannels) {
    setState(() {
      subscribedChannels = newChannels;
    });
    ChatService.refreshSubscribedChannels(newChannels);
  }

  void onReceiveListOfUsersInSpecificChannel(
      String channelId, List<User> users) {
    if (channelId != _chatService.selectedChannel?.channelId) {
      return;
    }

    setState(() {
      usersInCurrentChannel = users;
    });
  }

  void onReceiveMessageNotification(Map<String, int> channelUnreadMessages) {
    setState(() {
      this.channelUnreadMessages = channelUnreadMessages;
    });
  }

  String getNumberOfUnreadMessagesInChannel(String channelID) {
    if (channelUnreadMessages[channelID] == null ||
        channelUnreadMessages[channelID] == 0) {
      return "";
    } else {
      return "(${channelUnreadMessages[channelID]} nouveaux messages)";
    }
  }

  void updateAvailableChannelsWithFilter() {
    setState(() {
      if (filter.isEmpty) {
        availableChannelsWithFilter = availableChannels;
      }

      availableChannelsWithFilter = availableChannels
          .where((channel) =>
              channel.displayName.toLowerCase().contains(filter.toLowerCase()))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor:
          Provider.of<ThemeModel>(context, listen: false).primaryColor,
      child: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewPadding.bottom),
          child: Container(
              padding: const EdgeInsets.all(20),
              width: 750,
              height: 610,
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 800,
                      decoration: defaultBoxDecoration,
                      child: Padding(
                        padding: const EdgeInsets.all(10.0),
                        child: _buildTitleBar(),
                      ),
                    ),
                    if (currentView == ChatView.chat)
                      ChatBox(
                          chatService: _chatService, width: 800, height: 373),
                    if (currentView == ChatView.allChannelsView)
                      SizedBox(
                        width: 800,
                        height: 60,
                        child: _buildSearchBar(),
                      ),
                    if (currentView == ChatView.allChannelsView)
                      Container(
                        padding: const EdgeInsets.all(20),
                        width: 800,
                        height: 400,
                        decoration: defaultBoxDecoration,
                        child: _buildChannelList(availableChannelsWithFilter,
                            subscribeToChannel, showChannelDeletionPopup, true),
                      ),
                    if (currentView == ChatView.subscribedChannels)
                      Container(
                        padding: const EdgeInsets.all(20),
                        width: 800,
                        height: 473,
                        decoration: defaultBoxDecoration,
                        child: _buildChannelList(subscribedChannels,
                            enterChannel, unsubscribeFromChannel, false),
                      ),
                    if (currentView == ChatView.currentChannelInfo)
                      _buildChannelInfo(),
                  ])),
        ),
      ),
    );
  }

  // Title Bars

  Widget _buildTitleBar() {
    Widget getAppropriateWidget() {
      switch (currentView) {
        case ChatView.allChannelsView:
          return _getChannelSelectorTitleBar();
        case ChatView.chat:
          return _getChatTitleBar();
        case ChatView.subscribedChannels:
          return _getSubscribedChannelsTitleBar();
        case ChatView.currentChannelInfo:
          return _getCurrentChannelTitleBar();
      }
    }

    return Container(
      child: getAppropriateWidget(),
    );
  }

  Widget _getChannelSelectorTitleBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        DefaultButton(
          icon: const IconData(0xe092, fontFamily: 'MaterialIcons'),
          onPressed: () => changeView(ChatView.subscribedChannels),
          customStyle: buildDefaultButtonStyle(context).copyWith(
            padding: MaterialStateProperty.all(
              EdgeInsets.symmetric(
                vertical: MediaQuery.of(context).size.height * 0.025,
                horizontal: 0,
              ),
            ),
          ),
        ),
        const Text("Choisissez un canal pour vous y abonner",
            textScaler: TextScaler.linear(2)),
        DefaultButton(
          icon: const IconData(0xe047, fontFamily: 'MaterialIcons'),
          onPressed: showChannelCreationPopup,
          customStyle: buildDefaultButtonStyle(context).copyWith(
            padding: MaterialStateProperty.all(
              EdgeInsets.symmetric(
                vertical: MediaQuery.of(context).size.height * 0.025,
                horizontal: 0,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _getSubscribedChannelsTitleBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        DefaultButton(
          icon: const IconData(0xe16a, fontFamily: 'MaterialIcons'),
          onPressed: () => Navigator.of(context).pop(),
        ),
        const Text(
          "Vos canaux",
          textScaler: TextScaler.linear(1.5),
          style: defaultFont,
        ),
        DefaultButton(
          icon: const IconData(0xe4d2, fontFamily: 'MaterialIcons'),
          onPressed: () => changeView(ChatView.allChannelsView),
        ),
      ],
    );
  }

  Widget _getChatTitleBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        DefaultButton(
          icon: const IconData(0xe092, fontFamily: 'MaterialIcons'),
          onPressed: () => changeView(ChatView.subscribedChannels),
        ),
        const Spacer(),
        Text(_chatService.selectedChannel?.displayName ?? "Chat",
            textScaler: const TextScaler.linear(2)),
        const Spacer(),
        DefaultButton(
          icon: const IconData(0xe33c, fontFamily: 'MaterialIcons'),
          onPressed: () => changeView(ChatView.currentChannelInfo),
        ),
      ],
    );
  }

  Widget _getCurrentChannelTitleBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        DefaultButton(
          icon: const IconData(0xe092, fontFamily: 'MaterialIcons'),
          onPressed: () => enterChannel(_chatService.selectedChannel!),
        ),
        const Spacer(),
        Text(
            "Infos de ${_chatService.selectedChannel?.displayName ?? "ce canal"}",
            textScaler: const TextScaler.linear(1.5),
            style: defaultFont),
        const SizedBox(width: 230),
      ],
    );
  }

  // Content for each different views

  Widget _buildChannelList(List<ChannelData> channelsToDisplay,
      Function onSelectChannel, Function onDeleteChannel, bool useTrashIcon) {
    // If the home channel is in the list, it should be the first one
    if (channelsToDisplay
        .any((ChannelData channel) => channel.channelId == mainChannelId)) {
      ChannelData homeChannel = channelsToDisplay.firstWhere(
          (ChannelData channel) => channel.channelId == mainChannelId);
      channelsToDisplay.remove(homeChannel);
      channelsToDisplay.insert(0, homeChannel);
    }

    return ListView.builder(
      itemCount: channelsToDisplay.length,
      itemBuilder: (BuildContext context, int index) {
        var deleteChannelMethod =
            channelsToDisplay[index].channelId == mainChannelId
                ? null
                : onDeleteChannel;

        return _buildChannelItem(channelsToDisplay[index], onSelectChannel,
            deleteChannelMethod, useTrashIcon);
      },
    );
  }

  Widget _buildChannelItem(ChannelData channel, Function onSelectChannel,
      Function? onDeleteChannel, bool useTrashIcon) {
    IconData icon = useTrashIcon
        ? const IconData(0xe1b9, fontFamily: 'MaterialIcons')
        : const IconData(0xe243, fontFamily: 'MaterialIcons');

    return GestureDetector(
      onTap: () {
        onSelectChannel(channel);
      },
      child: Container(
        padding: const EdgeInsets.all(10),
        margin: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: accentColor,
          border: Border.all(width: 2.0),
          borderRadius: BorderRadius.circular(8.0),
        ),
        child: Row(
          children: [
            Text(
              "${channel.displayName} ${getNumberOfUnreadMessagesInChannel(channel.channelId)}",
              textScaler: const TextScaler.linear(1.1),
              textAlign: TextAlign.center,
              style: defaultFont.copyWith(color: Colors.black),
            ),
            // Delete button
            const Spacer(),
            if (onDeleteChannel != null && !channel.isPrivate)
              DefaultButton(
                icon: icon,
                onPressed: () => onDeleteChannel(channel),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return SizedBox(
      height: 100,
      child: TextInput(
        hintText: 'Filtrer',
        onChanged: (value) {
          filter = value;
          updateAvailableChannelsWithFilter();
        },
        maxLength: 25,
      ),
    );
  }

  Widget _buildChannelInfo() {
    return Container(
      width: 800,
      height: 473,
      padding: const EdgeInsets.all(20),
      decoration: defaultBoxDecoration,
      child: Column(
        children: [
          const SizedBox(height: 10),
          const Text("Utilisateurs abonnés à ce canal :",
              textScaler: TextScaler.linear(1.5), style: defaultFont),
          const SizedBox(height: 10),

          // List of users
          Expanded(
            child: ListView.builder(
              itemCount: usersInCurrentChannel.length,
              itemBuilder: (BuildContext context, int index) {
                return Container(
                  padding: const EdgeInsets.all(10),
                  margin: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: accentColor,
                    border: Border.all(width: 2.0),
                    borderRadius: BorderRadius.circular(8.0),
                  ),
                  child: Text(usersInCurrentChannel[index].username,
                      textScaler: const TextScaler.linear(1.1),
                      textAlign: TextAlign.center,
                      style: defaultFont.copyWith(color: Colors.black)),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void enterChannel(ChannelData channel) {
    changeView(ChatView.chat);
    _chatService.selectedChannel = channel;

    // Wait for .01 seconds to ensure the chat box is built before sending the request
    Future.delayed(const Duration(milliseconds: 10), () {
      _chatService.requestToEnterChannel(channel.channelId);
    });
  }

  void subscribeToChannel(ChannelData channel) {
    _chatService.subscribeToChannel(channel.channelId);

    changeView(ChatView.subscribedChannels);
  }

  void unsubscribeFromChannel(ChannelData channel) {
    _chatService.unsubscribeFromChannel(channel.channelId);
  }

  void _onSubmitted(String text) {
    createChannel(text);
    Navigator.of(context).pop();
  }

  void showChannelCreationPopup() {
    Widget buildInputRow(Function onSubmittedCallback, String text) {
      return SizedBox(
        width: 550,
        child: Row(
          children: [
            Expanded(
              child: TextInput(
                controller: _channelCreationController,
                maxLength: 15,
                onSubmitted: onSubmittedCallback,
              ),
            ),
          ],
        ),
      );
    }

    _channelCreationController.clear();

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor:
              Provider.of<ThemeModel>(context, listen: false).primaryColor,
          title: const Text("Choisissez un nom pour le canal"),
          content: buildInputRow(_onSubmitted, _channelCreationController.text),
          actions: [
            DefaultButton(
              onPressed: () => Navigator.of(context).pop(),
              buttonText: "Annuler",
            ),
            DefaultButton(
              onPressed: () {
                _onSubmitted(_channelCreationController.text);
              },
              buttonText: "Créer",
            ),
          ],
        );
      },
    );
  }

  void createChannel(String channelName) {
    if (InputFilteringService.isMessageVulgar(channelName)) {
      showInvalidChannelNamePopup();
      return;
    }

    _chatService.requestChannelCreation(channelName);
  }

  void showChannelDeletionPopup(ChannelData channel) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor:
              Provider.of<ThemeModel>(context, listen: false).primaryColor,
          title: Text("Supprimer ${channel.displayName}", style: defaultFont),
          content: Text("Voulez-vous vraiment supprimer ${channel.displayName}",
              style: defaultFont),
          actions: [
            DefaultButton(
                onPressed: () => Navigator.of(context).pop(),
                buttonText: "Annuler"),
            DefaultButton(
                onPressed: () {
                  deleteChannel(channel);
                  Navigator.of(context).pop();
                },
                buttonText: "Supprimer"),
          ],
        );
      },
    );
  }

  void showInvalidChannelNamePopup() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor:
              Provider.of<ThemeModel>(context, listen: false).primaryColor,
          title: const Text(
            "Message invalide",
            style: defaultFont,
          ),
          content: const Text(
            "Votre texte contient des mots vulgaires",
            style: defaultFont,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text("OK"),
            ),
          ],
        );
      },
    );
  }

  void deleteChannel(ChannelData channel) {
    _chatService.requestChannelDeletion(channel.channelId);
  }

  void changeView(ChatView newView) {
    setState(() {
      currentView = newView;
    });

    if (newView != ChatView.chat) {
      if (_chatService.selectedChannel != null) {
        _chatService
            .requestToExitChannel(_chatService.selectedChannel!.channelId);
      }
    }

    if (newView == ChatView.allChannelsView) {
      _chatService.selectedChannel = null;
      _chatService.requestAvailableChannels();
    }

    if (newView == ChatView.subscribedChannels) {
      _chatService.selectedChannel = null;
      _chatService.requestSubscribedChannels();
    }

    if (newView != ChatView.allChannelsView) {
      filter = "";
      updateAvailableChannelsWithFilter();
    }
  }

  @override
  void dispose() {
    _chatService.unbindChannelHandler();
    _chatService.unbindSubscribedChannelsHandler();
    _chatService.unbindListOfUsersInSpecificChannelHandler();
    if (_chatService.selectedChannel != null) {
      _chatService
          .requestToExitChannel(_chatService.selectedChannel!.channelId);
    }
    _chatService.selectedChannel = null;
    FocusManager.instance.primaryFocus?.unfocus();
    super.dispose();
  }
}
