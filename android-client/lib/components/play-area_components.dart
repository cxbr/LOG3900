import 'dart:async';
import 'dart:convert';
import 'dart:ui' as ui;

import 'package:android_client/classes/Vec2.dart';
import 'package:android_client/classes/difference_data.dart';
import 'package:android_client/classes/difference_try.dart';
import 'package:android_client/classes/game_data.dart';
import 'package:android_client/classes/game_room.dart';
import 'package:android_client/classes/replay.dart';
import 'package:android_client/classes/user_game.dart';
import 'package:android_client/services/game_service.dart';
import 'package:android_client/services/play-area_service.dart';
import 'package:android_client/services/remote_games_manager_service.dart';
import 'package:android_client/services/video_replay_service.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import 'package:image/image.dart' as imageLib;
import 'package:provider/provider.dart';

typedef MyBuilder = void Function(
    BuildContext context, void Function() updatePlayArea);

class PlayAreaComponent extends StatefulWidget {
  final Function isObserverCallback;

  const PlayAreaComponent({
    super.key,
    required this.isObserverCallback,
  });

  @override
  PlayAreaComponentState createState() => PlayAreaComponentState();
}

class PlayAreaComponentState extends State<PlayAreaComponent> {
  late GameData gameData;
  bool _isLoading = true;
  AudioPlayer audioPlayer = AudioPlayer();
  PlayAreaService? playAreaService;
  Timer? hintTimer;
  bool canDraw = true;
  Timer? recordStateTimer;
  final GameService _gameService = GameService();
  final RemoteGamesManagerService remoteGamesManagerService =
      RemoteGamesManagerService();
  final VideoReplayService videoReplayService = VideoReplayService();
  StreamSubscription<GameData>? gameDataSubscription;
  StreamSubscription<HintData>? hintDataSubscription;
  GlobalKey canvas1Key = GlobalKey();
  GlobalKey canvas2Key = GlobalKey();
  late Uint8List imageData1;
  late Uint8List imageData2;

