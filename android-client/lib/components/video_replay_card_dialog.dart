import 'package:android_client/classes/replay.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/username.dart';
import 'package:android_client/components/video_replay_dialog.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/socket_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:android_client/services/video_replay_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class VideoReplayCardDialog extends StatelessWidget {
  String replayId;
  final int nbComments;

  VideoReplayCardDialog(
      {super.key, required this.replayId, required this.nbComments});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      alignment: Alignment.center,
      backgroundColor:
          Provider.of<ThemeModel>(context, listen: false).primaryColor,
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.95,
        width: MediaQuery.of(context).size.width * 0.95,
        child: VideoReplayCard(replayId: replayId, nbComments: nbComments),
      ),
    );
  }
}

class VideoReplayCard extends StatefulWidget {
  String replayId;
  final int nbComments;
  VideoReplayCard(
      {super.key, required this.replayId, required this.nbComments});

  @override
  _VideoReplayCardState createState() => _VideoReplayCardState();
}

class _VideoReplayCardState extends State<VideoReplayCard> {
  bool _isReplayLiked = false;
  final SocketService _socketService = SocketService();
  final String _userId = UserService.loggedInUser!.id;
  List<String> _likes = [];
  int _nbComments = 0;

  @override
  void initState() {
    super.initState();
    _nbComments = widget.nbComments;
    _socketService.on('likes', (data) {
      if (data['replayId'] == widget.replayId) {
        List<dynamic> dynamicLikesList = data['likes'];
        setState(() {
          _likes = dynamicLikesList.map((item) => item.toString()).toList();
          _isReplayLiked = _likes.contains(_userId);
        });
      }
    });
    _socketService.on('comment', (data) {
      if (data['replayId'] == widget.replayId) {
        setState(() {
          _nbComments++;
        });
      }
    });
    _socketService.send('likes', widget.replayId);
  }

  void updateLikes() {
    if (_isReplayLiked) {
      _socketService
          .send('unlike', {'replayId': widget.replayId, 'userId': _userId});
      _likes.remove(_userId);
    } else {
      _socketService
          .send('like', {'replayId': widget.replayId, 'userId': _userId});
      _likes.add(_userId);
    }
    _isReplayLiked = !_isReplayLiked;
  }

  @override
  void dispose() {
    _socketService.off('likes');
    _socketService.off('comments');
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.start,
      children: <Widget>[
        SizedBox(height: 680, child: VideoReplayDialog(canSave: false)),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            IconButton(
              icon: Icon(
                _isReplayLiked ? Icons.favorite : Icons.favorite_border,
                color: _isReplayLiked ? accentColor : Colors.black,
              ),
              onPressed: () {
                setState(updateLikes);
              },
            ),
            const SizedBox(width: 10),
            Text(
              _likes.length.toString(),
              style: defaultFont,
            ),
            const SizedBox(width: 10),
            IconButton(
              icon: const Icon(Icons.comment),
              onPressed: () => showDialog(
                context: context,
                builder: (BuildContext context) {
                  return CommentsDialog(
                      replayId: widget.replayId, userId: _userId);
                },
              ),
            ),
            const SizedBox(width: 10),
            Text(
              _nbComments.toString(),
              style: defaultFont,
            ),
          ],
        )
      ],
    );
  }
}

class CommentsDialog extends StatefulWidget {
  final String replayId;
  final String userId;

  const CommentsDialog(
      {super.key, required this.replayId, required this.userId});

  @override
  _CommentsDialogState createState() => _CommentsDialogState();
}

class _CommentsDialogState extends State<CommentsDialog> {
  String _ownComment = "";
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final SocketService _socketService = SocketService();
  List<Comment> _comments = [];

  @override
  void initState() {
    super.initState();
    _socketService.on('comments', (data) {
      if (data['replayId'] == widget.replayId) {
        List<dynamic> dynamicCommentsList = data['comments'];
        setState(() {
          _comments = dynamicCommentsList
              .map((item) => Comment.fromJson(item))
              .toList();
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _scrollController.animateTo(
                _scrollController.position.maxScrollExtent,
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut);
          });
        });
      }
    });
    _socketService.send('comments', widget.replayId);
  }

  @override
  void dispose() {
    _commentController.dispose();
    _scrollController.dispose();
    _socketService.off('comments');
    super.dispose();
  }

  void sendComment() {
    if (_ownComment.isEmpty) return;
    _socketService.send('comment', {
      'replayId': widget.replayId,
      'userId': widget.userId,
      'comment': _ownComment
    });
    _ownComment = "";
    _commentController.clear();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor:
          Provider.of<ThemeModel>(context, listen: false).primaryColor,
      title: const Text("Commentaires", style: defaultFont),
      content: SizedBox(
        height: MediaQuery.of(context).size.height * 0.4,
        width: MediaQuery.of(context).size.width * 0.5,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: <Widget>[
            Expanded(
              child: SingleChildScrollView(
                controller: _scrollController,
                child: Column(
                  children: <Widget>[
                    for (int i = 0; i < _comments.length; i++)
                      Row(
                        children: <Widget>[
                          UsernameComponent(
                              userId: _comments[i].userId, isShowAvatar: true),
                          const SizedBox(width: 10),
                          Text('(${_comments[i].getTimestamp})'),
                          const SizedBox(width: 10),
                          Flexible(
                            child: Text(_comments[i].comment),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ),
                  ],
                ),
              ),
            ),
            TextField(
              controller: _commentController,
              onChanged: (String value) {
                _ownComment = value;
              },
              decoration: InputDecoration(
                  hintText: "Tapez un commentaire",
                  hintStyle: defaultFont.copyWith(
                    color: Provider.of<ThemeModel>(context, listen: false)
                        .textColor,
                  )),
            ),
            const SizedBox(
              height: 10,
            ),
            DefaultButton(onPressed: sendComment, buttonText: "Envoyer"),
          ],
        ),
      ),
    );
  }
}

Future<void> openVideoReplayDialog(
    BuildContext context, Replay data, int nbComments, String replayId) {
  VideoReplayService().loadData(data);
  return showDialog(
    context: context,
    builder: (BuildContext context) {
      return VideoReplayCardDialog(replayId: replayId, nbComments: nbComments);
    },
  );
}
