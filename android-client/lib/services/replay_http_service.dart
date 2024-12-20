import 'dart:convert';

import 'package:android_client/classes/replay.dart';
import 'package:android_client/services/project_constants_service.dart';
import 'package:http/http.dart' as http;

class ReplayHttpService {
  static final ReplayHttpService _instance = ReplayHttpService._internal();

  factory ReplayHttpService() {
    return _instance;
  }

  ReplayHttpService._internal();

  Future<List<Replay>> getAllReplays() async {
    final http.Response response = await http
        .get(Uri.parse("${ProjectConstantsService.serverAddress}/replay"));

    if (response.statusCode == 200) {
      List<dynamic> jsonResult = (json.decode(response.body) as List<dynamic>);
      return jsonResult.map((json) => Replay.fromJson(json)).toList();
    } else {
      throw Exception(
          'GET at ${ProjectConstantsService.serverAddress}/replay failed with status code ${response.statusCode}');
    }
  }

  Future<Replay> getReplay(String id) async {
    final http.Response response = await http
        .get(Uri.parse("${ProjectConstantsService.serverAddress}/replay/$id"));

    if (response.statusCode == 200) {
      return Replay.fromJson(json.decode(response.body));
    } else {
      throw Exception(
          'GET at ${ProjectConstantsService.serverAddress}/replay/$id failed with status code ${response.statusCode}');
    }
  }

  Future<void> createNewReplay(NewReplay replay) async {
    final http.Response response = await http.post(
      Uri.parse("${ProjectConstantsService.serverAddress}/replay"),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(replay.toJson()),
    );

    if (response.statusCode != 201) {
      throw Exception(
          'POST at ${ProjectConstantsService.serverAddress}/replay failed with status code ${response.statusCode}');
    }
  }

  Future<void> updateReplay(Replay replay) async {
    final http.Response response = await http.put(
      Uri.parse("${ProjectConstantsService.serverAddress}/replay"),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(replay.toJson()),
    );

    if (response.statusCode != 200) {
      throw Exception(
          'PUT at ${ProjectConstantsService.serverAddress}/replay failed with status code ${response.statusCode}');
    }
  }

  Future<void> deleteReplay(String id) async {
    final http.Response response = await http.delete(
      Uri.parse("${ProjectConstantsService.serverAddress}/replay/$id"),
    );

    if (response.statusCode != 200) {
      throw Exception(
          'DELETE at ${ProjectConstantsService.serverAddress}/replay/$id failed with status code ${response.statusCode}');
    }
  }

  Future<void> deleteAllReplays() async {
    final http.Response response = await http.delete(
      Uri.parse("${ProjectConstantsService.serverAddress}/replay"),
    );

    if (response.statusCode != 200) {
      throw Exception(
          'DELETE at ${ProjectConstantsService.serverAddress}/replay failed with status code ${response.statusCode}');
    }
  }
}
