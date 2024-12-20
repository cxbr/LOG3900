import 'package:android_client/classes/friend_notifier.dart';
import 'package:android_client/classes/user.dart';
import 'package:android_client/components/avatar_image.dart';
import 'package:android_client/components/friend_buttons.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/friend_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class ProfileDialog extends StatefulWidget {
  final UserProfile user;
  final FriendService friendService;
  final List<UserProfile> profiles;

  const ProfileDialog(
      {super.key,
      required this.user,
      required this.friendService,
      required this.profiles});

  @override
  ProfileDialogState createState() => ProfileDialogState();
}

class ProfileDialogState extends State<ProfileDialog> {
  late FriendNotifier _friendNotifier;
  final List<UserProfile> _friendList = [];
  final UserService _userService = UserService();
  late UserProfile currentUser;
  bool isFriend = false;

  @override
  void initState() {
    super.initState();
    _setCurrentUser(widget.user);
    _friendNotifier = Provider.of<FriendNotifier>(context, listen: false);
    _friendNotifier.addListener(_onFriendEvent);
    _getFriendList();
  }

  void _getFriendList() {
    _friendList.clear();
    _userService.getFriendList(currentUser.id).then((List<String> friendIds) {
      setState(() {
        isFriend = friendIds.contains(UserService.loggedInUser!.id);
      });

      for (String friendId in friendIds) {
        for (UserProfile profile in widget.profiles) {
          if (friendId == profile.id) {
            UserProfile friend = UserProfile(
                id: profile.id,
                username: profile.username,
                avatar: profile.avatar,
                state: profile.state);
            _setFriendList(friend);
          }
        }
      }
    });
  }

  void _setFriendList(UserProfile friend) {
    setState(() {
      _friendList.add(friend);
      _friendList.sort((dynamic profileA, dynamic profileB) => profileA.username
          .toString()
          .toLowerCase()
          .compareTo(profileB.username.toString().toLowerCase()));
    });
  }

  @override
  void dispose() {
    _friendNotifier.removeListener(_onFriendEvent);
    super.dispose();
  }

  void _setCurrentUser(UserProfile user) {
    setState(() {
      currentUser = user;
    });
  }

  void _onFriendEvent() {
    if (_friendNotifier.friendEvent != FriendEvent.addNewUser.name &&
        _friendNotifier.friendEvent != FriendEvent.seenRequests.name) {
      _friendNotifier.onFriendEvent(_setUserState);
    }
  }

  void _setUserState(UserState state) {
    if (currentUser.id == _friendNotifier.userId) {
      setState(() {
        currentUser.state = state.name;
      });
    }
  }

  Column? _buildFriendList() {
    if (_friendList.isNotEmpty || isFriend) {
      return Column(children: [
        if (isFriend)
          Text(
            "Vous et ${currentUser.username} êtes amis",
            style: defaultFont.copyWith(color: Colors.pink),
          ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(8),
            itemCount: _friendList.length,
            itemBuilder: (BuildContext context, int index) {
              return ProfileListEntry(
                user: _friendList[index],
                friendService: widget.friendService,
                setUserCallback: _setCurrentUser,
                getFriendListCallback: _getFriendList,
              );
            },
            separatorBuilder: (BuildContext context, int index) =>
                const Divider(
              color: Colors.transparent,
            ),
          ),
        )
      ]);
    } else {
      return null;
    }
  }

  Widget _buildEmptyFriendListText() {
    return Center(
      child: Text(
        "${currentUser.username} n'a pas encore d'ami",
        style: defaultFont,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
        backgroundColor:
            Provider.of<ThemeModel>(context, listen: false).primaryColor,
        child: Padding(
            padding: EdgeInsets.all(20),
            child: SizedBox(
              height: MediaQuery.of(context).size.height * 0.4,
              width: MediaQuery.of(context).size.width * 0.4,
              child: Column(children: <Widget>[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: <Widget>[
                    ImageAvatar(avatar: currentUser.avatar),
                    Text(
                      currentUser.username,
                      style: defaultFont,
                    ),
                    if (currentUser.state == UserState.isStranger.name)
                      AddFriendButton(
                          friendService: widget.friendService,
                          userId: currentUser.id),
                    if (currentUser.state == UserState.requestSent.name)
                      RequestSentText(
                          color: Provider.of<ThemeModel>(context, listen: false)
                              .textColor),
                    if (currentUser.state == UserState.requestReceived.name)
                      AcceptDeclineButtonContainer(
                          friendService: widget.friendService,
                          userId: currentUser.id),
                    if (currentUser.state == UserState.requestUnseen.name)
                      UnseenRequest(
                          friendService: widget.friendService,
                          userId: currentUser.id),
                    if (currentUser.state == UserState.isFriend.name)
                      RemoveFriendButton(
                          friendService: widget.friendService,
                          userId: currentUser.id)
                  ],
                ),
                const Text(
                  "Liste d'amis",
                  style: defaultFont,
                ),
                Expanded(
                    child: _buildFriendList() ?? _buildEmptyFriendListText()),
              ]),
            )));
  }
}

Future<void> openProfileDialog(BuildContext context, UserProfile user,
    FriendService friendService, List<UserProfile> profiles) {
  return showDialog(
    context: context,
    builder: (BuildContext context) {
      return ProfileDialog(
          user: user, friendService: friendService, profiles: profiles);
    },
  );
}

class ProfileListEntry extends StatelessWidget {
  final UserProfile user;
  final FriendService friendService;
  final Function setUserCallback;
  final Function getFriendListCallback;

  const ProfileListEntry(
      {Key? key,
      required this.user,
      required this.friendService,
      required this.setUserCallback,
      required this.getFriendListCallback})
      : super(key: key);
  @override
  Widget build(BuildContext context) {
    return Container(
        padding: const EdgeInsets.all(10),
        decoration: defaultBoxDecoration.copyWith(color: Colors.white),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: <Widget>[
            OutlinedButton(
                style: defaultCircularButtonStyle.copyWith(
                    padding: const MaterialStatePropertyAll<EdgeInsets>(
                        EdgeInsets.all(0))),
                onPressed: () {
                  setUserCallback(user);
                  getFriendListCallback();
                },
                // TODO: Create a user avatar widget/component
                child: ImageAvatar(avatar: user.avatar)),
            Text(user.username,
                style: defaultFont.merge(const TextStyle(color: Colors.black))),
          ],
        ));
  }
}
