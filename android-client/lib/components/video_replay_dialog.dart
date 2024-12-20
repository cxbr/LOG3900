import 'dart:async';
import 'dart:math';

import 'package:android_client/classes/game_data.dart';
import 'package:android_client/classes/game_room.dart';
import 'package:android_client/classes/user_game.dart';
import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/video_replay_information_board.dart';
import 'package:android_client/components/video_replay_play-area_components.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/video_replay_service.dart';
import 'package:flutter/material.dart';

class VideoReplayDialog extends StatefulWidget {
  bool canSave = false;
  VideoReplayDialog({Key? key, required this.canSave}) : super(key: key);

  @override
  State<VideoReplayDialog> createState() => _VideoReplayDialogState();
}

class _VideoReplayDialogState extends State<VideoReplayDialog> {
  int currentProgress = 0;
  bool isChangingProgress = false;
  int maxProgressValue = 100;
  int playbackRate = 1;
  int playState = 1; // 0: playing, 1: paused, 2: stopped

  final VideoReplayService videoReplayService = VideoReplayService();
  late GameRoom gameRoom;
  Timer? playInterval;
  late GameData gameData;

  final GlobalKey<VideoReplayPlayAreaComponentState> playAreaKey =
      GlobalKey<VideoReplayPlayAreaComponentState>();
  final GlobalKey<ReplayGameScoreboardState> scoreboardKey =
      GlobalKey<ReplayGameScoreboardState>();

  @override
  void initState() {
    super.initState();
    gameRoom = videoReplayService.snapshots[0].gameRoom;
    if (videoReplayService.gameData == null) {
      videoReplayService.getGame(gameRoom.userGame.gameName!).then((value) => {
            gameData = videoReplayService.gameData!,
            setPlaybackRate(1),
            restart()
          });
    } else {
      gameData = videoReplayService.gameData!;
      setPlaybackRate(1);
      restart();
    }
  }

  void play() {
    if (playInterval != null || playState == 0) {
      return;
    }
    setState(() => playState = 0);
    playSignal();
    playInterval = Timer.periodic(
      Duration(milliseconds: (1000 / playbackRate).round()),
      (Timer timer) {
        if (currentProgress < maxProgressValue) {
          setState(() {
            currentProgress += 1;
          });
          seekToProgress(currentProgress);
          nextAction();
        } else if (currentProgress == maxProgressValue) {
          seekToProgress(currentProgress);
          nextAction();
        } else {
          pause();
          setState(() {
            playState = 2;
          });
        }
      },
    );
  }

  void playSignal() {
    playAreaKey.currentState?.startReplay();
    scoreboardKey.currentState?.playReplay();
  }

  void nextAction() {
    playAreaKey.currentState?.nextAction();
    scoreboardKey.currentState?.playReplay();
  }

  void pause() {
    if (playInterval != null) {
      setState(() => playState = 1);
      playInterval!.cancel();
      playInterval = null;
      pauseSignal();
    }
  }

  void pauseSignal() {
    playAreaKey.currentState?.pauseReplay();
    scoreboardKey.currentState?.pauseReplay();
  }

  void restart() {
    pause();
    setState(() {
      currentProgress = 0;
      playState = 1;
    });
    seekToProgress(0);
    restartSignal();
    play();
  }

  void restartSignal() {
    playAreaKey.currentState?.restartReplay();
    scoreboardKey.currentState?.restartReplay();
  }

  void seekToProgress(int progress) {
    setState(() {
      currentProgress = progress;
    });
    if (isChangingProgress) {
      currentProgress = progress;
      seekSignal(progress);
      if (playState == 2) {
        pause();
        playState = 0;
      }
      isChangingProgress = false;
    }
  }

  @override
  void dispose() {
    pause();
    videoReplayService.events.clear();
    videoReplayService.snapshots.clear();
    super.dispose();
  }

  void seekSignal(int progress) {
    playAreaKey.currentState?.seekToProgress(progress);
    scoreboardKey.currentState?.seekToProgress(progress);
  }

  void setPlaybackRate(int rate) {
    setState(() {
      playbackRate = rate;
      maxProgressValue = videoReplayService.snapshots.length - 1;
    });
    setPlaybackRateSignal(rate);
    if (playInterval != null) {
      pause();
      play();
    }
  }

