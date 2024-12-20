import 'dart:convert';

import 'package:android_client/classes/game_history.dart';
import 'package:android_client/classes/stats_user.dart';
import 'package:android_client/services/project_constants_service.dart';
import 'package:http/http.dart' as http;

class ConfigHttpService {
  static final ConfigHttpService _instance = ConfigHttpService._internal();

  factory ConfigHttpService() {
    return _instance;
  }

  ConfigHttpService._internal();

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

  Future<List<GameHistory>> getHistory(String id) async {
    String jsonResult = await sendGetRequest(
        "${ProjectConstantsService.serverAddress}/config/history/$id");

    List<GameHistory> gameHistoryList =
        (json.decode(jsonResult) as List<dynamic>)
            // ignore: unnecessary_lambdas
            .map((json) => GameHistory.fromJson(json))
            .toList();

    return gameHistoryList;
  }

  Future<StatsUser> getStats(String id, String username) async {
    String jsonResult = await sendGetRequest(
        "${ProjectConstantsService.serverAddress}/config/stats?id=$id&name=$username");
    print(jsonResult);
    StatsUser stats = StatsUser.fromJson(json.decode(jsonResult));

    return stats;
  }

  Future<void> deleteHistory(String username) async {
    Uri uri = Uri.parse(
        "${ProjectConstantsService.serverAddress}/config/history/$username");
    final response = await http.delete(uri);

    if (response.statusCode != 200) {
      throw Exception(
          'DELETE at $uri failed with status code ${response.statusCode}');
    }
  }
}
