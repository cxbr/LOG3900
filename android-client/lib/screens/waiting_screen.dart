import 'dart:async';

import 'package:android_client/classes/game_constants.dart';
import 'package:android_client/classes/game_room.dart';
import 'package:android_client/classes/user_game.dart';
import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/chat_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/username.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/screens/game_screen.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:android_client/services/waiting_room_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class WaitingScreen extends StatefulWidget {
  const WaitingScreen({Key? key}) : super(key: key);
  @override
  WaitingScreenState createState() => WaitingScreenState();
}

class WaitingScreenState extends State<WaitingScreen> {
  bool rejected = false;
  bool accepted = false;
  bool gameCanceled = false;
  bool cheatMode = false;
  int gameDuration = 60;
  int bonusTime = 0;
  StreamSubscription<bool>? rejectedSubscription;
  StreamSubscription<bool>? acceptedSubscription;
  StreamSubscription<bool>? gameCanceledSubscription;
  StreamSubscription<GameRoom?>? gameRoomUpdatedSubscription;

  final WaitingRoomService waitingRoomService = WaitingRoomService();

  void close() {
    cancelSubscription();
    waitingRoomService.removeSocketListeners();
    if (!accepted) {
      waitingRoomService.abortGame();
      Navigator.pop(context);
    }
  }

  void start() {
    accepted = true;
    waitingRoomService.gameRoom?.gameConstants = GameConstants(
        gameDuration: gameDuration,
        penaltyTime: 0,
        bonusTime: bonusTime,
        cheatMode: cheatMode);
    waitingRoomService.startGame();
    close();
  }

  void cancelSubscription() {
    if (gameRoomUpdatedSubscription != null) {
      gameRoomUpdatedSubscription!.cancel();
    }

    if (rejectedSubscription != null) {
      rejectedSubscription!.cancel();
    }

    if (acceptedSubscription != null) {
      acceptedSubscription!.cancel();
    }

    if (gameCanceledSubscription != null) {
      gameCanceledSubscription!.cancel();
    }
  }

  void playerAccepted(String player, bool isAndroid) {
    waitingRoomService.acceptPlayer(player, isAndroid);
  }

  void playerRejected(String player) {
    waitingRoomService.rejectPlayer(player);
  }

