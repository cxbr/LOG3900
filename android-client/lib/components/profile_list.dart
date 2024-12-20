import 'package:android_client/classes/user.dart';
import 'package:android_client/components/avatar_image.dart';
import 'package:android_client/components/friend_buttons.dart';
import 'package:android_client/components/profile_dialog.dart';
import 'package:android_client/components/username.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/friend_service.dart';
import 'package:flutter/material.dart';

class ProfileContainer extends StatelessWidget {
  final List<UserProfile> userProfiles;
  final FriendService friendService;
  final String filter;

  const ProfileContainer(
      {Key? key,
      required this.userProfiles,
      required this.friendService,
      required this.filter})
      : super(key: key);

  List<UserProfile> _filterUsers() {
    if (filter.isEmpty) {
      return userProfiles;
    } else {
      return userProfiles
          .where((dynamic user) =>
              user.username.toLowerCase().startsWith(filter.toLowerCase()))
          .toList();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Expanded(
        child: Padding(
            padding: const EdgeInsets.only(top: 20),
            child: CustomScrollView(
              slivers: <Widget>[
                _buildSilverText("Nouvelles demandes d'amis"),
                _buildProfileList(UserState.requestUnseen.name) ??
                    _buildEmptyList(
                        "Les nouvelles demandes d'amis apparaîtront ici"),
                _buildSilverText("Demandes d'amis"),
                _buildProfileList(UserState.requestReceived.name) ??
                    _buildEmptyList(
                        "Les demandes d'amis ignorées apparaîtront ici"),
                _buildSilverText("Demandes d'amis envoyées"),
                _buildProfileList(UserState.requestSent.name) ??
                    _buildEmptyList(
                        "Les demandes d'amis envoyées apparaîtront ici"),
                _buildSilverText("Amis"),
                _buildProfileList(UserState.isFriend.name) ??
                    _buildEmptyList("Aucun ami à afficher"),
                _buildSilverText("Vous connaissez peut-être ..."),
                _buildProfileList(UserState.isStranger.name) ??
                    _buildEmptyList("Aucune suggestion à afficher"),
              ],
            )));
  }

  SliverToBoxAdapter _buildSilverText(String text) {
    return SliverToBoxAdapter(
        child: Container(
            margin: const EdgeInsets.only(top: 30),
            child: Text(
              text,
              style: defaultFont,
            )));
  }

  SliverToBoxAdapter _buildEmptyList(String text) {
    return SliverToBoxAdapter(
        child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(25),
              color: const Color.fromARGB(130, 255, 255, 255),
            ),
            padding: const EdgeInsets.all(50),
            child: Center(
              child: Text(
                text,
                style: defaultFont.copyWith(fontSize: 15),
              ),
            )));
  }

  SliverList? _buildProfileList(String listType) {
    final List<dynamic> filteredUsers = _filterUsers()
        .where((dynamic profile) => profile.state == listType)
        .toList();

    if (filteredUsers.isNotEmpty) {
      return SliverList(
        delegate: SliverChildBuilderDelegate(
          (BuildContext context, int index) {
            final UserProfile user = filteredUsers[index] as UserProfile;
            return ProfileListEntry(
              key: UniqueKey(),
              user: user,
              friendService: friendService,
              profiles: userProfiles,
              listType: listType,
            );
          },
          childCount: filteredUsers.length,
        ),
      );
    } else {
      return null;
    }
  }
}

class ProfileListEntry extends StatelessWidget {
  final UserProfile user;
  final FriendService friendService;
  final List<UserProfile> profiles;
  final String listType;

  const ProfileListEntry(
      {Key? key,
      required this.user,
      required this.friendService,
      required this.profiles,
      required this.listType})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
        margin: const EdgeInsets.symmetric(vertical: 5),
        padding: const EdgeInsets.all(20),
        decoration: defaultBoxDecoration.copyWith(color: Colors.white),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: <Widget>[
            OutlinedButton(
                style: defaultCircularButtonStyle.copyWith(
                    padding: const MaterialStatePropertyAll<EdgeInsets>(
                        EdgeInsets.all(0))),
                onPressed: () {
                  openProfileDialog(context, user, friendService, profiles);
                },
                child: ImageAvatar(avatar: user.avatar)),
            UsernameComponent(username: user.username, isShowAvatar: false),
            if (listType == UserState.isStranger.name &&
                user.state == UserState.isStranger.name)
              AddFriendButton(friendService: friendService, userId: user.id),
            if (listType == UserState.requestSent.name &&
                user.state == UserState.requestSent.name)
              const RequestSentText(color: Colors.black),
            if (listType == UserState.requestReceived.name &&
                user.state == UserState.requestReceived.name)
              AcceptDeclineButtonContainer(
                  friendService: friendService, userId: user.id),
            if (listType == UserState.requestUnseen.name &&
                user.state == UserState.requestUnseen.name)
              UnseenRequest(friendService: friendService, userId: user.id),
            if (listType == UserState.isFriend.name &&
                user.state == UserState.isFriend.name)
              RemoveFriendButton(friendService: friendService, userId: user.id)
          ],
        ));
  }
}
