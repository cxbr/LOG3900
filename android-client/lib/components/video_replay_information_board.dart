import 'package:android_client/classes/game_room.dart';
import 'package:android_client/classes/user_game.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/video_replay_service.dart';
import 'package:flutter/material.dart';

class ReplayGameScoreboard extends StatefulWidget {
  final bool isReplay;
  final String? gameName;
  final String? gameMode;
  final int? totalDifferences;
  final bool isCheatModeActive;

  const ReplayGameScoreboard({
    super.key,
    this.isReplay = false,
    this.gameName,
    this.gameMode,
    this.totalDifferences,
    this.isCheatModeActive = false,
  });

  @override
  ReplayGameScoreboardState createState() => ReplayGameScoreboardState();
}

class ReplayGameScoreboardState extends State<ReplayGameScoreboard> {
  String? selectedPlayer;
  final VideoReplayService videoReplayService = VideoReplayService();
  int currentAction = 0;
  late GameRoom gameRoom;

  @override
  void initState() {
    super.initState();
    gameRoom = videoReplayService.snapshots[currentAction].gameRoom;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(0, 20, 20, 0),
      child: Stack(
        children: [
          _buildInfoBoard(context),
          Padding(
            padding: const EdgeInsets.only(top: 60.0),
            child: Column(
              children: [
                _buildPlayerSelection(),
                _buildTimer(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoBoard(BuildContext context) {
    return Align(
      alignment: Alignment.topRight,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8.0),
          border: Border.all(color: Colors.black, width: 2.0),
        ),
        width: 280,
        child: IntrinsicHeight(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                "Informations",
                style: defaultFont.copyWith(
                    color: Colors.black,
                    fontSize: 15,
                    fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(
                height: 10,
              ),
              Padding(
                padding: const EdgeInsets.only(left: 15),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    "Nom du jeu : ${widget.gameName}",
                    style: defaultFont.copyWith(
                        color: Colors.black,
                        fontSize: 15,
                        fontWeight: FontWeight.normal),
                  ),
                ),
              ),
              const SizedBox(
                height: 10,
              ),
              Padding(
                padding: const EdgeInsets.only(left: 15),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    "${widget.gameMode}",
                    style: defaultFont.copyWith(
                        color: Colors.black,
                        fontSize: 15,
                        fontWeight: FontWeight.normal),
                  ),
                ),
              ),
              const SizedBox(
                height: 10,
              ),
              Padding(
                padding: const EdgeInsets.only(left: 15),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    "Nombre de différences : ${widget.totalDifferences}",
                    style: defaultFont.copyWith(
                        color: Colors.black,
                        fontSize: 15,
                        fontWeight: FontWeight.normal),
                  ),
                ),
              ),
              if (widget.isCheatModeActive)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Mode triche :',
                          style: defaultFont.copyWith(
                              color: Colors.black, fontSize: 15),
                        ),
                        DefaultButton(
                          customStyle: defaultSquarishButtonStyle.copyWith(
                              padding:
                                  const MaterialStatePropertyAll<EdgeInsets>(
                                      EdgeInsets.all(2))),
                          icon: Icons.remove_red_eye_rounded,
                          onPressed: cheat,
                        ),
                      ]),
                )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlayerSelection() {
    return Column(children: [
      Align(
          alignment: Alignment.topCenter,
          child: Padding(
              padding: const EdgeInsets.only(top: 0.0),
              child: Column(
                children: [
                  if (gameRoom.userGame.observers != null &&
                      gameRoom.userGame.observers!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          text:
                              "Observateurs en jeu : ${gameRoom.userGame.observers?.length}",
                          style: defaultFont,
                        ),
                      ),
                    ),
                  IntrinsicHeight(
                    child: IntrinsicWidth(
                        child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              border: Border.all(width: 2.0),
                              borderRadius: BorderRadius.circular(8.0),
                            ),
                            child: Column(children: <Widget>[
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: <Widget>[
                                  for (int i = 0;
                                      i <
                                          gameRoom.userGame
                                              .differenceFoundByPlayers.length;
                                      i++)
                                    Row(
                                      children: <Widget>[
                                        _buildPlayerInfo(gameRoom.userGame
                                            .differenceFoundByPlayers[i]),
                                        if (i <
                                            gameRoom
                                                    .userGame
                                                    .differenceFoundByPlayers
                                                    .length -
                                                1)
                                          const SizedBox(width: 20),
                                      ],
                                    ),
                                ],
                              )
                            ]))),
                  ),
                ],
              )))
    ]);
  }

  Widget _buildPlayerInfo(PlayerDifferences player) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: <Widget>[
        Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Text(player.username, style: defaultFont),
            const SizedBox(width: 5),
            if (isAndroidByUsername(player.username))
              const Icon(Icons.phone_android),
            if (!isAndroidByUsername(player.username))
              const Icon(Icons.desktop_windows),
          ],
        ),
        const SizedBox(height: 5),
        Text(player.differencesFound.toString(),
            style: defaultFont.copyWith(
                color: Colors.black,
                fontWeight: FontWeight.normal,
                fontSize: 20)),
      ],
    );
  }

  bool isAndroidByUsername(String username) {
    return gameRoom.userGame.currentPlayers
        .firstWhere((CurrentPlayer player) => player.username == username)
        .isAndroid;
  }

  Widget _buildTimer() {
    int minutes = gameRoom.userGame.timer ~/ 60;
    int seconds = gameRoom.userGame.timer % 60;
    return Column(
      children: [
        SizedBox(
            height: 80,
            child: Stack(children: [
              Center(
                child: Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(width: 2.0),
                    borderRadius: BorderRadius.circular(8.0),
                  ),
                  child: Text(
                    '${_formatTime(minutes)}:${_formatTime(seconds)} ',
                    style: defaultFont.copyWith(
                      color: Colors.black,
                      fontSize: 20,
                    ),
                  ),
                ),
              ),
            ])),
      ],
    );
  }

  String _formatTime(int time) {
    return time.toString().padLeft(2, '0');
  }

  cheat() {}

  void playReplay() {
    if (videoReplayService.snapshots.length > currentAction) {
      setState(() {
        gameRoom = videoReplayService.snapshots[currentAction++].gameRoom;
      });
    }
  }

  void pauseReplay() {}

  void restartReplay() {
    setState(() {
      currentAction = 0;
      gameRoom = videoReplayService.snapshots[currentAction].gameRoom;
    });
  }

  void seekToProgress(int progress) {
    currentAction = progress;
    setState(() {
      gameRoom = videoReplayService.snapshots[currentAction].gameRoom;
    });
  }
}
