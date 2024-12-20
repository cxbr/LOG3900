import 'dart:async';

import 'package:android_client/classes/game_room.dart';
import 'package:android_client/classes/user_game.dart';
import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/message_dialog.dart';
import 'package:android_client/components/username.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/screens/waiting_screen.dart';
import 'package:android_client/services/game_finder_service.dart';
import 'package:android_client/services/game_setup_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:android_client/services/waiting_room_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class CreateJoinGameDialog extends StatefulWidget {
  final String? gameName;
  final String gameMode;
  const CreateJoinGameDialog(
      {super.key, required this.gameName, required this.gameMode});

  @override
  CreateJoinGameDialogState createState() => CreateJoinGameDialogState();
}

class CreateJoinGameDialogState extends State<CreateJoinGameDialog> {
  List<GameRoom> games = <GameRoom>[];
  late final GameFinderService gameFinder;
  late final GameSetupService gameSetup;
  late final StreamSubscription<List<GameRoom>> subscription;
  final WaitingRoomService waitingRoomService = WaitingRoomService();

  @override
  void initState() {
    super.initState();
    waitingRoomService.buildContext = context;

    gameFinder = GameFinderService(widget.gameMode);
    gameSetup = GameSetupService(widget.gameMode);
    waitingRoomService.gameService.gameMode = widget.gameMode;
    waitingRoomService.gameService.getAllGames();
    loadGames();
  }

  void loadGames() async {
    subscription = gameFinder
        .getGames(widget.gameName)
        .stream
        .listen((List<GameRoom> gameRooms) {
      print(games);
      setState(() {
        games = gameRooms;
      });
    });
  }

  @override
  void dispose() {
    subscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor:
          Provider.of<ThemeModel>(context, listen: false).primaryColor,
      child: Column(
        children: <Widget>[
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: <Widget>[
              AlignedButton(
                button: DefaultButton(
                  onPressed: createGame,
                  buttonText: 'Créer une partie',
                ),
                rowAlignment: MainAxisAlignment.end,
              ),
            ],
          ),
          if (games.isEmpty)
            Column(
              children: [
                const SizedBox(height: 300),
                Center(
                  child: RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                        text:
                            'Aucune partie en cours. \nCliquez sur "Créer une partie" pour commencer.',
                        style: defaultFont.copyWith(
                          color: Provider.of<ThemeModel>(context, listen: false)
                              .textColor,
                        )),
                  ),
                )
              ],
            ),

          // Game list
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: ListView.builder(
                itemCount: games.length,
                itemBuilder: (BuildContext context, int index) {
                  final GameRoom game = games[index];
                  return Container(
                    margin: const EdgeInsets.all(10),
                    height: 200,
                    padding: const EdgeInsets.all(20),
                    decoration: boxDecorationWithBackground,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            RichText(
                              text: TextSpan(
                                text: 'Partie de ',
                                style: defaultFont.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black),
                                children: <TextSpan>[
                                  TextSpan(
                                      text: game.userGame.creator,
                                      style: defaultFont.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.black)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Liste de joueurs',
                              style: defaultFont.copyWith(
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold),
                            ),
                            Expanded(
                              child: SingleChildScrollView(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: game.userGame.currentPlayers
                                      .map((CurrentPlayer player) =>
                                          UsernameComponent(
                                            username: player.username,
                                            isShowAvatar: true,
                                            radius: 30,
                                          ))
                                      .toList(),
                                ),
                              ),
                            )
                          ],
                        ),
                        Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!game.started)
                                Text('Joueurs en attente',
                                    style: defaultFont.copyWith(
                                        color: Colors.black,
                                        fontWeight: FontWeight.bold)),
                              if (game.userGame.potentialPlayers != null)
                                Expanded(
                                  child: SingleChildScrollView(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: game.userGame.potentialPlayers!
                                          .map((CurrentPlayer player) =>
                                              UsernameComponent(
                                                username: player.username,
                                                isShowAvatar: true,
                                                radius: 30,
                                              ))
                                          .toList(),
                                    ),
                                  ),
                                ),
                            ]),
                        if (game.started)
                          Column(children: [
                            Text('Observateurs',
                                style: defaultFont.copyWith(
                                    color: Colors.black,
                                    fontWeight: FontWeight.bold)),
                            if (game.userGame.observers != null)
                              Expanded(
                                child: SingleChildScrollView(
                                  child: Column(
                                    children: game.userGame.observers!
                                        .map((Observer player) =>
                                            UsernameComponent(
                                              username: player.username,
                                              isShowAvatar: true,
                                              radius: 30,
                                            ))
                                        .toList(),
                                  ),
                                ),
                              ),
                          ]),
                        Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (game.userGame.currentPlayers.length < 4 &&
                                  !game.started)
                                DefaultButton(
                                  onPressed: () => joinGame(game.roomId),
                                  buttonText: 'Joindre',
                                ),
                              if (game.userGame.currentPlayers.length >= 4 &&
                                  !game.started)
                                DefaultButton(
                                  onPressed: () {},
                                  buttonText: 'Complet',
                                ),
                              if (game.started)
                                DefaultButton(
                                    onPressed: () {
                                      observeGame(game.roomId);
                                    },
                                    buttonText: 'Observer')
                            ])
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  void createGame() {
    if (games.isEmpty) {
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            backgroundColor:
                Provider.of<ThemeModel>(context, listen: false).primaryColor,
            title: Text('Veuillez créer un jeu'),
            actions: [
              DefaultButton(
                buttonText: 'Oui',
                onPressed: () {
                  Navigator.of(context).pop();
                },
              ),
            ],
          );
        },
      );
    }
    gameSetup.initGameRoom(false);
    gameSetup.initGameMode(widget.gameName).then((bool value) {
      if (value) {
        Navigator.pop(context);
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (BuildContext context) {
            return Dialog(
              backgroundColor:
                  Provider.of<ThemeModel>(context, listen: false).primaryColor,
              child: const WaitingScreen(),
            );
          },
        );
      } else {
        Navigator.pop(context);
        openMessageDialog("Le jeu a été supprimé.", false, context);
      }
    }).catchError((error) => <void>{
          print('Error creating game: $error'),
        });
  }

  void joinGame(String roomId) {
    gameSetup.joinGame(roomId, widget.gameName);
    Navigator.pop(context);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor:
              Provider.of<ThemeModel>(context, listen: false).primaryColor,
          child: const WaitingScreen(),
        );
      },
    );
  }

  void observeGame(String roomId) {
    gameSetup.observeGame(widget.gameName, roomId);
    // Future.delayed(const Duration(seconds: 2), () {
    //   Navigator.pop(context);
    // });
  }
}
