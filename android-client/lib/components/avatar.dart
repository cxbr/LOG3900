import 'package:android_client/components/avatar_modifier_dialog.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/message_dialog.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/avatar_notifier_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class Avatar extends StatefulWidget {
  final BuildContext parentContext;
  final bool modify;
  // sendRightAway is used to setup components' http requests behaviour
  final bool sendRightAway;
  final UserService _userService = UserService();
  final bool? toggleError;

  Avatar(
      {super.key,
      required this.parentContext,
      required this.modify,
      required this.sendRightAway,
      this.toggleError = false});

  @override
  AvatarState createState() => AvatarState();
}

class AvatarState extends State<Avatar> {
  late final AvatarNotifier _avatarNotifier;
  bool _isvalid = true;

  @override
  void initState() {
    super.initState();
    _avatarNotifier = Provider.of<AvatarNotifier>(context, listen: false);
  }

  @override
  void didUpdateWidget(Avatar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.toggleError!) {
      _toggleError();
    }
  }

  Future<void> _changeAvatar(BuildContext context) async {
    final avatarPath = await openAvatarModifierDialog(
        context, widget.parentContext, widget.sendRightAway);
    if (avatarPath != null && !widget.sendRightAway) {
      setAvatarToUi(avatarPath);
    } else if (avatarPath != null && widget.sendRightAway) {
      final response = await openMessageDialog(
          "Souhaitez-vous modifier votre avatar ?", true, context);
      if (response) {
        await widget._userService.setAvatar(context, false, avatarPath);
        Provider.of<AvatarNotifier>(context, listen: false).avatar =
            '${UserService.loggedInUser!.avatar}?${UniqueKey()}';
      }
    }
    _toggleError();
  }

  void _toggleError() {
    setState(() {
      _isvalid = _avatarNotifier.avatar != "";
    });
  }

  void setAvatarToUi(String avatarUrl) {
    _avatarNotifier.avatar = avatarUrl;
    _avatarNotifier.isLocalFile = false;
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Stack(
        clipBehavior: Clip.none,
        children: <Widget>[
          Container(
              decoration: _isvalid
                  ? circularBoxDecoration
                  : circularBoxDecoration.copyWith(
                      border:
                          Border.all(width: 3, color: const Color(0xFFC13A31))),
              child: Consumer<AvatarNotifier>(builder: (BuildContext context,
                  AvatarNotifier avatarNotifier, Widget? child) {
                return CircleAvatar(
                  backgroundImage: avatarNotifier.avatar != ''
                      ? avatarNotifier.buildAvatar() as ImageProvider<Object>
                      : null,
                  backgroundColor: Colors.white,
                  radius: 100,
                );
              })),
          if (widget.modify)
            Positioned(
                bottom: -10,
                right: 0,
                child: DefaultButton(
                  onPressed: () async {
                    await _changeAvatar(context);
                  },
                  icon: Icons.add_a_photo,
                ))
        ],
      ),
      const SizedBox(
        height: 20,
      ),
      Text(
        _isvalid ? '' : 'Avatar requis',
        style: defaultFont.copyWith(color: const Color(0xFFC13A31)),
      )
    ]);
  }
}
