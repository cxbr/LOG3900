import 'dart:async';

import 'package:android_client/classes/game_room.dart';
import 'package:android_client/classes/user_game.dart';
import 'package:android_client/screens/game_screen.dart';
import 'package:android_client/services/game_service.dart';
import 'package:android_client/services/socket_service.dart';
import 'package:flutter/material.dart';

class WaitingRoomService {
  final SocketService _socketService = SocketService();
  final GameService gameService = GameService();
  GameRoom? gameRoom;
  late String username;
  late String gameMode;
  late String roomId;
  late BuildContext buildContext;
  StreamController<bool> gameCanceled$ = StreamController<bool>();
  StreamController<bool> rejected$ = StreamController<bool>();
  StreamController<bool> accepted$ = StreamController<bool>();
  StreamController<GameRoom?> gameRoomUpdated$ = StreamController<GameRoom?>();
  StreamController<GameRoom> gameRoomApp$ = StreamController<GameRoom>();

  static final WaitingRoomService _instance = WaitingRoomService._internal();

  factory WaitingRoomService() {
    return _instance;
  }

  WaitingRoomService._internal();
  Stream<GameRoom> get getGameRoomStream => gameRoomApp$.stream;

  Stream<bool> get getGameCanceledStream => gameCanceled$.stream;

  Stream<bool> get getRejectedStream => rejected$.stream;

  Stream<bool> get getAcceptedStream => accepted$.stream;

  Stream<GameRoom?> get getGameRoomUpdatedStream => gameRoomUpdated$.stream;

  void reloadGames() {
    gameService.gameMode = gameMode;
  }

  void acceptPlayer(String player, bool isAndroid) {
    _socketService.send('acceptPlayer', <String, Object?>{
      "roomId": gameRoom?.roomId,
      "username": player,
      "isAndroid": isAndroid
    });
  }

  void rejectPlayer(String player) {
    _socketService.send('rejectPlayer',
        <String, String?>{"roomId": gameRoom?.roomId, "username": player});
  }

  void abortGame() {
    if (gameRoom?.userGame.creator == username) {
      _socketService.send('abortGameCreation', gameRoom?.roomId);
    } else if (gameRoom != null) {
      _socketService.send('leaveGame',
          <String, String?>{"roomId": gameRoom?.roomId, "username": username});
    }
  }

  void startGame() {
    gameRoom?.userGame.timer = gameRoom?.gameConstants!.gameDuration ?? 0;

    if (gameRoom?.userGame.creator == username) {
      _socketService.send('startingGame', gameRoom?.toJson());
    }
  }

  void createGame(GameRoom gameRoom) {
    this.gameRoom = gameRoom;
    username = gameRoom.userGame.creator;
    gameMode = gameRoom.gameMode;
    roomId = gameRoom.roomId;
    handleWaitingRoomSocket();
    _socketService.send('createGame', gameRoom.toJson());
    gameRoomUpdated$.add(gameRoom);
  }

  void joinGame(
      String username, String gameMode, String roomId, String? gameName) {
    gameRoom = null;
    this.username = username;
    this.gameMode = gameMode;
    this.roomId = roomId;
    final CurrentPlayer user =
        CurrentPlayer(username: username, isAndroid: true);
    handleWaitingRoomSocket();
    _socketService.send('askingToJoinGame', <String, Object?>{
      "gameName": gameName,
      "user": user,
      "gameMode": gameMode,
      "roomId": roomId
    });
  }

  void observeGame(
      String username, String gameMode, String roomId, String? gameName) {
    gameRoom = null;
    this.username = username;
    this.gameMode = gameMode;
    this.roomId = roomId;
    final CurrentPlayer user =
        CurrentPlayer(username: username, isAndroid: true);
    handleWaitingRoomSocket();
    _socketService.send('askingToObserveGame', <String, Object?>{
      "gameName": gameName,
      "user": user,
      "gameMode": gameMode,
      "roomId": roomId
    });
  }

