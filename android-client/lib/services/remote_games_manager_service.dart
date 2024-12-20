import 'dart:convert';

import 'package:android_client/classes/game_data.dart';
import 'package:android_client/services/project_constants_service.dart';
import 'package:http/http.dart' as http;

class RemoteGamesManagerService {
  static final RemoteGamesManagerService _instance =
      RemoteGamesManagerService._internal();

  factory RemoteGamesManagerService() {
    return _instance;
  }

  RemoteGamesManagerService._internal();

  Future<String> sendGetRequest(String url) async {
    Uri uri = Uri.parse(url);
    final response = await http.get(uri);

    if (response.statusCode == 200) {
      return response.body;
    } else {
      throw Exception(
          'GET at $url failed with status code ${response.statusCode}');
    }
  }

  Future<GameData> getGame(String name) async {
    String jsonResult = await sendGetRequest(
        "${ProjectConstantsService.serverAddress}/game/$name");

    GameData gameData = GameData.fromJson(json.decode(jsonResult));

    fixLocalHostAddress([gameData]);

    return gameData;
  }

  Future<List<GameData>> getAllRemoteGames() async {
    String jsonResult =
        await sendGetRequest("${ProjectConstantsService.serverAddress}/game");

    List<GameData> gameDataList = (json.decode(jsonResult) as List<dynamic>)
        // ignore: unnecessary_lambdas
        .map((json) => GameData.fromJson(json))
        .toList();

    fixLocalHostAddress(gameDataList);

    return gameDataList;
  }

  // This function is used to fix the localhost address to the local machine
  // address so that the images work on the emulator
  void fixLocalHostAddress(List<GameData> gameDataList) {
    for (GameData gameData in gameDataList) {
      gameData.image1url = getReplacedUrl(gameData.image1url);
      gameData.image2url = getReplacedUrl(gameData.image2url);
    }
  }

  String getReplacedUrl(String url) {
    return url.replaceAll(
        "http://localhost:3000", ProjectConstantsService.serverBaseAddress);
  }
}
