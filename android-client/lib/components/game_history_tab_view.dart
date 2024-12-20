import 'package:android_client/classes/game_history.dart';
import 'package:android_client/classes/user.dart';
import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/config_http_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:android_client/services/user_http_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

class GameHistoryTabView extends StatelessWidget {
  GameHistoryTabView({super.key});

  final ValueNotifier<bool> deleteNotifier = ValueNotifier<bool>(false);

  void showHistoryDeletionPopup(BuildContext context) async {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor:
              Provider.of<ThemeModel>(context, listen: false).primaryColor,
          title: const Text('Suppression de l\'historique'),
          content: const Text(
            'Êtes-vous sûr de vouloir supprimer l\'historique des parties jouées?',
            style: defaultFont,
          ),
          actions: [
            DefaultButton(
              buttonText: 'Oui',
              onPressed: () async {
                await ConfigHttpService()
                    .deleteHistory(UserService.loggedInUser?.id ?? "");
                deleteNotifier.value = true;
                Navigator.of(context).pop();
              },
            ),
            DefaultButton(
              buttonText: 'Non',
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 600,
            height: 600,
            child: Container(
              decoration: defaultBoxDecoration,
              child: Column(children: [
                const SizedBox(height: 15),
                const Padding(
                  padding: EdgeInsets.all(20.0),
                  child:
                      Text("Journal des connexions", style: defaultFontTitle),
                ),
                const SizedBox(height: 15),
                Expanded(child: ConnectionHistoryEntryList())
              ]),
            ),
          ),
          const SizedBox(width: 50),
          SizedBox(
            width: 600,
            height: 600,
            child: Container(
              decoration: defaultBoxDecoration,
              child: Column(children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    const Padding(
                      padding: EdgeInsets.all(20.0),
                      child: Text("Historique des parties jouées",
                          style: defaultFontTitle),
                    ),
                    AlignedButton(
                      button: DefaultButton(
                        onPressed: () {
                          showHistoryDeletionPopup(context);
                        },
                        icon:
                            const IconData(0xe1b9, fontFamily: 'MaterialIcons'),
                        customStyle: buildDefaultButtonStyle(context).copyWith(
                            padding: const MaterialStatePropertyAll<EdgeInsets>(
                                EdgeInsets.symmetric(horizontal: 10))),
                      ),
                      rowAlignment: MainAxisAlignment.end,
                    ),
                  ],
                ),
                Expanded(
                    child: GameHistoryEntryList(deleteHistory: deleteNotifier))
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class ConnectionHistoryEntryList extends StatelessWidget {
  final Future<List<Connection>> entries = UserHttpService(http.Client())
      .getConnection(UserService.loggedInUser?.id ?? "");

  ConnectionHistoryEntryList({Key? key}) : super(key: key);

  Future<List<Connection>> reverseEntries(
      Future<List<Connection>> entries) async {
    final List<Connection> list = await entries;
    return list.reversed.toList();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Connection>>(
      future: reverseEntries(entries),
      builder:
          (BuildContext context, AsyncSnapshot<List<Connection>> snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const CircularProgressIndicator();
        } else if (snapshot.hasError) {
          return Text('Error: ${snapshot.error}');
        } else {
          return Padding(
              padding: const EdgeInsets.all(20),
              child: ListView.separated(
                padding: const EdgeInsets.all(8),
                itemCount: snapshot.data!.length,
                itemBuilder: (BuildContext context, int index) {
                  return ConnectionHistoryEntry(entry: snapshot.data![index]);
                },
                separatorBuilder: (BuildContext context, int index) =>
                    const Divider(
                  color: Colors.transparent,
                ),
              ));
        }
      },
    );
  }
}

class ConnectionHistoryEntry extends StatelessWidget {
  final Connection entry;
  const ConnectionHistoryEntry({super.key, required this.entry});

  @override
  Widget build(BuildContext context) {
    return Center(
        child: SizedBox(
            height: 100,
            width: 900,
            child: Container(
                decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(width: 2),
                    borderRadius: BorderRadius.circular(20)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(entry.connectionType,
                              style: defaultFont.merge(const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black))),
                        ],
                      ),
                    ),
                    const VerticalDivider(
                        indent: 30, endIndent: 30, color: Colors.black),
                    Expanded(
                      child: Text(
                        DateTime.fromMillisecondsSinceEpoch(
                                entry.connectionTime)
                            .toString()
                            .substring(0, 19),
                        style: defaultFont
                            .merge(const TextStyle(color: Colors.black)),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ))));
  }
}