  void handleWaitingRoomSocket() {
    _socketService.on('startingGame', (data) {
      if (data == null) {
        print(
            'Nous avons eu un problème pour obtenir les informations de jeu du serveur');
        return;
      }
      GameRoom? gameRoomSocket = GameRoom.fromJson(data);
      if (gameRoomSocket.userGame.currentPlayers
          .where((CurrentPlayer user) => user.username == username)
          .any((CurrentPlayer user) => true)) {
        gameRoom = gameRoomSocket;
        accepted$.add(true);
        gameRoom?.started = true;
        gameService.startGame(gameRoom!, username);
        removeSocketListeners();
        _socketService.off('startingGame');
        Navigator.pop(buildContext);
        Navigator.push(
          buildContext,
          MaterialPageRoute(
              builder: (BuildContext buildContext) => const GameScreen()),
        );
      } else {
        rejected$.add(true);
      }
      _socketService.off('startingGame');
    });
    _socketService.on('gameInfo', (data) {
      if (data == null) {
        print(
            'Nous avons eu un problème pour obtenir les informations de jeu du serveur');
        _socketService.off('startingGame');
        return;
      }
      GameRoom? gameRoomSocket = GameRoom.fromJson(data);
      if ((gameRoom == null ||
              gameRoom?.userGame.gameName ==
                  gameRoomSocket.userGame.gameName) &&
          gameMode == gameRoomSocket.gameMode) {
        gameRoom = gameRoomSocket;
        gameRoomUpdated$.add(gameRoom);
        if (gameRoom!.userGame.observers!
            .where((Observer user) => user.username == username)
            .any((Observer user) => true)) {
          gameService.observeGame(gameRoom!, username);
          removeSocketListeners();
          _socketService.off('startingGame');
          Navigator.pop(buildContext);
          Navigator.push(
            buildContext,
            MaterialPageRoute(
                builder: (BuildContext buildContext) => const GameScreen()),
          );
        }
      }
    });
    _socketService.on('playerAccepted', (data) {
      if (data == null) {
        print(
            'Nous avons eu un problème pour obtenir les informations de jeu du serveur');
        return;
      }
      GameRoom? gameRoomSocket = GameRoom.fromJson(data);
      gameRoom = gameRoomSocket;
      gameRoomUpdated$.add(gameRoom);
    });

    _socketService.on('playerRejected', (data) {
      if (data == null) {
        print(
            'Nous avons eu un problème pour obtenir les informations de jeu du serveur');
        return;
      }
      GameRoom? gameRoomSocket = GameRoom.fromJson(data);
      if (!gameRoomSocket.userGame.currentPlayers
              .where((CurrentPlayer user) => user.username == username)
              .any((CurrentPlayer user) => true) &&
          !gameRoomSocket.userGame.potentialPlayers!
              .where((CurrentPlayer user) => user.username == username)
              .any((CurrentPlayer user) => true)) {
        rejected$.add(true);
      } else {
        gameRoom = gameRoomSocket;
        gameRoomUpdated$.add(gameRoom);
      }
    });

    _socketService.on('gameCanceled', (data) {
      if (data == null) {
        print(
            'Nous avons eu un problème pour obtenir les informations de jeu du serveur');
        return;
      }
      GameRoom? gameRoomSocket = GameRoom.fromJson(data);
      if (gameRoom?.userGame.gameName == gameRoomSocket.userGame.gameName &&
          gameRoom!.gameMode == gameMode &&
          (gameRoomSocket.userGame.currentPlayers
                  .where((CurrentPlayer user) => user.username == username)
                  .any((CurrentPlayer user) => true) ||
              gameRoomSocket.userGame.potentialPlayers!
                  .where((CurrentPlayer user) => user.username == username)
                  .any((CurrentPlayer user) => true))) {
        gameCanceled$.add(true);
      }
    });

    _socketService.on('gameDeleted', (data) {
      if (data == null) {
        print(
            'Nous avons eu un problème pour obtenir les informations de jeu du serveur');
        return;
      }
      if (gameMode == 'mode Temps Limité') {
        gameService.slides.removeWhere((slide) => slide.name == data);
        if (gameService.slides.length == 0) {
          gameCanceled$.add(true);
        }
      } else if (gameRoom?.userGame.gameName == data) {
        gameCanceled$.add(true);
      }
    });
  }

  void closeStreams() {
    gameCanceled$.close();
    rejected$.close();
    accepted$.close();
    gameRoomApp$.close();
    gameCanceled$ = StreamController<bool>();
    rejected$ = StreamController<bool>();
    accepted$ = StreamController<bool>();
    gameRoomUpdated$ = StreamController<GameRoom?>();
    gameRoomApp$ = StreamController<GameRoom>();
  }

  void resetGameService() {
    _socketService.off('startingGame');
    gameService.closeStreams();
  }

  void removeSocketListeners() {
    _socketService.off('gameInfo');
    _socketService.off('gameCreated');
    _socketService.off('playerAccepted');
    _socketService.off('playerRejected');
    _socketService.off('gameCanceled');
    _socketService.off('gameDeleted');
  }
}
