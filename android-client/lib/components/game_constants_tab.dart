import 'package:android_client/classes/stats_user.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/config_http_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:flutter/material.dart';

class GameStatisticsPage extends StatefulWidget {
  @override
  _GameStatisticsPageState createState() => _GameStatisticsPageState();
}

class _GameStatisticsPageState extends State<GameStatisticsPage> {
  final ConfigHttpService configHttpService = ConfigHttpService();

  num numberGames = 0;
  num numberWinGames = 0;
  num averageGameDiff = 0.0;
  num averageTimerGame = 0;
  @override
  void initState() {
    super.initState();
    getStatsFromServer();
  }

  Future<void> getStatsFromServer() async {
    String userId = UserService.loggedInUser?.id ?? "";
    String username = UserService.loggedInUser?.username ?? "";
    StatsUser stats = await configHttpService.getStats(userId, username);

    setState(() {
      numberGames = stats.countGame;
      numberWinGames = stats.countGameWin;
      averageGameDiff = stats.averageDiff;
      averageTimerGame = stats.averageTimer;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 1000,
            height: 600,
            child: Container(
              decoration: defaultBoxDecoration,
              child: Column(children: [
                const Padding(
                  padding: EdgeInsets.all(20.0),
                  child: Text("Bilan des parties", style: defaultFontTitle),
                ),
                Container(
                    height: 400,
                    child: Center(
                        child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          height: 20,
                        ),
                        BarStats(
                            stats: numberGames.toString(),
                            statsDescription: "Nombre de parties jouées"),
                        const SizedBox(
                          height: 20,
                        ),
                        BarStats(
                            stats: numberWinGames.toString(),
                            statsDescription: "Nombre de parties gagnées"),
                        const SizedBox(
                          height: 20,
                        ),
                        BarStats(
                            stats: averageGameDiff.toString(),
                            statsDescription:
                                "Moyenne de différences trouvées par partie"),
                        const SizedBox(
                          height: 20,
                        ),
                        BarStats(
                            stats: formatTime(averageTimerGame),
                            statsDescription: "Temps moyen par partie")
                      ],
                    )))
              ]),
            ),
          ),
        ],
      ),
    );
  }

  String formatTime(num time) {
    final num totalSeconds = time ~/ 1000;
    final num minutes = totalSeconds ~/ 60;
    final num seconds = totalSeconds % 60;
    String formatedTimeMinutes = minutes.toString();
    String formatedTimeSeconds = seconds.toString();
    if (minutes < 10) {
      formatedTimeMinutes = formatedTimeMinutes.padLeft(2, '0');
    }
    if (seconds < 10) {
      formatedTimeSeconds = formatedTimeSeconds.padLeft(2, '0');
    }
    return '$formatedTimeMinutes:$formatedTimeSeconds';
  }
}

class BarStats extends StatelessWidget {
  final String statsDescription;
  final String stats;

  const BarStats(
      {super.key, required this.stats, required this.statsDescription});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 80,
      width: 900,
      child: Container(
        decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(width: 2),
            borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Center(
                  // Center the text
                  child: Text(
                    statsDescription,
                    style: defaultFont.merge(
                      const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              const VerticalDivider(
                  indent: 30, endIndent: 30, color: Colors.black),
              Expanded(
                child: Center(
                  // Center the text
                  child: Text(
                    stats.toString(),
                    style: defaultFont.merge(
                      const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
