import 'dart:async';

import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/screens/chat_dialog.dart';
import 'package:android_client/services/chat_service.dart';
import 'package:flutter/material.dart';

class ChatButton extends StatefulWidget {
  const ChatButton(
      {Key? key, this.padding = const EdgeInsets.fromLTRB(30.0, 30.0, 30.0, 0)})
      : super(key: key);

  final EdgeInsetsGeometry padding;

  @override
  ChatButtonState createState() => ChatButtonState();
}

class ChatButtonState extends State<ChatButton> {
  int numberOfUnreadMessages = 0;

  late Timer timer;

  @override
  void initState() {
    super.initState();

    setNumberOfUnreadMessages(getNumberOfUnreadMessages());

    timer = Timer.periodic(const Duration(milliseconds: 100), (_) {
      setNumberOfUnreadMessages(getNumberOfUnreadMessages());
    });
  }

  int getNumberOfUnreadMessages() {
    int output = 0;

    ChatService.channelUnreadMessages.forEach((key, value) {
      if (!ChatService.subscribedChannels.contains(key)) {
        return;
      }

      output += value;
    });

    return output;
  }

  void setNumberOfUnreadMessages(int number) {
    setState(() {
      numberOfUnreadMessages = number;
    });
  }

  @override
  Widget build(BuildContext context) {
    return _buildAlignedButton(
      button: DefaultButton(
        onPressed: () => openChatDialog(context),
        icon: const IconData(0xe153, fontFamily: 'MaterialIcons'),
        buttonText:
            numberOfUnreadMessages > 0 ? "($numberOfUnreadMessages)" : "",
        customStyle: buildDefaultButtonStyle(context).copyWith(
            backgroundColor: numberOfUnreadMessages > 0
                ? MaterialStateProperty.resolveWith((states) => Colors.orange)
                : null),
      ),
      rowAlignment: MainAxisAlignment.start,
    );
  }

  Widget _buildAlignedButton(
      {required DefaultButton button,
      required MainAxisAlignment rowAlignment}) {
    return Padding(
      padding: widget.padding,
      child: Stack(
        children: [
          Row(
            mainAxisAlignment: rowAlignment,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [button],
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    super.dispose();

    timer.cancel();
  }
}