class GameHistoryEntryList extends StatelessWidget {
  final ValueNotifier<bool> deleteHistory;

  Future<List<GameHistory>> entries =
      ConfigHttpService().getHistory(UserService.loggedInUser?.id ?? "");

  GameHistoryEntryList({Key? key, required this.deleteHistory})
      : super(key: key);

  Future<List<GameHistory>> reverseEntries(
      Future<List<GameHistory>> entries) async {
    final List<GameHistory> list = await entries;
    return list.reversed.toList();
  }

  void updateEntries() {
    entries =
        ConfigHttpService().getHistory(UserService.loggedInUser?.id ?? "");
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: deleteHistory,
      builder: (context, value, child) {
        if (value) {
          updateEntries();
          deleteHistory.value = false;
        }

        return FutureBuilder<List<GameHistory>>(
          future: reverseEntries(entries),
          builder: (BuildContext context,
              AsyncSnapshot<List<GameHistory>> snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const CircularProgressIndicator();
            } else if (snapshot.hasError) {
              return Text('Error: ${snapshot.stackTrace}');
            } else {
              return Padding(
                  padding: const EdgeInsets.all(20),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(8),
                    itemCount: snapshot.data!.length,
                    itemBuilder: (BuildContext context, int index) {
                      return GameHistoryEntry(entry: snapshot.data![index]);
                    },
                    separatorBuilder: (BuildContext context, int index) =>
                        const Divider(
                      color: Colors.transparent,
                    ),
                  ));
            }
          },
        );
      },
    );
  }
}

class GameHistoryEntry extends StatelessWidget {
  final GameHistory entry;
  const GameHistoryEntry({super.key, required this.entry});

  @override
  Widget build(BuildContext context) {
    String winner = '';

    if (entry.abandoned!.contains(UserService.loggedInUser?.id)) {
      winner = "Abandon";
    } else if (entry.gameMode == 'Mode Temps Limité') {
      winner = "Partie jouée";
    } else if (entry.winner != null &&
            entry.winner == UserService.loggedInUser?.id ||
        !entry.abandoned!.contains(UserService.loggedInUser?.id) &&
            entry.players.length == entry.abandoned!.length + 1) {
      winner = "Victoire !";
    } else if (entry.winner != null &&
        entry.winner != UserService.loggedInUser?.id) {
      winner = "Défaite";
    } else {
      winner = "Égalité";
    }

    String formatDuration(int milliseconds) {
      int seconds = (milliseconds / 1000).round();
      int minutes = (seconds / 60).truncate();
      seconds = seconds % 60;
      return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }

    return Center(
        child: SizedBox(
            height: 120,
            width: 900,
            child: Container(
                decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(width: 2),
                    borderRadius: BorderRadius.circular(20)),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(entry.gameMode,
                              textAlign: TextAlign.center,
                              style: defaultFont.merge(const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                  fontSize: 15))),
                          Text(
                              DateTime.fromMillisecondsSinceEpoch(
                                      entry.startTime)
                                  .toString()
                                  .substring(0, 19),
                              textAlign: TextAlign.center, // Center the text
                              style: defaultFont
                                  .merge(const TextStyle(color: Colors.black)))
                        ],
                      ),
                    ),
                    const VerticalDivider(
                        indent: 30, endIndent: 30, color: Colors.black),
                    Expanded(
                      child: Text(winner,
                          textAlign: TextAlign.center,
                          style: defaultFont.merge(TextStyle(
                              fontWeight: FontWeight.bold,
                              color: accentColor))),
                    ),
                    const VerticalDivider(
                        indent: 30, endIndent: 30, color: Colors.black),
                    Expanded(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text("Durée : ",
                              style: defaultFont.merge(const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black))),
                          Text(formatDuration(entry.timer),
                              style: defaultFont
                                  .merge(const TextStyle(color: Colors.black)))
                        ],
                      ),
                    )
                  ],
                ))));
  }
}
