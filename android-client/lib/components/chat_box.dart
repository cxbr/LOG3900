import 'package:android_client/classes/channel.dart';
import 'package:android_client/classes/message_data.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/text_input.dart';
import 'package:android_client/components/username.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/chat_service.dart';
import 'package:android_client/services/input_filtering_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class ChatBox extends StatefulWidget {
  const ChatBox(
      {Key? key,
      this.width = 600,
      this.height = 300,
      required this.chatService})
      : super(key: key);
  final double? width;
  final double? height;
  final ChatService chatService;
  @override
  ChatBoxState createState() => ChatBoxState();
}

class ChatBoxState extends State<ChatBox> {
  List<ChatMessageData> messages = [];
  final _controller = TextEditingController();
  ChatService get _chatService => widget.chatService;
  bool isButtonEnabled = true;
  FocusNode focusNode = FocusNode();

  final String _authorName = UserService.loggedInUser?.username ??
      "anon"; // Anonymous if not logged in

  ChannelData? get selectedChannel => widget.chatService.selectedChannel;

  @override
  void initState() {
    super.initState();
    _chatService.registerMessageHandler(onReceiveMessage);
  }

  @override
  void dispose() {
    _chatService.unbindMessageHandler();
    super.dispose();
  }

  ChatBoxState();

  void onReceiveMessage(ChatMessageData message) {
    setState(() {
      messages.insert(0, message);
    });
  }

  void checkIfButtonShouldBeEnabled() {
    // Unfortunately, we need to comment this out because
    // it makes the whole ass page blink for no reason

    // setState(() {
    //   isButtonEnabled = canSendMessage();
    // });
  }

  bool canSendMessage() {
    if (selectedChannel == null) {
      return false;
    }

    // Check if the message is just spaces
    if (_controller.text.trim().isEmpty) {
      return false;
    }

    // Check if the message contains an invisible character
    if (_controller.text.contains("‎")) {
      return false;
    }

    return true;
  }

  void showInvalidMessagePopup() {
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
            "Votre message contient des mots vulgaires",
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

  void sendMessage(String message) {
    if (!canSendMessage()) {
      return;
    }

    if (InputFilteringService.isMessageVulgar(message)) {
      showInvalidMessagePopup();
      return;
    }

    _chatService.sendMessage(message, _authorName,
        roomID: selectedChannel!.channelId);
    _controller.clear();
    checkIfButtonShouldBeEnabled();
    focusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: widget.width,
      decoration: boxDecorationWithBackground,
      child: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 10),
            SizedBox(height: widget.height, child: _buildMessageList()),
            const SizedBox(height: 10),
            _buildInputRow(),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageList() {
    return ListView.separated(
      key: UniqueKey(),
      reverse: true,
      itemCount: messages.length,
      separatorBuilder: (context, index) => const Divider(),
      itemBuilder: (context, index) {
        return chatLine(messages[index]);
      },
    );
  }

  Widget _buildInputRow() {
    return SizedBox(
      width: 550,
      child: Row(
        children: [
          Expanded(
            child: TextInput(
                onSubmitted: sendMessage,
                onChanged: (String s) => checkIfButtonShouldBeEnabled(),
                controller: _controller,
                focusNode: focusNode),
          ),
          const SizedBox(width: 10),
          DefaultButton(
            buttonText: "Envoyer",
            onPressed: () => sendMessage(_controller.text),
          ),
        ],
      ),
    );
  }

  Widget chatLine(ChatMessageData messageData) {
    bool isAuthor = messageData.username == _authorName;
    return KeepAlive(
      child: ListTile(
        title: Row(
          mainAxisAlignment:
              isAuthor ? MainAxisAlignment.end : MainAxisAlignment.start,
          children: [
            Row(
              children: <Widget>[
                UsernameComponent(
                    username: messageData.username, isShowAvatar: true),
                Text(" - ${messageData.getTimestamp}"),
                if (messageData.username != 'Système') ...<Widget>[
                  const SizedBox(width: 8),
                  Icon(
                    messageData.isAndroid
                        ? Icons.phone_android
                        : Icons.desktop_windows,
                    size: 20,
                  ),
                ],
              ],
            ),
          ],
        ),
        subtitle: Text(messageData.message,
            textAlign: isAuthor ? TextAlign.end : TextAlign.start),
      ),
    );
  }
}

class KeepAlive extends StatefulWidget {
  final Widget child;

  KeepAlive({required this.child});

  @override
  _KeepAliveState createState() => _KeepAliveState();
}

class _KeepAliveState extends State<KeepAlive>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
