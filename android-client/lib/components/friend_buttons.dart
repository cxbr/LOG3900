import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/friend_service.dart';
import 'package:flutter/material.dart';

class AddFriendButton extends StatelessWidget {
  final FriendService friendService;
  final String userId;

  const AddFriendButton(
      {super.key, required this.friendService, required this.userId});
  @override
  Widget build(BuildContext context) {
    return DefaultButton(
      icon: Icons.person_add,
      onPressed: () {
        friendService.sendFriendRequest(userId);
      },
    );
  }
}

class RemoveFriendButton extends StatelessWidget {
  final FriendService friendService;
  final String userId;

  const RemoveFriendButton(
      {super.key, required this.friendService, required this.userId});
  @override
  Widget build(BuildContext context) {
    return DefaultButton(
      icon: Icons.person_remove,
      onPressed: () {
        friendService.removeFriend(userId);
      },
    );
  }
}

class RequestSentText extends StatelessWidget {
  final Color color;

  const RequestSentText({super.key, required this.color});
  @override
  Widget build(BuildContext context) {
    return Text("En attente", style: defaultFont.copyWith(color: color));
  }
}

class UnseenRequest extends StatelessWidget {
  final FriendService friendService;
  final String userId;

  const UnseenRequest(
      {super.key, required this.friendService, required this.userId});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 15,
          height: 15,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: accentColor,
          ),
        ),
        const SizedBox(
          width: 20,
        ),
        AcceptDeclineButtonContainer(
            friendService: friendService, userId: userId),
      ],
    );
  }
}

class AcceptDeclineButtonContainer extends StatelessWidget {
  final FriendService friendService;
  final String userId;

  const AcceptDeclineButtonContainer(
      {super.key, required this.friendService, required this.userId});
  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        DefaultButton(
          icon: Icons.check,
          onPressed: () {
            friendService.acceptFriendRequest(userId);
          },
        ),
        const SizedBox(
          width: 10,
        ),
        DefaultButton(
          icon: Icons.close_rounded,
          onPressed: () {
            friendService.declineFriendRequest(userId);
          },
        )
      ],
    );
  }
}
