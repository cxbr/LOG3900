import 'package:android_client/classes/game_data.dart';
import 'package:android_client/debug/debug_game_card.dart';
import 'package:android_client/services/remote_games_manager_service.dart';
import 'package:flutter/material.dart';

class DebugPage extends StatefulWidget {
  const DebugPage({Key? key}) : super(key: key);

  @override
  DebugPageState createState() => DebugPageState();
}

class DebugPageState extends State<DebugPage> {
  List<GameData> remoteGames = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('First Route'),
      ),
      body: Center(
        child: Column(
          children: [
            ElevatedButton(
              child: const Text('Get All Games'),
              onPressed: () async {
                // Fetch remote games when the button is pressed
                // print("Button pressed!");
                var result =
                    await RemoteGamesManagerService().getAllRemoteGames();

                // Update the state with the fetched remote games
                setState(() {
                  remoteGames = result;
                });
              },
            ),
            const SizedBox(
                height:
                    20.0), // Add some spacing between the button and the list
            SizedBox(
              height: 300.0,
              child: Expanded(
                child: ListView.builder(
                  itemCount: remoteGames.length,
                  scrollDirection: Axis.horizontal,
                  itemBuilder: (context, index) {
                    return LittleBoxWidget(
                      name: remoteGames[index].name,
                      imageUrl: remoteGames[index].image1url,
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
