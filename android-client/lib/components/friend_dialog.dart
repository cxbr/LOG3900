import 'package:android_client/classes/friend_notifier.dart';
import 'package:android_client/classes/user.dart';
import 'package:android_client/components/profile_list.dart';
import 'package:android_client/components/text_input.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/friend_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:android_client/services/user_http_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class FriendDialog extends StatelessWidget {
  const FriendDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return Dialog(
        alignment: Alignment.center,
        backgroundColor:
            Provider.of<ThemeModel>(context, listen: false).primaryColor,
        child: SingleChildScrollView(
          child: Container(
            padding: const EdgeInsets.all(20),
            height: MediaQuery.of(context).size.height * 0.8,
            width: MediaQuery.of(context).size.width * 0.5,
            child: const FriendCentre(),
          ),
        ));
  }
}

class FriendCentre extends StatefulWidget {
  const FriendCentre({super.key});

  @override
  FriendCentreState createState() => FriendCentreState();
}

class FriendCentreState extends State<FriendCentre> {
  String filter = "";
  final TextEditingController _friendSearchController = TextEditingController();
  final FriendService _friendService = FriendService();
  late FriendNotifier _friendNotifier;

  List<UserProfile> _userProfiles = <UserProfile>[];

  @override
  void initState() {
    super.initState();
    _friendService.setUsers(setUserProfiles);
    _friendNotifier = Provider.of<FriendNotifier>(context, listen: false);
    _friendNotifier.addListener(_onFriendEvent);
  }

  @override
  void dispose() {
    _friendNotifier.removeListener(_onFriendEvent);
    _friendService.seenFriendRequests();
    super.dispose();
  }

  void _onFriendEvent() {
    if (_friendNotifier.friendEvent == FriendEvent.addNewUser.name) {
      _friendNotifier.user.avatar =
          UserHttpService.getReplacedUrl(_friendNotifier.user.avatar);
      _userProfiles.add(_friendNotifier.user);
      setUserProfiles(_userProfiles);
    } else if (_friendNotifier.friendEvent != FriendEvent.seenRequests.name) {
      _friendNotifier.onFriendEvent(_setUserState);
    }
  }

  void setUserProfiles(List<UserProfile> profiles) {
    profiles.sort((dynamic profileA, dynamic profileB) => profileA.username
        .toString()
        .toLowerCase()
        .compareTo(profileB.username.toString().toLowerCase()));

    setState(() {
      _userProfiles = profiles;
    });
  }

  void _setUserState(UserState state) {
    for (UserProfile user in _userProfiles) {
      if (user.id == _friendNotifier.userId) {
        setState(() {
          user.state = state.name;
        });
      }
    }
  }

  Widget _buildSearchBar() {
    return SizedBox(
      width: 300,
      height: 60,
      child: Row(
        children: <Widget>[
          Expanded(
            child: TextInput(
              controller: _friendSearchController,
              hintText: 'Filtrer',
              onChanged: (String value) {
                setState(() {
                  filter = value;
                });
              },
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        const Stack(
          children: <Widget>[
            Align(
              alignment: Alignment.bottomCenter,
              child: Text(
                'Amis',
                style: defaultFont,
              ),
            )
          ],
        ),
        _buildSearchBar(),
        ProfileContainer(
            userProfiles: _userProfiles,
            friendService: _friendService,
            filter: filter)
      ],
    );
  }
}

Future<void> openFriendDialog(BuildContext context) {
  return showDialog(
    context: context,
    builder: (BuildContext context) {
      return const FriendDialog();
    },
  );
}
