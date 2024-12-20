import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:android_client/classes/Vec2.dart';
import 'package:android_client/classes/difference_data.dart';
import 'package:android_client/services/game_service.dart';
import 'package:android_client/services/video_replay_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';

class PlayAreaService with ChangeNotifier {
  bool _isCheatModeOn = false;
  bool _isHintModeOn = false;
  final int _speed = 1;
  int errorCanvas = 1;
  Timer? _hintTimer;
  Timer? _hintFlashTimer;
  Timer? _cheatTimer;
  Timer? _cheatFlashTimer;
  Timer? _errorTimer;
  bool _isFlashing = false;
  Timer? _correctFlashTimer;
  Timer? _correctTimer;
  bool _isFlashCheatModeOn = false;
  bool get isFlashCheatModeOn => _isFlashCheatModeOn;
  bool get isCheatModeOn => _isCheatModeOn;
  bool get isHintModeOn => _isHintModeOn;
  int get speed => _speed;
  Uint8List? cheatImageData;
  bool askingServerCheatMode = false;
  bool playerIsAllowedToClick = true;
  bool isDrawing = false;
  int canvasDrawing = 1;
  int hintCanvas = 1;
  Offset? startPoint;
  Offset? endPoint;
  bool isObserver = false;
  Uint8List? hintImageData;
  String? selectedPlayer;
  String? color;
  Vec2? _lastErrorLocation;
  List<DifferencesData> foundDifferences = [];
  List<Vec2> revealedDifferences = [];
  Vec2? get lastErrorLocation => _lastErrorLocation;
  bool get isFlashing => _isFlashing;
  final GameService _gameService = GameService();
  final StreamController<Vec2> _errorEventController =
      StreamController<Vec2>.broadcast();
  Stream<Vec2> get onError => _errorEventController.stream;
  late Function(String val)? removeDifference;
  late Function()? endCheatMode;

  final VideoReplayService videoReplayService = VideoReplayService();

  static final PlayAreaService _instance = PlayAreaService._internal();

  factory PlayAreaService() {
    return _instance;
  }

  PlayAreaService._internal();

  void startFlashing(List<List<int>> differenceMatrix, String username) {
    _isFlashing = true;
    for (int y = 0; y < differenceMatrix.length; y++) {
      for (int x = 0; x < differenceMatrix[y].length; x++) {
        if (differenceMatrix[y][x] != -1) {
          revealedDifferences.add(Vec2(x.toDouble(), y.toDouble()));
        }
      }
    }
    _correctTimer?.cancel();
    _correctFlashTimer =
        Timer.periodic(const Duration(milliseconds: 50), (Timer timer) {
      _isFlashing = !_isFlashing;
      notifyListeners();
    });
    _correctTimer = Timer(const Duration(milliseconds: 500), () {
      _isFlashing = false;
      _correctFlashTimer?.cancel();
      _correctFlashTimer = null;
      removeDifference!(username);
      playerIsAllowedToClick = true;
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _isFlashing = false;
    _correctFlashTimer?.cancel();
    _correctFlashTimer = null;
    playerIsAllowedToClick = true;
    _errorTimer?.cancel();
    _cheatFlashTimer?.cancel();
    _cheatFlashTimer = null;
    _isFlashCheatModeOn = false;
    _cheatTimer?.cancel();
    _cheatTimer = null;
    _hintFlashTimer?.cancel();
    _hintFlashTimer = null;
    _hintTimer?.cancel();
    _hintTimer = null;
    revealedDifferences.clear();
    foundDifferences.clear();
    _errorEventController.close();
    isObserver = false;
    selectedPlayer = null;
    cheatImageData = null;
  }

  void updateSelectedPlayer(String? newValue) {
    selectedPlayer = newValue;
    notifyListeners();
  }

  void signalError(Vec2? location, int canvasId) {
    errorCanvas = canvasId;
    _lastErrorLocation = location;
    notifyListeners();
    _errorTimer?.cancel();
    _errorTimer = Timer(const Duration(milliseconds: 1000), () {
      _lastErrorLocation = null;
      playerIsAllowedToClick = true;
      notifyListeners();
    });
  }

  Future<void> initCheatImageData() async {
    if (cheatImageData != null) return;
    Size canvasSize = const Size(640, 480);

    final ui.PictureRecorder pictureRecorder = ui.PictureRecorder();
    final ui.Canvas canvas = Canvas(pictureRecorder);
    for (int i = 0; i < _gameService.gameData.differenceMatrix!.length; i++) {
      for (int j = 0;
          j < _gameService.gameData.differenceMatrix![i].length;
          j++) {
        if (_gameService.gameData.differenceMatrix![i][j] != -1) {
          _drawFlashingRect(canvas, canvasSize,
              Offset(j.toDouble(), i.toDouble()), '#fc5603', null);
        }
      }
    }

    final ui.Image image = await pictureRecorder.endRecording().toImage(
          640,
          480,
        );

    final ByteData? byteData =
        await image.toByteData(format: ui.ImageByteFormat.png);
    cheatImageData = byteData!.buffer.asUint8List();
  }

  void _drawFlashingRect(
      Canvas canvas, Size size, Offset offset, String color, double? opacity) {
    final Size cellSize = Size(
        size.width / _gameService.gameData.differenceMatrix![0].length,
        size.height / _gameService.gameData.differenceMatrix!.length);

    canvas.drawRect(offset & cellSize,
        Paint()..color = colorFromHex(color)!.withOpacity(opacity ?? 0.5));
  }

  void cheatMode() {
    _isCheatModeOn = !_isCheatModeOn;
    if (_isCheatModeOn) {
      _cheatFlashTimer?.cancel();
      _cheatTimer?.cancel();
      _cheatFlashTimer =
          Timer.periodic(const Duration(milliseconds: 125), (Timer timer) {
        _isFlashCheatModeOn = !_isFlashCheatModeOn;
        notifyListeners();
      });
    } else {
      _cheatFlashTimer?.cancel();
      _cheatFlashTimer = null;
      _isFlashCheatModeOn = false;
      _cheatTimer?.cancel();
      endCheatMode!();
      _cheatTimer = null;
    }
  }

  void hintMode() {
    _isHintModeOn = !_isHintModeOn;
    if (_isHintModeOn) {
      _hintFlashTimer?.cancel();
      _hintTimer?.cancel();
      _hintFlashTimer =
          Timer.periodic(const Duration(milliseconds: 125), (Timer timer) {
        _isHintModeOn = !_isHintModeOn;
        notifyListeners();
      });
      _hintTimer = Timer(const Duration(seconds: 2), () {
        _isHintModeOn = false;
        _hintFlashTimer?.cancel();
        _hintFlashTimer = null;
        notifyListeners();
      });
    } else {
      _hintFlashTimer?.cancel();
      _hintFlashTimer = null;
      _hintTimer?.cancel();
      _hintTimer = null;
    }
  }
}
