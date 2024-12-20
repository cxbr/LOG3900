import 'dart:convert';

import 'package:android_client/classes/replay.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/username.dart';
import 'package:android_client/components/video_replay_card_dialog.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/replay_http_service.dart';
import 'package:android_client/services/socket_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class VideoReplay {
  bool isOwnReplay;
  Replay replay;
  List<Replay> videoReplays = [];

  VideoReplay({
    required this.isOwnReplay,
    required this.replay,
    required this.videoReplays,
  });
}

class VideoReplayCard extends StatefulWidget {
  final VideoReplay videoReplayData;
  final Function(String val) deleteReplay;
  final Function(String val) changeVisibility;

  const VideoReplayCard(
      {super.key,
      required this.videoReplayData,
      required this.deleteReplay,
      required this.changeVisibility});

  @override
  _VideoReplayCardState createState() => _VideoReplayCardState();
}

class _VideoReplayCardState extends State<VideoReplayCard> {
  bool _isPrivate = false;
  List<String> likes = [];
  List<Comment> comments = [];
  final ReplayHttpService replayHttpService = ReplayHttpService();
  final _socketService = SocketService();
  List<Replay> replays = [];

  @override
  void initState() {
    super.initState();
    replays = widget.videoReplayData.videoReplays;
    _isPrivate = !widget.videoReplayData.replay.public;
    _socketService.on('likes', (data) {
      if (data['replayId'] == widget.videoReplayData.replay.id) {
        List<dynamic> dynamicLikesList = data['likes'];
        setState(() {
          likes = dynamicLikesList.map((item) => item.toString()).toList();
        });
      }
    });
    _socketService.on('comments', (data) {
      if (data['replayId'] == widget.videoReplayData.replay.id) {
        List<dynamic> dynamicCommentsList = data['comments'];
        setState(() {
          comments = dynamicCommentsList
              .map((item) => Comment.fromJson(item))
              .toList();
        });
      }
    });
    _socketService.send('likes', widget.videoReplayData.replay.id);
    _socketService.send('comments', widget.videoReplayData.replay.id);
  }

  @override
  void dispose() {
    _socketService.off('likes');
    _socketService.off('comments');
    super.dispose();
  }

  void deleteReplay(String replayId) {
    widget.deleteReplay(replayId);
  }

  void changeVisibility(String replayId) {
    setState(() {
      _isPrivate = !_isPrivate;
    });
    widget.changeVisibility(replayId);
  }

  void fetchAndUpdateLikes() {
    _socketService.send('likes', widget.videoReplayData.replay.id);
  }

  void fetchAndUpdateComments() {
    _socketService.send('comments', widget.videoReplayData.replay.id);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
        onHorizontalDragEnd: (DragEndDetails details) {
          if (details.primaryVelocity! > 0) {
            fetchAndUpdateLikes();
            fetchAndUpdateComments();
          } else if (details.primaryVelocity! < 0) {
            fetchAndUpdateLikes();
            fetchAndUpdateComments();
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(10.0),
          child: Column(
            children: [
              InkWell(
                onTap: () => openVideoReplayDialog(
                    context,
                    widget.videoReplayData.replay,
                    comments.length,
                    widget.videoReplayData.replay.id),
                child: Container(
                  width: MediaQuery.of(context).size.width * 0.4,
                  height: MediaQuery.of(context).size.height * 0.5,
                  padding: const EdgeInsets.all(8.0),
                  decoration: defaultBoxDecoration,
                  child: Column(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            widget.videoReplayData.replay.snapshots[0].gameRoom
                                .userGame.gameName!,
                            style: defaultFont,
                          ),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text(
                                'Créateur : ',
                                style: defaultFont,
                              ),
                              UsernameComponent(
                                userId: widget.videoReplayData.replay.creator,
                                isShowAvatar: true,
                              ),
                            ],
                          ),
                          Text(
                            'Durée : ${widget.videoReplayData.replay.snapshots.length} secondes',
                            style: defaultFont,
                          ),
                          const SizedBox(height: 10),
                          Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.thumb_up,
                                  color: Provider.of<ThemeModel>(context,
                                          listen: false)
                                      .textColor,
                                ),
                                Text(likes.length.toString(),
                                    style: defaultFont),
                                const SizedBox(width: 10),
                                Icon(
                                  Icons.question_answer,
                                  color: Provider.of<ThemeModel>(context,
                                          listen: false)
                                      .textColor,
                                ),
                                Text(comments.length.toString(),
                                    style: defaultFont),
                              ]),
                          const SizedBox(height: 5),
                          Center(
                            child: Container(
                              width: MediaQuery.of(context).size.width * 0.3,
                              height: MediaQuery.of(context).size.width * 0.17,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(15),
                                border:
                                    Border.all(color: Colors.black, width: 2),
                                image: DecorationImage(
                                  image: MemoryImage(const Base64Decoder()
                                      .convert(widget.videoReplayData.replay
                                          .snapshots[0].imageData1
                                          .split(',')[1])),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 5),
              if (widget.videoReplayData.isOwnReplay)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    DefaultButton(
                      onPressed: () =>
                          deleteReplay(widget.videoReplayData.replay.id),
                      buttonText: 'Supprimer',
                    ),
                    const SizedBox(width: 10),
                    DefaultButton(
                      onPressed: () =>
                          changeVisibility(widget.videoReplayData.replay.id),
                      buttonText:
                          _isPrivate ? 'Rendre publique' : 'Rendre privée',
                    )
                  ],
                ),
            ],
          ),
        ));
  }
}