  void showRejectionDialog() {
    Navigator.pop(context);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Vous avez été rejeté'),
          actions: <Widget>[
            TextButton(
              child: Text('OK'),
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop();
              },
            )
          ],
        );
      },
    );
  }

  @override
  void initState() {
    super.initState();

    // Make sure the streams are closed before opening new ones
    cancelSubscription();
    waitingRoomService.closeStreams();
    waitingRoomService.reloadGames();
    waitingRoomService.buildContext = context;
    rejectedSubscription =
        waitingRoomService.getRejectedStream.listen((bool event) {
      if (event) {
        setState(() {
          rejected = event;
        });
        showRejectionDialog();
      }
    });

    acceptedSubscription = waitingRoomService.getAcceptedStream.listen((event) {
      if (event) {
        accepted = true;
        waitingRoomService.startGame();
        close();
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(
              builder: (BuildContext context) => const GameScreen()),
        );
      }
    });

    gameCanceledSubscription =
        waitingRoomService.getGameCanceledStream.listen((bool event) {
      setState(() {
        if (!gameCanceled && event) {
          gameCanceled = event;
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (BuildContext context) {
              return AlertDialog(
                backgroundColor: Provider.of<ThemeModel>(context, listen: false)
                    .primaryColor,
                content: const Text(
                  "Le créateur a annulé la partie",
                  style: defaultFont,
                ),
                actions: <Widget>[
                  DefaultButton(
                    onPressed: () {
                      Navigator.pop(context);
                      close();
                    },
                    buttonText: "ok",
                  ),
                ],
              );
            },
          );
        }
      });
    });

    gameRoomUpdatedSubscription =
        waitingRoomService.getGameRoomUpdatedStream.listen((GameRoom? event) {
      setState(() {
        if (event != null) {
          waitingRoomService.gameRoom = event;
        }
      });
    });
  }

  @override
  void dispose() {
    super.dispose();
    cancelSubscription();
    waitingRoomService.closeStreams();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: <Widget>[
        Container(
          padding: const EdgeInsets.all(16.0),
          child: Stack(
            // mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: <Widget>[
              Column(
                children: <Widget>[
                  AlignedButton(
                      button: DefaultButton(
                          onPressed: () => <void>{
                                waitingRoomService.resetGameService(),
                                close()
                              },
                          buttonText: "Annuler"),
                      rowAlignment: MainAxisAlignment.start),
                  const ChatButton(
                    padding: EdgeInsets.fromLTRB(30, 0, 30, 0),
                  ),
                ],
              ),
              if (waitingRoomService.gameRoom!.userGame.creator ==
                      waitingRoomService.username &&
                  waitingRoomService.gameRoom!.userGame.currentPlayers.length >
                      1)
                AlignedButton(
                    button: DefaultButton(
                        onPressed: start, buttonText: "Commencer"),
                    rowAlignment: MainAxisAlignment.end),
            ],
          ),
        ),
        Row(
          children: <Widget>[
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  if (waitingRoomService.gameRoom?.userGame.creator ==
                      waitingRoomService.username) ...<Widget>[
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Align(
                          alignment: Alignment.topCenter,
                          child: Column(children: <Widget>[
                            if (waitingRoomService.gameMode == 'mode Classique')
                              Text(
                                'Création de partie du jeu ${waitingRoomService.gameRoom?.userGame.gameName}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 30.0,
                                ),
                              ),
                            if (waitingRoomService.gameMode == 'mode Classique')
                              const Text(
                                'Mode Classique',
                                style: defaultFont,
                              ),
                            if (waitingRoomService.gameMode ==
                                'mode Temps Limité')
                              const Text(
                                'Création de partie du jeu',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 40.0,
                                ),
                              ),
                            if (waitingRoomService.gameMode ==
                                'mode Temps Limité')
                              const Text(
                                'Mode Temps Limité',
                                style: defaultFont,
                              )
                          ]),
                        ),
                        const SizedBox(height: 80.0),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: <Widget>[
                            Center(
                              child: Container(
                                width: 500.0,
                                padding: const EdgeInsets.all(16.0),
                                decoration: BoxDecoration(
                                  border: Border.all(color: Colors.black),
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(
                                      20.0), // Border radius
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: <Widget>[
                                    Text(
                                      'Réglages de jeu',
                                      style: defaultFont.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black,
                                        fontSize: 30.0,
                                      ),
                                    ),
                                    const SizedBox(height: 30.0),
                                    Row(
                                      children: <Widget>[
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: <Widget>[
                                              Text(
                                                'Temps de la partie',
                                                style: defaultFont.copyWith(
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.black,
                                                  fontSize: 20.0,
                                                ),
                                              ),
                                              const SizedBox(height: 10.0),
                                              if (waitingRoomService.gameMode ==
                                                  'mode Temps Limité')
                                                Text(
                                                  'Temps bonus',
                                                  style: defaultFont.copyWith(
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.black,
                                                    fontSize: 20.0,
                                                  ),
                                                ),
                                              const SizedBox(height: 30.0),
                                              Text(
                                                'Mode triche',
                                                style: defaultFont.copyWith(
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.black,
                                                  fontSize: 20.0,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: <Widget>[
                                              Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.center,
                                                children: <Widget>[
                                                  Text(
                                                    '${gameDuration} secondes',
                                                    style: defaultFont.copyWith(
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      color: Colors.black,
                                                      fontSize: 15.0,
                                                    ),
                                                  ),
                                                  Slider(
                                                    value:
                                                        gameDuration.toDouble(),
                                                    min: 15,
                                                    max: 120,
                                                    activeColor: Colors.pink,
                                                    thumbColor: Colors.pink,
                                                    onChanged: (double value) {
                                                      setState(() {
                                                        gameDuration =
                                                            value.toInt();
                                                      });
                                                    },
                                                  ),
                                                  if (waitingRoomService
                                                          .gameMode ==
                                                      'mode Temps Limité')
                                                    Text(
                                                      '${bonusTime} secondes',
                                                      style:
                                                          defaultFont.copyWith(
                                                        fontWeight:
                                                            FontWeight.bold,
                                                        color: Colors.black,
                                                        fontSize: 15.0,
                                                      ),
                                                    ),
                                                  if (waitingRoomService
                                                          .gameMode ==
                                                      'mode Temps Limité')
                                                    Slider(
                                                      value:
                                                          bonusTime.toDouble(),
                                                      min: 0,
                                                      max: 120,
                                                      activeColor: Colors.pink,
                                                      thumbColor: Colors.pink,
                                                      onChanged:
                                                          (double value) {
                                                        setState(() {
                                                          bonusTime =
                                                              value.toInt();
                                                        });
                                                      },
                                                    ),
                                                ],
                                              ),
                                              Center(
                                                child: Row(
                                                  mainAxisSize:
                                                      MainAxisSize.min,
                                                  children: <Widget>[
                                                    Switch(
                                                      value: cheatMode,
                                                      onChanged: (bool value) {
                                                        setState(() {
                                                          cheatMode = value;
                                                        });
                                                      },
                                                      activeColor: Colors.pink,
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 50.0),
                            Center(
                              child: Container(
                                width: 500.0,
                                height: waitingRoomService.gameMode ==
                                        'mode Temps Limité'
                                    ? 300.0
                                    : 225.0,
                                padding: const EdgeInsets.all(16.0),
                                decoration: BoxDecoration(
                                  border: Border.all(color: Colors.black),
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20.0),
                                ),
                                child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.center,
                                    children: <Widget>[
                                      Text(
                                        'Prêts à jouer',
                                        style: defaultFont.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.black,
                                          fontSize: 30.0,
                                        ),
                                      ),
                                      const SizedBox(height: 30.0),
                                      if (waitingRoomService.gameRoom?.userGame
                                              .currentPlayers !=
                                          null)
                                        SizedBox(
                                          width: 500,
                                          height: 100,
                                          child: SingleChildScrollView(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.center,
                                              children: <Widget>[
                                                ...waitingRoomService.gameRoom!
                                                    .userGame.currentPlayers
                                                    .map((CurrentPlayer
                                                            player) =>
                                                        UsernameComponent(
                                                          username:
                                                              player.username,
                                                          isShowAvatar: true,
                                                          radius: 30,
                                                        ))
                                                    .toList(),
                                              ],
                                            ),
                                          ),
                                        )
                                    ]),
                              ),
                            )
                          ],
                        )
                      ],
                    )
                  ] else if (waitingRoomService
                      .gameRoom!.userGame.currentPlayers
                      .any((CurrentPlayer player) {
                    return player.username == waitingRoomService.username;
                  }))
                    Container(
                      padding: const EdgeInsets.all(40),
                      height: 500,
                      child: Column(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'En attente du créateur',
                              style: defaultFont.copyWith(fontSize: 30),
                            ),
                            Center(
                                child: Column(children: [
                              Text(
                                "Prêts à jouer",
                                style: defaultFont.copyWith(fontSize: 30),
                              ),
                              Container(
                                padding: const EdgeInsets.all(20),
                                height: 300,
                                width: 500,
                                decoration: boxDecorationWithBackground,
                                child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: <Widget>[
                                      ...waitingRoomService
                                          .gameRoom!.userGame.currentPlayers
                                          .map((CurrentPlayer player) =>
                                              UsernameComponent(
                                                username: player.username,
                                                isShowAvatar: true,
                                                radius: 30,
                                              ))
                                          .toList(),
                                    ]),
                              )
                            ]))
                          ]),
                    )
                  else
                    const Center(
                        child: Text('En attente d\'approbation',
                            style: defaultFont)),
                  if (waitingRoomService.gameRoom?.userGame.creator ==
                      waitingRoomService.username)
                    if (waitingRoomService
                            .gameRoom?.userGame.potentialPlayers !=
                        null)
                      Column(
                        children: <Widget>[
                          const SizedBox(height: 20),
                          const Text('Joueurs en attente', style: defaultFont),
                          Container(
                            padding: const EdgeInsets.all(20),
                            width: 800,
                            height: 200,
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.black),
                              color: Colors.white,
                              borderRadius:
                                  BorderRadius.circular(20.0), // Border radius
                            ),
                            child: ListView.builder(
                              key: UniqueKey(),
                              itemCount: waitingRoomService
                                  .gameRoom!.userGame.potentialPlayers?.length,
                              itemBuilder: (BuildContext context, int index) {
                                return Padding(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 10),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment
                                        .spaceBetween, // Center the row content
                                    children: <Widget>[
                                      UsernameComponent(
                                          username: waitingRoomService
                                              .gameRoom!
                                              .userGame
                                              .potentialPlayers![index]
                                              .username,
                                          isShowAvatar: true),
                                      const SizedBox(width: 8),
                                      Row(children: <Widget>[
                                        DefaultButton(
                                            buttonText: 'Accepter',
                                            onPressed: () => playerAccepted(
                                                waitingRoomService
                                                    .gameRoom!
                                                    .userGame
                                                    .potentialPlayers![index]
                                                    .username,
                                                waitingRoomService
                                                    .gameRoom!
                                                    .userGame
                                                    .potentialPlayers![index]
                                                    .isAndroid)),
                                        const SizedBox(width: 8),
                                        DefaultButton(
                                            buttonText: 'Refuser',
                                            onPressed: () => playerRejected(
                                                waitingRoomService
                                                    .gameRoom!
                                                    .userGame
                                                    .potentialPlayers![index]
                                                    .username)),
                                        const SizedBox(width: 8),
                                      ])
                                    ],
                                  ),
                                );
                              },
                            ),
                          )
                        ],
                      )
                    else
                      Column(
                        children: <Widget>[
                          const SizedBox(height: 20),
                          const Text('En attente de joueurs',
                              style: defaultFont),
                          Container(
                            padding: const EdgeInsets.all(20),
                            width: 800,
                            height: (waitingRoomService.gameMode ==
                                    'mode Classique')
                                ? 250
                                : 200,
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.black),
                              color: Colors.white,
                              borderRadius:
                                  BorderRadius.circular(20.0), // Border radius
                            ),
                          )
                        ],
                      ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}
