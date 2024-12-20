// ignore_for_file: avoid_catches_without_on_clauses, use_build_context_synchronously

import 'dart:async';
import 'dart:convert';

import 'package:android_client/classes/end_Game.dart';
import 'package:android_client/classes/game_data.dart';
import 'package:android_client/classes/game_room.dart';
import 'package:android_client/classes/rating_format.dart';
import 'package:android_client/classes/user_game.dart';
import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/chat_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/information_board.dart';
import 'package:android_client/components/play-area_components.dart';
import 'package:android_client/components/timer.dart';
import 'package:android_client/components/username.dart';
import 'package:android_client/components/video_replay_dialog.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/game_service.dart';
import 'package:android_client/services/play-area_service.dart';
import 'package:android_client/services/project_constants_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

typedef MyBuilder = void Function(
    BuildContext context, void Function() updatePlayArea);

class GameScreen extends StatefulWidget {
  @override
  const GameScreen({super.key});
  @override
  GameScreenState createState() => GameScreenState();
}

class GameScreenState extends State<GameScreen> {
  final GameService _gameService = GameService();
  int differences = 0;
  late GameRoom gameRoom;
  bool gameFinished = false;
  late GameData gameData;
  int rating = 0;
  StreamSubscription<GameRoom>? gameSubscription;
  StreamSubscription<EndGame>? gameFinishedSubscription;
  StreamSubscription<int>? differencesFoundSubscription;
  StreamSubscription<String>? abandonedGameSubscription;
  GlobalKey<PlayAreaComponentState> playAreaKey =
      GlobalKey<PlayAreaComponentState>();

  bool _isObserver = false;

  @override
  void initState() {
    super.initState();
    clearSubscriptions();
    subscribeGameRoom();
    subscribeGameFinished();
    subscribeAbandon();
    differencesFoundSubscription =
        _gameService.totalDifferencesFound$.listen((int updatedCount) {
      setState(() {}); // DO NOT REMOVE NEEDED TO FORCE REBUILD
    });
  }

  void clearSubscriptions() {
    gameSubscription?.cancel();
    gameFinishedSubscription?.cancel();
    abandonedGameSubscription?.cancel();
    differencesFoundSubscription?.cancel();
  }

  @override
  void dispose() {
    if (!gameFinished) {
      _gameService.abandonGame();
    }
    clearSubscriptions();
    _gameService.closeStreams();

    PlayAreaService().dispose();
    try {
      super.dispose();
      Navigator.pop(context);
      Navigator.pop(context);
    } catch (e) {
      print(e);
    }

    Navigator.pushNamed(context, "/mainScreen");
  }

