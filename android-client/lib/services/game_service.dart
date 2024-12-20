import 'dart:async';
import 'dart:math';
import 'dart:typed_data';

import 'package:android_client/classes/Vec2.dart';
import 'package:android_client/classes/difference_try.dart';
import 'package:android_client/classes/differences_hashmap.dart';
import 'package:android_client/classes/end_Game.dart';
import 'package:android_client/classes/game_constants.dart';
import 'package:android_client/classes/game_data.dart';
import 'package:android_client/classes/game_room.dart';
import 'package:android_client/classes/replay.dart';
import 'package:android_client/classes/user_game.dart';
import 'package:android_client/services/remote_games_manager_service.dart';
import 'package:android_client/services/socket_service.dart';
import 'package:android_client/services/video_replay_service.dart';
import 'package:http/http.dart' as http;

class HintData {
  String imageData;
  bool left;
  HintData({required this.imageData, required this.left});
}

class GameService {
  StreamController<bool> gameExistsController = StreamController<bool>();
  Stream<bool> get gameExists$ => gameExistsController.stream;

  StreamController<int> timePositionController = StreamController<int>();
  Stream<int> get timePosition$ => timePositionController.stream;

  StreamController<DifferenceTry> serverValidateResponseController =
      StreamController<DifferenceTry>();
  Stream<DifferenceTry> get serverValidateResponse$ =>
      serverValidateResponseController.stream;

  StreamController<int> totalDifferencesFoundController =
      StreamController<int>();
  Stream<int> get totalDifferencesFound$ =>
      totalDifferencesFoundController.stream;

  StreamController<int> userDifferencesFoundController =
      StreamController<int>();
  Stream<int> get userDifferencesFound$ =>
      userDifferencesFoundController.stream;

  StreamController<int> timerController = StreamController<int>();
  Stream<int> get timer$ => timerController.stream;

  StreamController<EndGame> gameFinishedController =
      StreamController<EndGame>();
  Stream<EndGame> get gameFinished$ => gameFinishedController.stream;

  StreamController<GameRoom> gameRoomController = StreamController<GameRoom>();
  Stream<GameRoom> get gameRoom$ => gameRoomController.stream;

  StreamController<GameData> gameDataController = StreamController<GameData>();
  Stream<GameData> get gameData$ => gameDataController.stream;

  StreamController<HintData> hintController = StreamController<HintData>();
  Stream<HintData> get hint$ => hintController.stream;

  StreamController<bool> gameDeletedController = StreamController<bool>();
  Stream<bool> get gameDeleted$ => gameDeletedController.stream;

  StreamController<String> abandonedController = StreamController<String>();
  Stream<String> get abandoned$ => abandonedController.stream;

  StreamController<bool> cheatModeResponseController = StreamController<bool>();
  Stream<bool> get cheatModeResponse$ => cheatModeResponseController.stream;

  late GameRoom gameRoom;
  late List<GameData> slides;
  late Map<String, List<DifferencesHashMap>> differencesHashMap =
      <String, List<DifferencesHashMap>>{};
  late GameData gameData;
  late String username;
  late String gameMode;
  Map<String, List<Uint8List>> imagesData = <String, List<Uint8List>>{};
  late GameConstants gameConstants;
  bool canSendValidate = true;
  final VideoReplayService videoReplayService = VideoReplayService();

  final SocketService socketService = SocketService();
  final RemoteGamesManagerService _remoteGamesManagerService =
      RemoteGamesManagerService();
  static final GameService _instance = GameService._internal();

  factory GameService() {
    return _instance;
  }

  GameService._internal();

  void getConstant() {
    gameConstants = gameRoom.gameConstants!;
  }

  bool isLimitedTimeMode() {
    return gameMode == 'mode Temps Limité';
  }

