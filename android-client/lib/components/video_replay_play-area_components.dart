import 'dart:async';
import 'dart:convert';
import 'dart:ui' as ui;
import 'dart:ui';

import 'package:android_client/classes/game_data.dart';
import 'package:android_client/classes/replay.dart';
import 'package:android_client/services/remote_games_manager_service.dart';
import 'package:android_client/services/video_replay_service.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';

typedef MyBuilder = void Function(
    BuildContext context, void Function() updatePlayArea);

class VideoReplayPlayAreaComponent extends StatefulWidget {
  const VideoReplayPlayAreaComponent({
    super.key,
  });

  @override
  VideoReplayPlayAreaComponentState createState() =>
      VideoReplayPlayAreaComponentState();
}

class VideoReplayPlayAreaComponentState
    extends State<VideoReplayPlayAreaComponent> {
  late GameData gameData;
  AudioPlayer audioPlayer = AudioPlayer();
  final VideoReplayService videoReplayService = VideoReplayService();
  Timer? cheatInterval;
  List<Timer> allFlashIntervals = [];
  final RemoteGamesManagerService remoteGamesManagerService =
      RemoteGamesManagerService();
  int timer = 0;
  int eventIndex = 0;
  int gameStartTimestamp = 0;
  int currentPlaybackRate = 1;
  late ui.Image initialImageData1;
  late ui.Image initialImageData2;
  late ui.Image currentStateImage1;
  late ui.Image currentStateImage2;
  late ui.Image currentEventImage1;
  late ui.Image currentEventImage2;
  ReplayEvent? currentCheatEvent;
  bool isCheatModeOn = false;
  bool isHintModeOn = false;
  bool isErrorModeOn = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    initCanvas();
  }

  @override
  void dispose() {
    audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(children: [
              Row(
                children: <Widget>[
                  Container(
                    width: 640,
                    height: 480,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: Colors.black, width: 3.0),
                    ),
                    child: SizedBox(
                      width: 640,
                      height: 480,
                      child: LayoutBuilder(builder:
                          (BuildContext context, BoxConstraints constraints) {
                        return CustomPaint(
                            painter: MyCanvasPainter(currentEventImage1));
                      }),
                    ),
                  ),
                  const SizedBox(width: 40),
                  Container(
                    width: 640,
                    height: 480,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: Colors.black, width: 3.0),
                    ),
                    child: SizedBox(
                      width: 640,
                      height: 480,
                      child: LayoutBuilder(builder:
                          (BuildContext context, BoxConstraints constraints) {
                        return CustomPaint(
                            painter: MyCanvasPainter(currentEventImage2));
                      }),
                    ),
                  )
                ],
              )
            ])
    ]);
  }

  Future<void> initCanvas() async {
    gameData = videoReplayService.gameData!;
    timer = 0;
    eventIndex = videoReplayService.events
        .indexWhere((ReplayEvent event) => event.action == 'gameStart');
    gameStartTimestamp = videoReplayService.events[eventIndex].timestamp;
    initialImageData1 = await decodeImageFromList(const Base64Decoder()
        .convert(videoReplayService.snapshots[0].imageData1.split(',')[1]));
    initialImageData2 = await decodeImageFromList(const Base64Decoder()
        .convert(videoReplayService.snapshots[0].imageData2.split(',')[1]));
    currentStateImage1 = initialImageData1;
    currentStateImage2 = initialImageData2;
    currentEventImage1 = initialImageData1;
    currentEventImage2 = initialImageData2;
    setState(() {
      _isLoading = false;
    });
  }

  Future<void> nextAction() async {
    if (timer >= videoReplayService.snapshots.length) {
      return;
    }
    final GameStateSnapshot currentState = videoReplayService.snapshots[timer];
    if (eventIndex > videoReplayService.events.length) {
      currentStateImage1 = await convertBase64toImage(currentState.imageData1);
      currentStateImage2 = await convertBase64toImage(currentState.imageData2);
      currentEventImage1 = currentStateImage1;
      currentEventImage2 = currentStateImage2;
      setState(() {});
    }

    if (eventIndex < videoReplayService.events.length) {
      final ReplayEvent event = videoReplayService.events[eventIndex];
      final double timeDifference =
          (gameStartTimestamp - event.timestamp).abs() /
              Time.Thousand; // Assumes Time is a custom class

      if (timeDifference == timer) {
        processEvent(event, eventIndex);
        eventIndex++;
      }
      if (eventIndex < videoReplayService.events.length) {
        ReplayEvent nextEvent = videoReplayService.events[eventIndex];
        double nextTimeDifference =
            (gameStartTimestamp - nextEvent.timestamp).abs() / Time.Thousand;
        while (nextTimeDifference > timer && nextTimeDifference < timer + 1) {
          final double delay = (nextTimeDifference - timer).abs() *
              Time.Thousand /
              currentPlaybackRate;
          final ReplayEvent newEvent = cloneEvent(nextEvent);
          final int delayedIndex = eventIndex;
          Future.delayed(Duration(milliseconds: delay.toInt()), () {
            processEvent(newEvent, delayedIndex);
          });
          eventIndex++;
          if (eventIndex >= videoReplayService.events.length) {
            break;
          }
          nextEvent = videoReplayService.events[eventIndex];
          nextTimeDifference =
              (gameStartTimestamp - nextEvent.timestamp).abs() / Time.Thousand;
        }
      }
      timer++;
    } else {
      pauseReplay();
    }
  }

  ReplayEvent cloneEvent(ReplayEvent event) {
    return ReplayEvent(
        action: event.action,
        timestamp: event.timestamp,
        imageData1: event.imageData1,
        imageData2: event.imageData2,
        cheatData: event.cheatData);
  }

  Future<void> startReplay() async {
    if (isCheatModeOn && currentCheatEvent != null) {
      final ui.Image image1 =
          await convertBase64toImage(currentCheatEvent!.imageData1!);
      final ui.Image image2 =
          await convertBase64toImage(currentCheatEvent!.imageData2!);
      final ui.Image cheatImage =
          await convertBase64toImage(currentCheatEvent!.cheatData!);
      startCheatMode(image1, image2, cheatImage);
    }
  }

  void pauseReplay() {
    if (isCheatModeOn) {
      cheatInterval?.cancel();
      cheatInterval = null;
    }
  }

  void restartReplay() {
    eventIndex = videoReplayService.events
        .indexWhere((ReplayEvent element) => element.action == 'gameStart');
    timer = 0;
    cheatInterval?.cancel();
    cheatInterval = null;
    isCheatModeOn = false;
    clearAllIntervals();
    initCanvas();
  }

  Future<void> seekToProgress(int progress) async {
    if (videoReplayService.snapshots.isNotEmpty &&
        videoReplayService.events.isNotEmpty) {
      GameStateSnapshot closestState = videoReplayService.snapshots[progress];
      // closes timestamp is Max integer
      int closestTimestamp = 2147483647;
      timer = progress;
      clearAllIntervals();
      if (currentCheatEvent != null &&
          currentCheatEvent!.timestamp > closestTimestamp) {
        cheatInterval?.cancel();
        cheatInterval = null;
        isCheatModeOn = false;
      }

      findIndicesAfterDifference(progress);

      if (closestState != null) {
        currentStateImage1 = await decodeImageFromList(const Base64Decoder()
            .convert(closestState.imageData1.split(',')[1]));
        currentEventImage1 = currentStateImage1;
        currentStateImage2 = await decodeImageFromList(const Base64Decoder()
            .convert(closestState.imageData2.split(',')[1]));
        currentEventImage2 = currentStateImage2;
        setState(() {});
      }
    }
  }

  void setPlaybackRate(int rate) {
    currentPlaybackRate = rate;
  }

  void findIndicesAfterDifference(int timestamp) {
    int boundaryTimestamp =
        videoReplayService.events[0].timestamp + timestamp * 1000;
    for (int i = 0; i < videoReplayService.events.length; i++) {
      if (videoReplayService.events[i].timestamp > boundaryTimestamp) {
        eventIndex = i;
        return;
      }
    }
    eventIndex = 0;
  }

  Future<void> processEvent(ReplayEvent event, int index) async {
    switch (event.action) {
      case 'diffFound':
        audioPlayer.pause();
        audioPlayer.play(AssetSource('audio/valid_sound.mp3'));
        final ui.Image image1 = await decodeImageFromList(
            const Base64Decoder().convert(event.imageData1!.split(',')[1]));
        final ui.Image image2 = await decodeImageFromList(
            const Base64Decoder().convert(event.imageData2!.split(',')[1]));
        flashDifferenceFound(image1, image2, index);
        break;
      case 'error':
        audioPlayer.play(AssetSource('audio/invalid_sound.mp3'));
        showError(event);
        break;
      case 'startCheatMode':
        isCheatModeOn = true;
        final ui.Image image1 = await convertBase64toImage(event.imageData1!);
        final ui.Image image2 = await convertBase64toImage(event.imageData2!);
        final ui.Image cheatImage =
            await convertBase64toImage(event.cheatData!);
        currentCheatEvent = event;
        startCheatMode(image1, image2, cheatImage);
        break;
      case 'endCheatMode':
        isCheatModeOn = false;
        cheatInterval?.cancel();
        cheatInterval = null;
        currentCheatEvent = null;
        setState(() {});
        break;
      case 'cheatModeModified':
        if (isCheatModeOn) {
          cheatInterval?.cancel();
          cheatInterval = null;
          final ui.Image image1 = await convertBase64toImage(event.imageData1!);
          final ui.Image image2 = await convertBase64toImage(event.imageData2!);
          final ui.Image cheatImage =
              await convertBase64toImage(event.cheatData!);
          startCheatMode(image1, image2, cheatImage);
        }
        break;
      case 'hint':
        final ui.Image image1 = await convertBase64toImage(event.imageData1!);
        final ui.Image image2 = await convertBase64toImage(event.imageData2!);
        flashHint(image1, image2);
        break;
      case 'diffFoundEnd':
        break;
      default:
        break;
    }
  }

  void flashHint(ui.Image image1, ui.Image image2) {
    currentEventImage1 = image1;
    currentEventImage1 = image2;
    int flashInterval = 50;
    bool visible = true;
    Timer intervalToAdd = Timer.periodic(
        Duration(milliseconds: (flashInterval / currentPlaybackRate).round()),
        (Timer timer) {
      if (visible) {
        currentEventImage1 = image1;
        currentEventImage2 = image2;
      } else {
        currentEventImage1 = currentStateImage1;
        currentEventImage2 = currentStateImage2;
      }
      visible = !visible;
      setState(() {});
    });

    Timer endInterval = Timer(
        Duration(milliseconds: (1000 / currentPlaybackRate).round()), () async {
      intervalToAdd.cancel();
      if (!visible) {
        currentEventImage1 = currentStateImage1;
        currentEventImage2 = currentStateImage2;

        setState(() {});
      }
    });

    allFlashIntervals.add(intervalToAdd);
    allFlashIntervals.add(endInterval);
  }

  void startCheatMode(ui.Image image1, ui.Image image2, ui.Image cheatImage) {
    int flashInterval = 125;
    bool visible = true;
    cheatInterval = Timer.periodic(
        Duration(milliseconds: (flashInterval / currentPlaybackRate).round()),
        (Timer timer) {
      if (visible) {
        currentEventImage1 = image1;
        currentEventImage2 = image2;
      } else {
        currentEventImage1 = cheatImage;
        currentEventImage2 = cheatImage;
      }
      visible = !visible;
      setState(() {});
    });
  }

  Future<void> showError(ReplayEvent event) async {
    final ui.Image image1 = await convertBase64toImage(event.imageData1!);
    final ui.Image image2 = await convertBase64toImage(event.imageData2!);
    currentEventImage1 = image1;
    currentEventImage2 = image2;
    setState(() {});
    Timer(Duration(milliseconds: (1000 / currentPlaybackRate).round()),
        () async {
      currentEventImage1 = currentStateImage1;
      currentEventImage2 = currentStateImage2;
      setState(() {});
    });
  }

  void flashDifferenceFound(ui.Image image1, ui.Image image2, int index) {
    currentEventImage1 = image1;
    currentEventImage2 = image2;
    int flashInterval = 50;
    bool visible = true;
    Timer intervalToAdd = Timer.periodic(
        Duration(milliseconds: (flashInterval / currentPlaybackRate).round()),
        (Timer timer) {
      if (visible) {
        currentEventImage1 = image1;
        currentEventImage2 = image2;
      } else {
        currentEventImage1 = currentStateImage1;
        currentEventImage2 = currentStateImage2;
      }
      visible = !visible;
      setState(() {});
    });
    ReplayEvent? nextDiffFoundEndEvent =
        getNextDiffFoundEndEventBasedOnCurrentIndex(index);
    Timer endInterval = Timer(
        Duration(milliseconds: (500 / currentPlaybackRate).round()), () async {
      intervalToAdd.cancel();
      if (nextDiffFoundEndEvent != null) {
        currentEventImage1 =
            await convertBase64toImage(nextDiffFoundEndEvent.imageData1!);
        currentEventImage2 =
            await convertBase64toImage(nextDiffFoundEndEvent.imageData2!);
        currentStateImage1 = currentEventImage1;
        currentStateImage2 = currentEventImage2;
        setState(() {});
      }
    });

    allFlashIntervals.add(intervalToAdd);
    allFlashIntervals.add(endInterval);
  }

  void clearAllIntervals() {
    for (int i = 0; i < allFlashIntervals.length; i++) {
      allFlashIntervals[i].cancel();
    }
    allFlashIntervals.clear();
  }

  ReplayEvent? getNextDiffFoundEndEventBasedOnCurrentIndex(int index) {
    for (int i = index; i < videoReplayService.events.length; i++) {
      if (videoReplayService.events[i].action == 'diffFoundEnd') {
        return videoReplayService.events[i];
      }
    }
    return null;
  }

  Future<ui.Image> convertBase64toImage(String base64String) async {
    return await decodeImageFromList(
        const Base64Decoder().convert(base64String.split(',')[1]));
  }
}

class Time {
  static const int Thousand = 1000;
}

class MyCanvasPainter extends CustomPainter {
  final ui.Image imageData;

  MyCanvasPainter(this.imageData);

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawImage(
      imageData,
      Offset.zero,
      Paint(),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return true;
  }
}