  void _setIsObserver(bool value) {
    setState(() {
      _isObserver = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Stack(
            children: [
              Column(
                children: <Widget>[
                  AlignedButton(
                    rowAlignment: MainAxisAlignment.start,
                    button: DefaultButton(
                      buttonText: "Abandonner",
                      onPressed: abandon,
                    ),
                  ),
                  const ChatButton(padding: EdgeInsets.only(top: 0, left: 30)),
                ],
              ),
              InfoBoard(
                  isCheatModeOn: gameRoom.gameConstants!.cheatMode,
                  gameName: _gameService.gameRoom.userGame.gameName,
                  gameLevel: _gameService.gameData.nbDifference.toString(),
                  gameMode: _gameService.gameRoom.gameMode),
              Align(
                alignment: Alignment.topCenter,
                child: Padding(
                    padding: _isObserver
                        ? const EdgeInsets.only(top: 15)
                        : const EdgeInsets.only(top: 100.0),
                    child: Column(children: [
                      if (gameRoom.userGame.observers != null &&
                          gameRoom.userGame.observers!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.all(10.0),
                          child: RichText(
                            textAlign: TextAlign.center,
                            text: TextSpan(
                              text: _isObserver
                                  ? "Observateurs en jeu : ${gameRoom.userGame.observers?.length}.\nDessinez sur la fiche pour indiquer un indice au joueur choisi."
                                  : "Observateurs en jeu : ${gameRoom.userGame.observers?.length}",
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
                            child: Consumer<PlayAreaService>(builder:
                                (BuildContext context, PlayAreaService service,
                                    Widget? child) {
                              return Column(children: [
                                if (_isObserver)
                                  RadioListTile<String?>(
                                    title: const Text(
                                      'Tous les joueurs',
                                      style: defaultFont,
                                    ),
                                    value: null,
                                    groupValue: service.selectedPlayer,
                                    onChanged: (String? value) =>
                                        service.updateSelectedPlayer(value),
                                  ),
                                if (_gameService.gameRoom != null)
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: <Widget>[
                                      for (int i = 0;
                                          i <
                                              _gameService
                                                  .gameRoom
                                                  .userGame
                                                  .differenceFoundByPlayers
                                                  .length;
                                          i++)
                                        Row(
                                          children: <Widget>[
                                            _buildPlayerInfo(
                                                _gameService.gameRoom.userGame
                                                    .differenceFoundByPlayers[i],
                                                service),
                                            if (i <
                                                _gameService
                                                        .gameRoom
                                                        .userGame
                                                        .differenceFoundByPlayers
                                                        .length -
                                                    1)
                                              const SizedBox(width: 20),
                                          ],
                                        ),
                                    ],
                                  )
                              ]);
                            }),
                          ),
                        ),
                      ),
                    ])),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.all(10),
            child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
              Container(
                decoration: const BoxDecoration(color: Color(0x0ffdd8e6)),
                height: 80,
                width: 200,
                child: const MyTimerScreen(),
              ),
              const SizedBox(height: 5),
              // Expanded(
              //     child:
              PlayAreaComponent(
                  key: playAreaKey, isObserverCallback: _setIsObserver)
              // ),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildPlayerInfo(PlayerDifferences player, PlayAreaService service) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: <Widget>[
        Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            if (_isObserver)
              Radio<String>(
                value: player.username,
                groupValue: service.selectedPlayer,
                onChanged: (String? value) =>
                    service.updateSelectedPlayer(value),
              ),
            DefaultTextStyle(
                style: defaultFont.copyWith(
                    fontWeight: FontWeight.bold, fontSize: 20),
                child: UsernameComponent(
                    username: player.username, isShowAvatar: true)),
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

  void subscribeGameRoom() {
    gameSubscription = _gameService.gameRoom$.listen((GameRoom gameRoom) {
      this.gameRoom = gameRoom;
      gameData = _gameService.gameData;
      setState(() {});
    });
  }

  void subscribeGameFinished() {
    gameFinishedSubscription =
        _gameService.gameFinished$.listen((EndGame endGame) {
      gameFinished = true;
      if (_gameService.gameRoom.gameMode == 'mode Classique') {
        endGameClassicMode(endGame);
      } else {
        endGameLimitedTimeMode();
      }
      playAreaKey.currentState?.clearReplayInterval();
    });
  }

  void abandon() {
    showDialog(
        barrierDismissible: false,
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            backgroundColor:
                Provider.of<ThemeModel>(context, listen: false).primaryColor,
            scrollable: true,
            title: const Text(
              "Êtes-vous sur de vouloir abandonner la partie",
              style: defaultFont,
            ),
            content: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    DefaultButton(
                      buttonText: "Oui",
                      onPressed: dispose,
                    ),
                    DefaultButton(
                      buttonText: "Non",
                      onPressed: () {
                        Navigator.pop(context);
                      },
                    )
                  ]),
            ),
          );
        });
  }