  Future<void> startGame(GameRoom gameRoom, String username) async {
    this.gameRoom = gameRoom;
    this.username = username;
    gameMode = gameRoom.gameMode;
    gameData = await getGameData(gameRoom.userGame.gameName!);
    if (gameRoom.userGame.chosenDifference != -1) {
      gameData.differenceMatrix = gameData
          .differenceHashMap?[gameRoom.userGame.chosenDifference]
          .differenceMatrix;
    }
    gameRoomController.add(gameRoom);
    if (gameRoom.userGame.creator == username) {
      socketService.send('start', gameRoom.roomId);
    }
    if (gameMode == 'mode Temps Limité') {
      slides.removeWhere((GameData slide) => slide.name == gameData.name);
      gameDeletedSocket();
    }
    // Handle Message
    handleSocket();
  }

  Future<void> observeGame(GameRoom gameRoom, String username) async {
    this.gameRoom = gameRoom;
    this.username = username;
    gameMode = gameRoom.gameMode;
    gameData = await getGameData(gameRoom.userGame.gameName!);
    gameRoomController.add(gameRoom);
    if (gameRoom.userGame.chosenDifference != -1) {
      if (gameData.differenceHashMap == null) {
        _remoteGamesManagerService.getGame(gameData.name).then((GameData game) {
          gameData.differenceHashMap = game.differenceHashMap;
          gameData.differenceMatrix = gameData
              .differenceHashMap![gameRoom.userGame.chosenDifference]
              .differenceMatrix;
        });
      } else {
        gameData.differenceMatrix = gameData
            .differenceHashMap![gameRoom.userGame.chosenDifference]
            .differenceMatrix;
      }
    }
    if (gameMode == 'mode Temps Limité') {
      slides.removeWhere((GameData slide) => slide.name == gameData.name);
      gameDeletedSocket();
    }
    // Handle Message
    handleSocket();
    socketService.send('observingGame', gameRoom.toJson());
  }

  void sendHint(String imageData, String? receiver, bool left) {
    socketService.send('hint', <String, Object?>{
      "imageData": imageData,
      "sender": username,
      "receiver": receiver,
      "roomId": gameRoom.roomId,
      "left": left
    });
  }

  void gameDeletedSocket() {
    socketService.on('gameCanceled', (data) {
      slides.removeWhere((GameData slide) => slide.name == data);
    });
  }

  void sendServerDifference(List<List<int>> differenceMatrix, String username) {
    if (this.username == username) {
      socketService.send('sendDifference', <String, Object>{
        "differenceMatrix": differenceMatrix,
        "roomId": gameRoom.roomId
      });
    }
  }

  void turnOffWaitingSocket() {
    socketService.off('gameInfo');
    socketService.off('gameCreated');
    socketService.off('playerAccepted');
    socketService.off('playerRejected');
    socketService.off('gameCanceled');
  }

  void turnOffGameSocket() {
    socketService.off('validated');
    socketService.off('GameFinished');
    socketService.off('abandoned');
    socketService.off('timer');
    socketService.off('cheatMode');
    socketService.off('gameFinished');
    socketService.off('nextGame');
    socketService.off('observingGame');
    socketService.off('hint');
  }

  void getAllGames() async {
    _remoteGamesManagerService.getAllRemoteGames().then((List<GameData> games) {
      games.forEach((GameData game) => _remoteGamesManagerService
              .getGame(game.name)
              .then((GameData gameData) async {
            game.differenceHashMap = gameData.differenceHashMap;
            game.differenceMatrix = gameData.differenceMatrix;
            final Uint8List imageFuture1 = await getImageData(game.image1url);
            final Uint8List imageFuture2 = await getImageData(game.image2url);
            imagesData.putIfAbsent(
                game.name, () => <Uint8List>[imageFuture1, imageFuture2]);
            slides = games;
          }));
    });
  }

  Future<Uint8List> getImageData(String imageUrl) async {
    final http.Response imageResponse = await http
        .get(Uri.parse(_remoteGamesManagerService.getReplacedUrl(imageUrl)));
    return imageResponse.bodyBytes;
  }

