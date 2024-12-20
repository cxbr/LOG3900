import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/game_service.dart';
import 'package:android_client/services/play-area_service.dart';
import 'package:flutter/material.dart';

class InfoBoard extends StatefulWidget {
  final bool isCheatModeOn;
  final String? gameName;
  final String? gameMode;
  final String? gameLevel;
  const InfoBoard(
      {super.key,
      this.gameLevel,
      this.gameMode,
      this.gameName,
      required this.isCheatModeOn});

  @override
  InfoBoardState createState() => InfoBoardState();
}

class InfoBoardState extends State<InfoBoard> {
  final PlayAreaService playAreaService = PlayAreaService();
  final GameService _gameService = GameService();

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topRight,
      child: Padding(
        padding: const EdgeInsets.only(right: 40.0, top: 40.0),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8.0),
            border: Border.all(color: Colors.black, width: 2.0),
          ),
          width: 280,
          child: IntrinsicHeight(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  "Informations",
                  style: defaultFont.copyWith(
                      color: Colors.black,
                      fontSize: 25,
                      fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(
                  height: 10,
                ),
                Padding(
                  padding: const EdgeInsets.only(left: 15),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "Nom du jeu : ${widget.gameName}",
                      style: defaultFont.copyWith(
                          color: Colors.black,
                          fontSize: 15,
                          fontWeight: FontWeight.normal),
                    ),
                  ),
                ),
                const SizedBox(
                  height: 10,
                ),
                Padding(
                  padding: const EdgeInsets.only(left: 15),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "${widget.gameMode}",
                      style: defaultFont.copyWith(
                          color: Colors.black,
                          fontSize: 15,
                          fontWeight: FontWeight.normal),
                    ),
                  ),
                ),
                const SizedBox(
                  height: 10,
                ),
                Padding(
                  padding: const EdgeInsets.only(left: 15),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "Nombre de différences : ${widget.gameLevel}",
                      style: defaultFont.copyWith(
                          color: Colors.black,
                          fontSize: 15,
                          fontWeight: FontWeight.normal),
                    ),
                  ),
                ),
                if (widget.isCheatModeOn)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Mode triche :',
                            style: defaultFont.copyWith(
                              color: Colors.black,
                              fontSize: 15,
                            ),
                          ),
                          DefaultButton(
                            customStyle: defaultSquarishButtonStyle.copyWith(
                                padding:
                                    const MaterialStatePropertyAll<EdgeInsets>(
                                        EdgeInsets.all(20))),
                            icon: Icons.remove_red_eye_rounded,
                            onPressed: cheat,
                          ),
                        ]),
                  )
              ],
            ),
          ),
        ),
      ),
    );
  }

  void cheat() {
    if (playAreaService.askingServerCheatMode) return;
    if (!playAreaService.isCheatModeOn) {
      playAreaService.askingServerCheatMode = true;
      _gameService.isCheatModeOn();
    } else {
      playAreaService.cheatMode();
    }
  }
}
