import 'dart:math';

import 'package:android_client/classes/game_data.dart';
import 'package:android_client/classes/game_room.dart';
import 'package:android_client/classes/user_game.dart';
import 'package:android_client/services/remote_games_manager_service.dart';
import 'package:android_client/services/socket_service.dart';
import 'package:android_client/services/waiting_room_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class GameSetupService {
  late String username;
  late String gameMode;
  late GameRoom gameRoom;
  final String _tokenKey = 'token';
  final SocketService _socketService = SocketService();
  late WaitingRoomService waitingRoomService = WaitingRoomService();
  final RemoteGamesManagerService _remoteGamesManagerService =
      RemoteGamesManagerService();

  late List<GameData> slides = <GameData>[];

  GameSetupService(this.gameMode) {
    getAllGames();
    getUsername();
    subscribeToGameDeletedEvent();
  }

  void subscribeToGameDeletedEvent() {
    _socketService.on('gameDeletedFromDB', (data) {
      slides.removeWhere((slide) => slide.name == data);
    });
  }

  Future<void> getAllGames() async {
    slides = await _remoteGamesManagerService.getAllRemoteGames();
  }

  Future<void> getUsername() async {
    String? tokenValue =
        (await SharedPreferences.getInstance()).getString(_tokenKey);
    if (tokenValue != null) {
      username = tokenValue;
    } else {
      username = '';
    }
  }

  void initGameRoom(bool started) {
    gameRoom = GameRoom(
      userGame: UserGame(
        gameName: null,
        creator: username,
        currentPlayers: <CurrentPlayer>[
          CurrentPlayer(username: username, isAndroid: true)
        ],
        nbDifferenceFound: 0,
        chosenDifference: -1,
        timer: 0,
        differenceFoundByPlayers: <PlayerDifferences>[
          PlayerDifferences(username: username, differencesFound: 0)
        ],
        observers: [],
      ),
      roomId: generateRandomId(),
      started: started,
      gameMode: gameMode,
      gameConstants: null,
    );
  }

  Future<bool> initGameMode(String? name) async {
    bool result = true;
    if (gameMode == "mode Temps Limité") {
      result = await initLimitedTimeMode();
    } else if (name != null) {
      result = await initClassicMode(name);
    }
    _socketService.off('gameDeletedFromDB');
    return result;
  }

  Future<bool> initClassicMode(String name) async {
    GameData? slide = getGameData(name);
    if (slide == null) {
      print("Not found");
      return false;
    }
    gameRoom.userGame.gameName = name;
    waitingRoomService.createGame(gameRoom);
    return true;
  }

  Future<bool> initLimitedTimeMode() async {
    GameData slide = randomSlide();
    if (slide == null) {
      print("Not found");
      return false;
    }
    gameRoom.userGame.gameName = slide.name;
    gameRoom.userGame.chosenDifference =
        generateRandomNumber(slide.nbDifference);
    waitingRoomService.createGame(gameRoom);
    return true;
  }

  void joinGame(String roomId, String? gameName) {
    if (gameMode == "mode Temps Limité") {
      joinLimitedTimeMode(roomId);
    } else {
      joinClassicMode(gameName, roomId);
    }
    _socketService.off('gameDeletedFromDB');
  }

  void joinClassicMode(String? gameName, String roomId) {
    GameData? slide = getGameData(gameName);
    if (slide == null) {
      print("Not found");
      return;
    }
    waitingRoomService.joinGame(username, gameMode, roomId, gameName);
  }

  void joinLimitedTimeMode(String roomId) {
    waitingRoomService.joinGame(username, gameMode, roomId, null);
  }

  GameData? getGameData(String? gameName) {
    if (gameName == null) return null;
    for (GameData game in slides) {
      if (game.name == gameName) {
        return game;
      }
    }
    return null;
  }

  void observeGame(String? gameName, String roomId) {
    if (gameMode == 'mode Classique') {
      observeClassicMode(gameName, roomId);
    } else {
      observeLimitedTimeMode(roomId);
    }
    _socketService.off('gameDeletedFromDB');
  }

  void observeClassicMode(String? gameName, String roomId) {
    GameData? slide = getGameData(gameName);
    if (slide == null) {
      print("Not found");
      return;
    }
    waitingRoomService.observeGame(username, gameMode, roomId, gameName);
  }

  void observeLimitedTimeMode(String roomId) {
    waitingRoomService.observeGame(username, gameMode, roomId, null);
  }

  String generateRandomId([int length = 16]) {
    const String characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    final Random random = Random();
    String randomId = '';
    for (int i = 0; i < length; i++) {
      randomId += characters[random.nextInt(characters.length)];
    }
    return randomId;
  }

  GameData randomSlide() {
    return slides[Random().nextInt(slides.length)];
  }

  int generateRandomNumber(int nbOfDifferences) {
    return Random().nextInt(nbOfDifferences);
  }
}