  void abortGame() {
    if (gameRoom.userGame.creator == username) {
      socketService.send('abortGameCreation', gameRoom.roomId);
    } else {
      socketService.send('leaveGame',
          <String, String>{"roomId": gameRoom.roomId, "username": username});
    }
  }

  void sendServerValidate(Vec2 differencePos) {
    if (canSendValidate) {
      canSendValidate = false;
      socketService.send('validate', <String, Object>{
        "differencePos": differencePos.toJson(),
        "roomId": gameRoom.roomId,
        "username": username,
        "validated": true
      });
    }
  }

  List<List<int>>? findDifference(Vec2 differencePos) {
    for (DifferencesHashMap differenceHashMap in gameData.differenceHashMap!) {
      print(gameData.name);
      if (differenceHashMap.differenceMatrix[differencePos.y.toInt()]
              [differencePos.x.toInt()] !=
          -1) {
        return differenceHashMap.differenceMatrix;
      }
    }
    return null;
  }

  void changeTime(int number) {
    socketService.send('changeTime',
        <String, Object>{"number": number, "roomId": gameRoom.roomId});
  }

  void reset() {
    // TODO: choose what to reset
  }

  void abandonGame() {
    if (gameRoom.userGame.currentPlayers
        .where((CurrentPlayer user) => user.username == username)
        .any((CurrentPlayer user) => true)) {
      socketService.send('abandoned',
          <String, String>{"roomId": gameRoom.roomId, "username": username});
    } else {
      socketService.send('observerLeaveGame',
          <String, String>{"roomId": gameRoom.roomId, "username": username});
    }
  }

  void loadNextGame() {
    if (slides.isNotEmpty && gameRoom.userGame.creator == username) {
      GameData game = slides[generateRandomNumber(slides.length)];
      gameRoom.userGame.gameName = game.name;
      gameRoom.userGame.chosenDifference =
          generateRandomNumber(game.nbDifference);
      socketService.send('nextGame', gameRoom.toJson());
    } else if (slides.isEmpty) {
      socketService.send('endGame', gameRoom.roomId);
    }
  }

  void isCheatModeOn() {
    if (gameRoom.gameConstants?.cheatMode == false) {
      cheatModeResponseController.add(false);
    }
    socketService.send('cheatMode', gameRoom.roomId);
  }

  Future<GameData> getGameData(String gameName) async {
    if (slides.isEmpty) {
      GameData g = await _remoteGamesManagerService.getGame(gameName);
      slides.add(g);
      return g;
    }
    try {
      return slides.firstWhere((GameData game) => game.name == gameName);
    } catch (e) {
      GameData g = await _remoteGamesManagerService.getGame(gameName);
      slides.add(g);
      return g;
    }
  }

  void sendMatrixToServer(List<List<int>> differenceMatrix, String username) {
    if (this.username == username) {
      socketService.send('sendDifference', <String, Object>{
        "differenceMatrix": differenceMatrix,
        "roomId": gameRoom.roomId
      });
    }
  }