  void modalForTheRating() {
    if (!_isObserver) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text(
              "Avez-vous aimé ce jeu ?",
              style: defaultFont,
            ),
            backgroundColor:
                Provider.of<ThemeModel>(context, listen: false).primaryColor,
            content: RatingBar.builder(
              initialRating: 0,
              minRating: 1,
              direction: Axis.horizontal,
              allowHalfRating: false,
              itemCount: 5,
              itemPadding: const EdgeInsets.symmetric(horizontal: 4.0),
              itemBuilder: (BuildContext context, _) => const Icon(
                Icons.star,
                color: Colors.amber,
              ),
              onRatingUpdate: (double userRating) {
                setState(() {
                  rating = userRating.toInt();
                });
              },
            ),
            actions: <Widget>[
              DefaultButton(
                  onPressed: () async {
                    try {
                      final RatingFormat ratingToSave = RatingFormat(
                          rating: rating,
                          gameName: gameRoom.userGame.gameName as String);
                      await http.post(
                        Uri.parse(
                            '${ProjectConstantsService.serverAddress}/game/rating'),
                        headers: <String, String>{
                          'Content-Type': 'application/json; charset=UTF-8',
                        },
                        body: jsonEncode(ratingToSave.toJson()),
                      );
                      Navigator.pop(context);
                      dispose();
                    } catch (error) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                              'An error occurred. Please try again later. $error'),
                        ),
                      );
                    }
                  },
                  buttonText: "Envoyer"),
              DefaultButton(
                  onPressed: () {
                    Navigator.pop(context);
                    dispose();
                  },
                  buttonText: "Annuler"),
            ],
          );
        },
      );
    } else {
      dispose();
    }
  }

  void endGameClassicMode(EndGame endGame) {
    if (endGame.winner == _gameService.username) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            backgroundColor:
                Provider.of<ThemeModel>(context, listen: false).primaryColor,
            content: const Text(
              "Félicitation, vous avez gagné ce jeu !",
              style: defaultFont,
            ),
            actions: <Widget>[
              DefaultButton(
                  onPressed: modalForTheRating, buttonText: "Terminer"),
              DefaultButton(
                  onPressed: replayDialog, buttonText: "Reprise Vidéo"),
            ],
          );
        },
      );
    } else if (endGame.tiedPlayers.contains(_gameService.username)) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            backgroundColor:
                Provider.of<ThemeModel>(context, listen: false).primaryColor,
            content: const Text(
              "Égalité",
              style: defaultFont,
            ),
            actions: <Widget>[
              DefaultButton(
                  onPressed: modalForTheRating, buttonText: "Terminer"),
              DefaultButton(
                  onPressed: replayDialog, buttonText: "Reprise Vidéo"),
            ],
          );
        },
      );
    } else if (gameRoom.userGame.observers!
        .where((Observer player) => player.username == _gameService.username)
        .any((Observer player) => true)) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            backgroundColor:
                Provider.of<ThemeModel>(context, listen: false).primaryColor,
            content: const Text(
              "C'est terminé, merci d'avoir regardé !",
              style: defaultFont,
            ),
            actions: <Widget>[
              DefaultButton(onPressed: dispose, buttonText: "Terminer"),
            ],
          );
        },
      );
    } else {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            backgroundColor:
                Provider.of<ThemeModel>(context, listen: false).primaryColor,
            content: const Text(
              "Oh non, vous avez perdu ce jeu !",
              style: defaultFont,
            ),
            actions: <Widget>[
              DefaultButton(
                  onPressed: modalForTheRating, buttonText: "Terminer"),
              DefaultButton(
                  onPressed: replayDialog, buttonText: "Reprise Vidéo"),
            ],
          );
        },
      );
    }
  }

  Future<void> replayDialog() async {
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
            backgroundColor:
                Provider.of<ThemeModel>(context, listen: false).primaryColor,
            child: VideoReplayDialog(
              canSave: true,
            ));
      },
    );
    modalForTheRating();
  }

  void endGameLimitedTimeMode() {
    if (gameRoom.userGame.observers!
        .where((Observer player) => player.username == _gameService.username)
        .any((Observer player) => true)) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            backgroundColor:
                Provider.of<ThemeModel>(context, listen: false).primaryColor,
            content: const Text(
              "C'est terminé, merci d'avoir regardé !",
              style: defaultFont,
            ),
            actions: <Widget>[
              DefaultButton(onPressed: dispose, buttonText: "Terminer"),
            ],
          );
        },
      );
    } else {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            backgroundColor:
                Provider.of<ThemeModel>(context, listen: false).primaryColor,
            content: const Text(
              "C'est terminé, merci d'avoir joué !",
              style: defaultFont,
            ),
            actions: <Widget>[
              DefaultButton(onPressed: dispose, buttonText: "Terminer"),
            ],
          );
        },
      );
    }
  }

  void subscribeAbandon() {
    abandonedGameSubscription =
        _gameService.abandoned$.listen((String username) {
      if (username == _gameService.username) {
        dispose();
        return;
      }

      final bool isClassicMode = _gameService.gameMode == 'mode Classique';
      final bool isCurrentUserInGame = this.isCurrentUserInGame();
      final bool shouldDisplayEndgame =
          _gameService.gameRoom.userGame.currentPlayers.length == 1;

      if (shouldDisplayEndgame) {
        if (isClassicMode && isCurrentUserInGame) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (BuildContext context) {
              return AlertDialog(
                backgroundColor: Provider.of<ThemeModel>(context, listen: false)
                    .primaryColor,
                content: const Text(
                  "Félicitation, vous avez gagné ce jeu !",
                  style: defaultFont,
                ),
                actions: <Widget>[
                  DefaultButton(
                      onPressed: modalForTheRating, buttonText: "Terminer"),
                  DefaultButton(onPressed: () {}, buttonText: "Reprise Vidéo"),
                ],
              );
            },
          );
        } else if (isCurrentUserInGame) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (BuildContext context) {
              return AlertDialog(
                backgroundColor: Provider.of<ThemeModel>(context, listen: false)
                    .primaryColor,
                content: const Text(
                  "C'est terminé, merci d'avoir joué !",
                  style: defaultFont,
                ),
                actions: <Widget>[
                  DefaultButton(onPressed: dispose, buttonText: "Terminer"),
                ],
              );
            },
          );
        } else {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (BuildContext context) {
              return AlertDialog(
                backgroundColor: Provider.of<ThemeModel>(context, listen: false)
                    .primaryColor,
                content: const Text(
                  "C'est terminé, merci d'avoir regardé !",
                  style: defaultFont,
                ),
                actions: <Widget>[
                  DefaultButton(onPressed: dispose, buttonText: "Terminer"),
                ],
              );
            },
          );
        }
      }
      if (isClassicMode && isCurrentUserInGame) {
        // TODO: startConfetti
      }
    });
  }

  bool isCurrentUserInGame() {
    return _gameService.gameRoom.userGame.currentPlayers
        .where(
            (CurrentPlayer player) => player.username == _gameService.username)
        .any((CurrentPlayer player) => true);
  }

  bool isAndroidByUsername(String username) {
    return _gameService.gameRoom.userGame.currentPlayers
        .firstWhere((CurrentPlayer player) => player.username == username)
        .isAndroid;
  }
}
