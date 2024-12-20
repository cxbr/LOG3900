import 'package:android_client/classes/friend_notifier.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/friend_dialog.dart';
import 'package:android_client/services/friend_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class FriendButton extends StatefulWidget {
  const FriendButton(
      {super.key,
      this.padding = const EdgeInsets.fromLTRB(30.0, 10.0, 30.0, 0)});

  final EdgeInsetsGeometry padding;
  @override
  FriendButtonState createState() => FriendButtonState();
}

class FriendButtonState extends State<FriendButton> {
  final UserService _userService = UserService();
  final FriendService _friendService = FriendService();
  late FriendNotifier _friendNotifier;
  late int _friendNotificationCount = 0;

  @override
  void initState() {
    super.initState();
    _userService
        .getFriendNoticationCount(UserService.loggedInUser!.id)
        .then((String friendNotificationCount) {
      _incrementNotificationCount(int.parse(friendNotificationCount));
    });
    _friendNotifier = Provider.of<FriendNotifier>(context, listen: false);
    _friendNotifier.addListener(_onFriendEvent);
    _friendService.resetSocketEvents(context);
  }

  @override
  void dispose() {
    _friendNotifier.removeListener(_onFriendEvent);
    _friendService.unbindSocketEvents();
    super.dispose();
  }

  void _onFriendEvent() {
    if (_friendNotifier.friendEvent == FriendEvent.request.name) {
      _incrementNotificationCount(1);
      AudioPlayer().play(AssetSource('audio/friend.wav'));
    } else if (_friendNotifier.friendEvent == FriendEvent.seenRequests.name) {
      _resetNotificationCount();
    } else if (_friendNotifier.friendEvent == FriendEvent.seenOneRequest.name) {
      _decrementNotificationCount();
    }
  }

  void _decrementNotificationCount() {
    setState(() {
      _friendNotificationCount--;
    });
  }

  void _incrementNotificationCount(int value) {
    setState(() {
      _friendNotificationCount += value;
    });
  }

  void _resetNotificationCount() {
    setState(() {
      _friendNotificationCount = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return _buildAlignedButton(
      button: DefaultButton(
        onPressed: () => openFriendDialog(context),
        icon: const IconData(0xf26a, fontFamily: 'MaterialIcons'),
        buttonText:
            _friendNotificationCount > 0 ? "($_friendNotificationCount)" : null,
        customStyle: buildDefaultButtonStyle(context).copyWith(
            backgroundColor: _friendNotificationCount > 0
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
}