  void handleSocket() {
    socketService.on('started', (data) {
      gameRoomController.add(gameRoom);
      if (gameRoom.userGame.gameName != gameData.name) {
        getGameData(gameRoom.userGame.gameName!).then((GameData game) {
          gameData = game;
          gameData.differenceMatrix = gameData
              .differenceHashMap?[gameRoom.userGame.chosenDifference]
              .differenceMatrix;
          gameDataController.add(gameData);
          videoReplayService.setGameData(gameData);
        });
      }
      videoReplayService.setGameData(gameData);
      if (gameMode == 'mode Temps Limité') return;
      videoReplayService.recordEvent(ReplayEvent(
          action: 'gameStart',
          imageData1: '',
          imageData2: '',
          timestamp: DateTime.now().millisecondsSinceEpoch));
    });

    socketService.on('nextGame', (data) {
      if (data == null) {
        print('No more games');
        return;
      }
      gameRoom = GameRoom.fromJson(data);
      final int slideIndex = slides.indexWhere(
          (GameData game) => game.name == gameRoom.userGame.gameName);
      if (slideIndex != -1) {
        final GameData slide = slides.removeAt(slideIndex);
        gameData = slide;
        gameData.differenceMatrix = gameData
            .differenceHashMap?[gameRoom.userGame.chosenDifference]
            .differenceMatrix;
        gameRoomController.add(gameRoom);
        gameDataController.add(gameData);
      } else {
        print('No more games');
      }
    });

    socketService.on('hint', (data) {
      if (data['receiver'] == username ||
          (data['receiver'] == null &&
              !gameRoom.userGame.observers!
                  .where((Observer player) => player.username == username)
                  .any((Observer player) => true)) ||
          data['sender'] == username) {
        hintController.add(HintData(
            imageData: data['imageData'], left: data['left'] ?? false));
      }
    });

    socketService.on('observingGame', (data) {
      final GameRoom gameRoomSocket = GameRoom.fromJson(data);
      gameRoom.userGame.observers = gameRoomSocket.userGame.observers;
      gameRoomController.add(gameRoom);
    });

    socketService.on('validated', (data) {
      DifferenceTry differenceTry = DifferenceTry.fromJson(data);
      if (differenceTry.validated) {
        gameRoom.userGame.nbDifferenceFound += 1;
        totalDifferencesFoundController
            .add(gameRoom.userGame.nbDifferenceFound);

        gameRoom.userGame.differenceFoundByPlayers =
            differenceTry.playerDifferences;
      }
      serverValidateResponseController.add(differenceTry);
    });

    socketService.on('cheatMode', (data) {
      cheatModeResponseController.add(data);
    });

    socketService.on('GameFinished', (data) {
      EndGame endGame = EndGame.fromJson(data);
      gameFinishedController.add(endGame);
      if (gameMode == 'mode Temps Limité') return;
      videoReplayService.recordEvent(ReplayEvent(
          action: 'gameEnd',
          imageData1: '',
          imageData2: '',
          timestamp: DateTime.now().millisecondsSinceEpoch));
    });

    socketService.on('abandoned', (data) {
      gameRoom = GameRoom.fromJson(data['gameRoom']);
      // WE DON'T NEED THIS BUT I WILL LEAVE IT HERE TO MAKE SURE
      gameRoomController.add(gameRoom);
      abandonedController.add(data['username']);
      // if (gameMode == 'mode Temps Limité') {
      //   limitedTimeGameAbandoned(gameRoom);
      // }
    });

    socketService.on('timer', (data) {
      gameRoom.userGame.timer = data.toInt();
      timerController.add(data.toInt());
      canSendValidate = true;
    });
  }

  // void limitedTimeGameAbandoned(GameRoom gameRoom) {
  //   this.gameRoom = gameRoom;
  //   gameRoomController.add(gameRoom);
  // }

  int generateRandomNumber(int nbOfDifferences) {
    Random random = Random();
    return random.nextInt(nbOfDifferences);
  }

  void closeStreams() {
    turnOffGameSocket();
    gameExistsController.close();
    timePositionController.close();
    serverValidateResponseController.close();
    totalDifferencesFoundController.close();
    userDifferencesFoundController.close();
    timerController.close();
    gameFinishedController.close();
    gameRoomController.close();
    gameDeletedController.close();
    abandonedController.close();
    cheatModeResponseController.close();
    gameDataController.close();
    hintController.close();
    gameExistsController = StreamController<bool>();
    timePositionController = StreamController<int>();
    serverValidateResponseController = StreamController<DifferenceTry>();
    totalDifferencesFoundController = StreamController<int>();
    userDifferencesFoundController = StreamController<int>();
    timerController = StreamController<int>();
    gameFinishedController = StreamController<EndGame>();
    gameRoomController = StreamController<GameRoom>();
    gameDeletedController = StreamController<bool>();
    abandonedController = StreamController<String>();
    cheatModeResponseController = StreamController<bool>();
    gameDataController = StreamController<GameData>();
    hintController = StreamController<HintData>();
  }
}