  @override
  void initState() {
    super.initState();
    initGamesList();
    subscribeServerResponse();
    subscribeHintMode();

    if (_gameService.gameMode == 'mode Temps Limité') {
      setState(() {
        drawLimitedTimeDifferences();
      });
      gameDataSubscription = _gameService.gameData$.listen((GameData data) {
        if (playAreaService != null) {
          playAreaService!.foundDifferences.clear();
        }
        setState(() {
          gameData = data;
          imageData1 = _gameService.imagesData[gameData.name]![0];
          imageData2 = _gameService.imagesData[gameData.name]![1];
          drawLimitedTimeDifferences();
        });
      });
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.isObserverCallback(playAreaService!.isObserver);
    });
  }

  Future<void> clearReplayInterval() async {
    recordStateTimer?.cancel();
    if (_gameService.gameMode == 'mode Temps Limité') return;
    final GameStateSnapshot snapshot = GameStateSnapshot(
      gameRoom: GameRoom.fromJson(_gameService.gameRoom.toJson()),
      imageData1: await takeScreenshot1(),
      imageData2: await takeScreenshot2(),
    );
    videoReplayService.recordState(snapshot);
  }

  Future<void> endCheatMode() async {
    if (_gameService.gameMode == 'mode Temps Limité') return;
    videoReplayService.recordEvent(ReplayEvent(
        action: 'endCheatMode',
        imageData1: await takeScreenshot1(),
        imageData2: await takeScreenshot2(),
        timestamp: DateTime.now().millisecondsSinceEpoch));
  }

  Future<void> saveGameState() async {
    if (_gameService.gameMode == 'mode Temps Limité') return;
    if (recordStateTimer != null) return;
    if (canvas1Key.currentContext == null) return;
    if (canvas2Key.currentContext == null) return;
    if (imageData1 == null) return;
    final GameStateSnapshot snapshot = GameStateSnapshot(
      gameRoom: GameRoom.fromJson(_gameService.gameRoom.toJson()),
      imageData1: await takeScreenshot1(),
      imageData2: await takeScreenshot2(),
    );
    videoReplayService.recordState(snapshot);
    recordStateTimer =
        Timer.periodic(const Duration(milliseconds: 1000), (Timer timer) async {
      if (canvas1Key.currentContext == null) return;
      if (canvas2Key.currentContext == null) return;
      final GameStateSnapshot snapshot = GameStateSnapshot(
        gameRoom: GameRoom.fromJson(_gameService.gameRoom.toJson()),
        imageData1: await takeScreenshot1(),
        imageData2: await takeScreenshot2(),
      );
      videoReplayService.recordState(snapshot);
    });
  }

  Future<String> takeScreenshot1() async {
    RenderBox renderBox =
        canvas1Key.currentContext!.findRenderObject() as RenderBox;
    Size size = renderBox.size;

    ui.PictureRecorder recorder = ui.PictureRecorder();
    Canvas canvas = Canvas(recorder);

    MyCanvasPainter painter =
        MyCanvasPainter(imageData1, 1, playAreaService!, gameData);
    painter.paint(canvas, size);

    ui.Picture picture = recorder.endRecording();
    ui.Image image =
        await picture.toImage(size.width.toInt(), size.height.toInt());

    await Future.delayed(const Duration(milliseconds: 20));

    ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    Uint8List pngBytes = byteData!.buffer.asUint8List();

    String base64String = "data:image/png;base64,${base64Encode(pngBytes)}";
    return base64String;
  }

  Future<String> takeScreenshot2() async {
    RenderBox renderBox =
        canvas2Key.currentContext!.findRenderObject() as RenderBox;
    Size size = renderBox.size;

    ui.PictureRecorder recorder = ui.PictureRecorder();
    Canvas canvas = Canvas(recorder);

    MyCanvasPainter painter =
        MyCanvasPainter(imageData2, 2, playAreaService!, gameData);
    painter.paint(canvas, size);

    ui.Picture picture = recorder.endRecording();
    ui.Image image =
        await picture.toImage(size.width.toInt(), size.height.toInt());

    await Future.delayed(const Duration(milliseconds: 20));

    ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    Uint8List pngBytes = byteData!.buffer.asUint8List();

    String base64String = "data:image/png;base64,${base64Encode(pngBytes)}";
    return base64String;
  }

  void subscribeHintMode() {
    hintDataSubscription = _gameService.hint$.listen((HintData data) async {
      playAreaService?.hintImageData =
          const Base64Decoder().convert(data.imageData.split(',')[1]);
      playAreaService?.hintCanvas = data.left ? 1 : 2;
      if (_gameService.gameMode != 'mode Temps Limité') {
        if (data.left) {
          videoReplayService.recordEvent(ReplayEvent(
              action: 'hint',
              imageData1: data.imageData,
              imageData2: await takeScreenshot2(),
              timestamp: DateTime.now().millisecondsSinceEpoch));
        } else {
          videoReplayService.recordEvent(ReplayEvent(
              action: 'hint',
              imageData1: await takeScreenshot1(),
              imageData2: data.imageData,
              timestamp: DateTime.now().millisecondsSinceEpoch));
        }
      }
      playAreaService?.hintMode();
    });
  }

  @override
  void dispose() {
    audioPlayer.dispose();
    playAreaService?.dispose();
    gameDataSubscription?.cancel();
    hintDataSubscription?.cancel();
    playAreaService?.cheatImageData = null;
    videoReplayService.clearSavedStates();
    recordStateTimer?.cancel();
    recordStateTimer = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (BuildContext context) => PlayAreaService(),
      child: Column(children: [
        _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Consumer<PlayAreaService>(
                builder: (BuildContext context, PlayAreaService service,
                    Widget? child) {
                  playAreaService = service;
                  playAreaService?.removeDifference = removeDifference;
                  playAreaService?.endCheatMode = endCheatMode;
                  playAreaService?.initCheatImageData();
                  saveGameState();

                  if (_gameService.gameRoom.userGame.observers != null) {
                    playAreaService?.isObserver = _gameService
                        .gameRoom.userGame.observers!
                        .where((Observer player) =>
                            player.username == _gameService.username)
                        .any((Observer player) => true);
                    if (playAreaService!.isObserver) {
                      playAreaService?.color = _gameService
                          .gameRoom.userGame.observers!
                          .firstWhere((Observer player) =>
                              player.username == _gameService.username)
                          .color;
                    }
                  }
                  return Column(children: [
                    Row(
                      children: <Widget>[
                        Expanded(
                            child: Container(
                          width: 640,
                          height: 480,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: Colors.black, width: 3.0),
                          ),
                          child: SizedBox(
                            width: 640,
                            height: 480,
                            child: LayoutBuilder(builder: (BuildContext context,
                                BoxConstraints constraints) {
                              return GestureDetector(
                                onTapDown: (TapDownDetails details) =>
                                    mouseClickAttempt(details.localPosition, 1),
                                onPanDown: (DragDownDetails details) {
                                  if (!canDraw || !playAreaService!.isObserver)
                                    return;
                                  if (playAreaService?.startPoint != null)
                                    return;
                                  setState(() {
                                    playAreaService?.canvasDrawing = 1;
                                    playAreaService?.isDrawing = true;
                                    playAreaService?.startPoint =
                                        details.localPosition;
                                  });
                                },
                                onPanUpdate: (DragUpdateDetails details) {
                                  if (!canDraw || !playAreaService!.isObserver)
                                    return;
                                  setState(() {
                                    playAreaService?.endPoint =
                                        details.localPosition;
                                  });
                                },
                                onPanEnd: (DragEndDetails details) {
                                  if (!canDraw || !playAreaService!.isObserver)
                                    return;
                                  setState(() {
                                    playAreaService?.isDrawing = false;
                                    _exportRectangleAsImage();
                                    playAreaService?.endPoint = null;
                                    playAreaService?.startPoint = null;
                                  });
                                },
                                child: Container(
                                  key: canvas1Key,
                                  child: CustomPaint(
                                      size: const Size(640, 480),
                                      painter: MyCanvasPainter(
                                          imageData1, 1, service, gameData)),
                                ),
                              );
                            }),
                          ),
                        )),
                        const SizedBox(width: 10),
                        Expanded(
                            child: Container(
                          width: 640,
                          height: 480,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: Colors.black, width: 3.0),
                          ),
                          child: SizedBox(
                            width: 640,
                            height: 480,
                            child: LayoutBuilder(builder: (BuildContext context,
                                BoxConstraints constraints) {
                              return GestureDetector(
                                onTapDown: (TapDownDetails details) =>
                                    mouseClickAttempt(details.localPosition, 2),
                                onPanDown: (DragDownDetails details) {
                                  if (!canDraw || !playAreaService!.isObserver)
                                    return;
                                  if (playAreaService?.startPoint != null)
                                    return;
                                  setState(() {
                                    playAreaService?.canvasDrawing = 2;
                                    playAreaService?.isDrawing = true;
                                    playAreaService?.startPoint =
                                        details.localPosition;
                                  });
                                },
                                onPanUpdate: (DragUpdateDetails details) {
                                  if (!canDraw || !playAreaService!.isObserver)
                                    return;
                                  setState(() {
                                    playAreaService?.endPoint =
                                        details.localPosition;
                                  });
                                },
                                onPanEnd: (DragEndDetails details) {
                                  if (!canDraw || !playAreaService!.isObserver)
                                    return;
                                  setState(() {
                                    playAreaService?.isDrawing = false;
                                    _exportRectangleAsImage();
                                    playAreaService?.endPoint = null;
                                    playAreaService?.startPoint = null;
                                  });
                                },
                                child: Container(
                                  key: canvas2Key,
                                  child: CustomPaint(
                                      size: const Size(640, 480),
                                      painter: MyCanvasPainter(
                                          imageData2, 2, service, gameData)),
                                ),
                              );
                            }),
                          ),
                        )),
                      ],
                    )
                  ]);
                },
              ),
      ]),
    );
  }

  void _exportRectangleAsImage() async {
    if (hintTimer != null && !canDraw) return;
    if (playAreaService?.startPoint != null &&
        playAreaService?.endPoint != null) {
      canDraw = false;
      hintTimer = Timer(const Duration(seconds: 3), () {
        hintTimer?.cancel();
        hintTimer = null;
        canDraw = true;
      });
      Rect rectToExport = Rect.fromPoints(
          playAreaService!.startPoint!, playAreaService!.endPoint!);
      final ui.PictureRecorder pictureRecorder = ui.PictureRecorder();
      final ui.Canvas canvas = Canvas(pictureRecorder);
      canvas.drawRect(
          rectToExport,
          Paint()
            ..color = colorFromHex(playAreaService!.color!)!.withOpacity(0.5));

      final ui.Image image = await pictureRecorder.endRecording().toImage(
            640,
            480,
          );

      final ByteData? byteData =
          await image.toByteData(format: ui.ImageByteFormat.png);
      final Uint8List imageData = byteData!.buffer.asUint8List();
      final String base64Image =
          "data:image/png;base64,${base64Encode(imageData)}";
      _gameService.sendHint(base64Image, playAreaService?.selectedPlayer,
          playAreaService?.canvasDrawing == 1 ? true : false);
    }
  }

  void mouseClickAttempt(Offset localPosition, int canvasId) {
    if (playAreaService!.playerIsAllowedToClick &&
        !playAreaService!.isObserver) {
      bool isValidated = gameData.differenceMatrix?[localPosition.dy.toInt()]
              [localPosition.dx.toInt()] !=
          -1;
      if (isValidated) {
        _gameService
            .sendServerValidate(Vec2(localPosition.dx, localPosition.dy));
      } else {
        _errorRetroaction(Vec2(localPosition.dx, localPosition.dy), canvasId);
      }
    }
  }

  Future<void> initGamesList() async {
    gameData = _gameService.gameData;
    imageData1 = _gameService.imagesData[gameData.name]![0];
    imageData2 = _gameService.imagesData[gameData.name]![1];
    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _correctRetroaction(Vec2 localPosition, String username) async {
    playAreaService?.playerIsAllowedToClick = false;
    audioPlayer.pause();
    audioPlayer.seek(Duration.zero);
    playAreaService?.startFlashing(
        _gameService.findDifference(localPosition)!, username);
    audioPlayer.play(AssetSource('audio/valid_sound.mp3'));
    if (_gameService.gameMode == 'mode Temps Limité') return;
    videoReplayService.recordEvent(ReplayEvent(
        action: 'diffFound',
        imageData1: await takeScreenshot1(),
        imageData2: await takeScreenshot2(),
        timestamp: DateTime.now().millisecondsSinceEpoch));
  }

  Future<void> _errorRetroaction(Vec2 localPosition, int canvasId) async {
    playAreaService?.playerIsAllowedToClick = false;
    audioPlayer.pause();
    playAreaService?.signalError(localPosition, canvasId);
    audioPlayer.play(AssetSource('audio/invalid_sound.mp3'));
    if (_gameService.gameMode == 'mode Temps Limité') return;
    videoReplayService.recordEvent(ReplayEvent(
        action: 'error',
        imageData1: await takeScreenshot1(),
        imageData2: await takeScreenshot2(),
        timestamp: DateTime.now().millisecondsSinceEpoch));
  }

  Future<void> removeDifference(String username) async {
    imageLib.Image decodedImage1 = imageLib.decodeImage(imageData1)!;
    Uint8List image1Bytes = decodedImage1.getBytes();
    for (final Vec2 pos in playAreaService!.revealedDifferences) {
      gameData.differenceMatrix![pos.y.toInt()][pos.x.toInt()] = -1;
      int pixelIndex =
          ((pos.y * decodedImage1.width.toDouble() + pos.x) * 4).toInt();
      int red = image1Bytes[pixelIndex];
      int green = image1Bytes[pixelIndex + 1];
      int blue = image1Bytes[pixelIndex + 2];
      int alpha = image1Bytes[pixelIndex + 3];

      Color color = Color.fromARGB(alpha, red, green, blue);
      Offset offset = Offset(pos.x, pos.y);
      playAreaService?.foundDifferences.add(DifferencesData(
          offset: offset, color: '#${color.value.toRadixString(16)}'));
    }
    _gameService.sendMatrixToServer(gameData.differenceMatrix!, username);
    playAreaService?.revealedDifferences.clear();
    if (_gameService.gameMode == 'mode Temps Limité') {
      _gameService.loadNextGame();
    } else {
      playAreaService?.cheatImageData = null;
      playAreaService?.initCheatImageData();
    }
    playAreaService?.cheatImageData = null;
    playAreaService?.initCheatImageData();
    if (_gameService.gameMode == 'mode Temps Limité') return;
    videoReplayService.recordEvent(ReplayEvent(
        action: 'cheatModeModified',
        imageData1: await takeScreenshot1(),
        imageData2: await takeScreenshot2(),
        cheatData:
            "data:image/png;base64,${base64Encode(playAreaService!.cheatImageData!)}",
        timestamp: DateTime.now().millisecondsSinceEpoch));
    videoReplayService.recordEvent(ReplayEvent(
        action: 'diffFoundEnd',
        imageData1: await takeScreenshot1(),
        imageData2: await takeScreenshot2(),
        timestamp: DateTime.now().millisecondsSinceEpoch));
  }

  void drawLimitedTimeDifferences() {
    imageLib.Image decodedImage1 = imageLib.decodeImage(imageData1)!;
    imageLib.Image decodedImage2 = imageLib.decodeImage(imageData2)!;
    Uint8List image1Bytes = decodedImage1.getBytes();
    Uint8List image2Bytes = decodedImage2.getBytes();
    for (int i = 0; i < gameData.differenceMatrix!.length; i++) {
      for (int j = 0; j < gameData.differenceMatrix![0].length; j++) {
        if (gameData.differenceMatrix![i][j] == -1) {
          int pixelIndex =
              ((i * decodedImage1.width.toDouble() + j) * 4).toInt();
          for (int i = 0; i < 4; i++) {
            image1Bytes[pixelIndex + i] = image2Bytes[pixelIndex + i];
          }
        }
      }
    }
    imageData1 = imageLib.encodeBmp(decodedImage1);

    playAreaService?.cheatImageData = null;
    playAreaService?.initCheatImageData();
  }

  void subscribeServerResponse() {
    _gameService.serverValidateResponse$.listen((DifferenceTry difference) {
      if (difference.validated) {
        _correctRetroaction(difference.differencePos, difference.username);
      } else if (playAreaService?.lastErrorLocation != null) {
        _errorRetroaction(playAreaService!.lastErrorLocation!, 1);
      }
    });
    _gameService.cheatModeResponse$.listen((bool event) async {
      playAreaService?.askingServerCheatMode = false;
      if (event) {
        playAreaService?.cheatMode();
        videoReplayService.recordEvent(ReplayEvent(
            action: 'startCheatMode',
            imageData1: await takeScreenshot1(),
            imageData2: await takeScreenshot2(),
            cheatData:
                "data:image/png;base64,${base64Encode(playAreaService!.cheatImageData!)}",
            timestamp: DateTime.now().millisecondsSinceEpoch));
      }
    });
  }
}

