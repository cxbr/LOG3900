import 'dart:async';
import 'dart:typed_data';

import 'package:android_client/classes/Vec2.dart';
import 'package:flutter/material.dart';

class VideoReplayPlayAreaService with ChangeNotifier {
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
  bool isObserver = false;
  Uint8List? hintImageData;
  String? selectedPlayer;
  String? color;
  Vec2? _lastErrorLocation;
  Vec2? get lastErrorLocation => _lastErrorLocation;
  bool get isFlashing => _isFlashing;
  final StreamController<Vec2> _errorEventController =
      StreamController<Vec2>.broadcast();
  Stream<Vec2> get onError => _errorEventController.stream;
  late Function(String val)? removeDifference;
}
