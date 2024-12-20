import 'package:android_client/classes/user.dart';
import 'package:android_client/components/avatar_image.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/socket_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';

class UsernameComponent extends StatefulWidget {
  final String? username;
  final String? userId;
  final bool isShowAvatar;
  final double? radius;

  const UsernameComponent(
      {super.key,
      this.username,
      this.userId,
      required this.isShowAvatar,
      this.radius = 16});

  @override
  _UsernameComponentState createState() => _UsernameComponentState();
}

class _UsernameComponentState extends State<UsernameComponent> {
  String username = '';
  String userId = '';
  String usernameColor = '#000000';
  UserService userService = UserService();
  String userAvatar = '';
  final _socketService = SocketService();

  @override
  void initState() {
    super.initState();
    _getUsernameColor();
  }

  void _getUsernameColor() async {
    if (widget.username == null && widget.userId == null) {
      usernameColor = '#000000';
      userAvatar = '';
      return;
    }
    if (widget.username == null) {
      String username = await userService.getUsernameByUserId(widget.userId!);
      username = username.replaceAll('"', '');
      setState(() {
        this.username = username;
        userId = widget.userId!;
      });
    }
    if (widget.userId == null) {
      String userId = await userService.getUserIdByUsername(widget.username!);
      userId = userId.replaceAll('"', '');
      setState(() {
        this.userId = userId;
        username = widget.username!;
      });
    }
    if (UserService.usernameColorCache.containsKey(widget.username)) {
      setState(() {
        usernameColor =
            UserService.usernameColorCache[widget.username]!.usernameColor;
        String cachedAvatar =
            UserService.usernameColorCache[widget.username]!.avatar;

        userAvatar = cachedAvatar.contains(UserService.loggedInUser!.id)
            ? '$cachedAvatar?${UniqueKey()}'
            : cachedAvatar;
      });
      return;
    }
    _socketService.on('usernameColorUpdated', (data) {
      if (data['userId'] == userId) {
        setState(() {
          usernameColor = data['usernameColor'] ?? '#000000';
        });
      }
    });
    UserProfileUI userProfileUI =
        await userService.getUsernameUI(userId, username);
    try {
      setState(() {
        usernameColor = userProfileUI.usernameColor;
        userAvatar = userProfileUI.avatar;
      });
    } catch (e) {}
  }

  Color _getColorFromHex(String hexColor) {
    final String hexCode = hexColor.replaceAll('#', '').replaceAll('"', '');
    return Color(int.parse('FF$hexCode', radix: 16));
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.isShowAvatar)
          ImageAvatar(
            avatar: userAvatar,
            radius: widget.radius as double,
          ),
        const SizedBox(width: 10),
        Text(
          username,
          style: defaultFont.copyWith(color: _getColorFromHex(usernameColor)),
        ),
      ],
    );
  }
}