class MyCanvasPainter extends CustomPainter {
  final int canvasId;
  final PlayAreaService _playAreaService;
  final GameData gameData;
  final Uint8List imageData;
  final ui.PictureRecorder pictureRecorder = ui.PictureRecorder();

  MyCanvasPainter(
      this.imageData, this.canvasId, this._playAreaService, this.gameData)
      : super(repaint: _playAreaService);

  @override
  void paint(Canvas canvas, Size size) async {
    Image.memory(imageData, gaplessPlayback: true, fit: BoxFit.cover)
        .image
        .resolve(const ImageConfiguration())
        .addListener(
      ImageStreamListener((ImageInfo imageInfo, bool synchronousCall) {
        canvas.drawImageRect(
          imageInfo.image,
          Rect.fromLTRB(0, 0, size.width, size.height),
          Rect.fromLTRB(0, 0, size.width, size.height),
          Paint(),
        );

        if (canvasId == 2) {
          for (DifferencesData differencesData
              in _playAreaService.foundDifferences) {
            _drawFlashingRect(
              canvas,
              size,
              differencesData.offset,
              differencesData.color,
              1,
            );
          }
        }

        if (_playAreaService.isHintModeOn &&
            _playAreaService.hintCanvas == canvasId) {
          Image.memory(_playAreaService.hintImageData!,
                  gaplessPlayback: true, fit: BoxFit.cover)
              .image
              .resolve(const ImageConfiguration())
              .addListener(ImageStreamListener(
                  (ImageInfo imageInfo, bool synchronousCall) {
            canvas.drawImageRect(
              imageInfo.image,
              Rect.fromLTRB(0, 0, size.width, size.height),
              Rect.fromLTRB(0, 0, size.width, size.height),
              Paint(),
            );
          }));
        }

        if (_playAreaService.isObserver &&
            _playAreaService.isDrawing &&
            _playAreaService.startPoint != null &&
            _playAreaService.endPoint != null &&
            _playAreaService.canvasDrawing == canvasId) {
          final double dx =
              _playAreaService.endPoint!.dx.clamp(Offset.zero.dx, size.width);
          final double dy =
              _playAreaService.endPoint!.dy.clamp(Offset.zero.dy, size.height);
          canvas.drawRect(
              Rect.fromPoints(_playAreaService.startPoint!, Offset(dx, dy)),
              Paint()
                ..color =
                    colorFromHex(_playAreaService.color!)!.withOpacity(0.5));
        }

        if (_playAreaService.lastErrorLocation != null &&
            _playAreaService.errorCanvas == canvasId) {
          const TextStyle textStyle =
              TextStyle(color: Colors.red, fontSize: 24);
          const TextSpan textSpan = TextSpan(text: 'Error', style: textStyle);
          final TextPainter textPainter =
              TextPainter(text: textSpan, textDirection: TextDirection.ltr);
          textPainter.layout(minWidth: 0, maxWidth: size.width);

          final Offset offset = Offset(
              _playAreaService.lastErrorLocation!.x.toDouble(),
              _playAreaService.lastErrorLocation!.y.toDouble());
          textPainter.paint(canvas, offset);
        }
        if (_playAreaService.isFlashing) {
          for (final Vec2 difference in _playAreaService.revealedDifferences) {
            _drawFlashingRect(
                canvas,
                size,
                Offset(difference.x.toDouble(), difference.y.toDouble()),
                '#08A936',
                null);
          }
        }

        if (_playAreaService.isFlashCheatModeOn) {
          Image.memory(_playAreaService.cheatImageData!,
                  gaplessPlayback: true, fit: BoxFit.cover)
              .image
              .resolve(const ImageConfiguration())
              .addListener(ImageStreamListener(
                  (ImageInfo imageInfo, bool synchronousCall) {
            canvas.drawImageRect(
              imageInfo.image,
              Rect.fromLTRB(0, 0, size.width, size.height),
              Rect.fromLTRB(0, 0, size.width, size.height),
              Paint(),
            );
          }));
        }
      }),
    );
  }

  void _drawFlashingRect(
      Canvas canvas, Size size, Offset offset, String color, double? opacity) {
    final Size cellSize = Size(
        size.width / gameData.differenceMatrix![0].length,
        size.height / gameData.differenceMatrix!.length);

    canvas.drawRect(
        offset & cellSize,
        Paint()
          ..color = colorFromHex(color)!.withOpacity(opacity ?? 0.5)
          ..style = PaintingStyle.fill
          ..blendMode = BlendMode.srcOver);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return true;
  }
}