  void setPlaybackRateSignal(int rate) {
    playAreaKey.currentState?.setPlaybackRate(rate);
  }

  void save() {
    videoReplayService.saveReplay().then((value) => Navigator.pop(context));
  }

  bool isAndroidByUsername(String username) {
    return gameRoom.userGame.currentPlayers
        .firstWhere((CurrentPlayer player) => player.username == username)
        .isAndroid;
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
        child: SizedBox(
      height: 820,
      child: Column(children: <Widget>[
        Stack(
          children: <Widget>[
            if (widget.canSave)
              Row(children: [
                AlignedButton(
                  rowAlignment: MainAxisAlignment.start,
                  button: DefaultButton(
                    buttonText: "Sauvegarder",
                    onPressed: save,
                    customStyle: buildDefaultButtonStyle(context).copyWith(
                        padding: const MaterialStatePropertyAll<EdgeInsets>(
                            EdgeInsets.all(20))),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 20.0),
                  child: DefaultButton(
                    buttonText: "Terminer",
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    customStyle: buildDefaultButtonStyle(context).copyWith(
                        padding: const MaterialStatePropertyAll<EdgeInsets>(
                            EdgeInsets.all(20))),
                  ),
                )
              ]),
            ReplayGameScoreboard(
              key: scoreboardKey,
              isReplay: true,
              gameName: gameRoom.userGame.gameName,
              gameMode: gameRoom.gameMode,
              totalDifferences: gameData.nbDifference,
              isCheatModeActive: gameRoom.gameConstants!.cheatMode,
            ),
          ],
        ),
        const SizedBox(height: 5),
        FittedBox(
            child: Transform.scale(
                scale: 0.8,
                child: VideoReplayPlayAreaComponent(key: playAreaKey))),
        SizedBox(
          height: 100,
          child: Column(
            children: [
              Slider(
                activeColor: accentColor,
                min: 0,
                max: maxProgressValue.toDouble(),
                value: currentProgress.toDouble(),
                onChanged: (double value) {
                  if (!isChangingProgress) {
                    seekToProgress(min(value.toInt(), maxProgressValue));
                  }
                },
                onChangeEnd: (double value) {
                  setState(() {
                    isChangingProgress = true;
                    seekToProgress(value.toInt());
                  });
                },
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  SizedBox(
                    width: 200,
                    child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          DefaultButton(
                              icon: Icons.play_arrow,
                              onPressed: play,
                              customStyle:
                                  buildDefaultButtonStyle(context).copyWith(
                                padding:
                                    const MaterialStatePropertyAll<EdgeInsets>(
                                        EdgeInsets.all(0)),
                              )),
                          DefaultButton(
                              icon: Icons.pause,
                              onPressed: pause,
                              customStyle:
                                  buildDefaultButtonStyle(context).copyWith(
                                padding:
                                    const MaterialStatePropertyAll<EdgeInsets>(
                                        EdgeInsets.all(0)),
                              )),
                          DefaultButton(
                              icon: Icons.replay,
                              onPressed: restart,
                              customStyle:
                                  buildDefaultButtonStyle(context).copyWith(
                                padding:
                                    const MaterialStatePropertyAll<EdgeInsets>(
                                        EdgeInsets.all(0)),
                              )),
                        ]),
                  ),
                  const SizedBox(width: 20),
                  SizedBox(
                      width: 200,
                      child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            for (double rate in <double>[1.0, 2.0, 4.0])
                              DefaultButton(
                                  onPressed: () =>
                                      setPlaybackRate(rate.toInt()),
                                  customStyle: buildDefaultButtonStyle(context)
                                      .copyWith(
                                          padding:
                                              const MaterialStatePropertyAll<
                                                      EdgeInsets>(
                                                  EdgeInsets.all(0)),
                                          backgroundColor:
                                              MaterialStatePropertyAll<Color>(
                                            playbackRate == rate
                                                ? accentColor
                                                : Colors.grey,
                                          )),
                                  buttonText: 'x$rate'),
                          ]))
                ],
              ),
            ],
          ),
        ),
      ]),
    ));
  }
}
