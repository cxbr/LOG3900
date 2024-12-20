import 'package:android_client/classes/game_data.dart';
import 'package:android_client/classes/replay.dart';
import 'package:android_client/services/remote_games_manager_service.dart';
import 'package:android_client/services/replay_http_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:get/get.dart';

class VideoReplayService {
  List<ReplayEvent> events = [];
  GameData? gameData;
  List<GameData> gamesData = [];
  List<GameStateSnapshot> snapshots = [];
  final RemoteGamesManagerService _remoteGamesManagerService =
      RemoteGamesManagerService();
  final ReplayHttpService _replayHttpService = ReplayHttpService();
  static final VideoReplayService _instance = VideoReplayService._internal();

  factory VideoReplayService() {
    return _instance;
  }

  VideoReplayService._internal() {
    getAllGames();
  }

  Future<void> getAllGames() async {
    _remoteGamesManagerService.getAllRemoteGames().then((List<GameData> games) {
      gamesData = games;
    });
  }

  Future<void> getGame(String name) async {
    gameData = await _remoteGamesManagerService.getGame(name);
    gamesData.add(gameData!);
  }

  void recordEvent(ReplayEvent event) {
    event.username = UserService.loggedInUser?.username ?? "";
    events.add(event);
  }

  void setGameData(GameData data) {
    gameData = data;
    clearSavedStates();
  }

  List<ReplayEvent> getReplayData() {
    return events;
  }

  void loadData(Replay data) {
    events = data.events;
    snapshots = data.snapshots;
    GameData? g =
        gamesData.firstWhereOrNull((element) => element.name == data.gameName);
    if (g != null) {
      gameData = g;
    } else {
      _remoteGamesManagerService.getGame(data.gameName).then((GameData game) {
        gameData = game;
      });
    }
  }

  void clearSavedStates() {
    snapshots = [];
    events = [];
  }

  void recordState(GameStateSnapshot snapshot) {
    snapshots.add(snapshot);
  }

  Future<void> saveReplay() async {
    NewReplay newReplay = NewReplay(
      creator: UserService.loggedInUser?.id ?? "",
      gameName: gameData!.name,
      events: events,
      snapshots: snapshots,
    );

    try {
      await _replayHttpService.createNewReplay(newReplay);
      clearSavedStates();
    } catch (error) {
      print(error);
    }
  }

  List<GameStateSnapshot> getReplayStates() {
    return snapshots;
  }
}
