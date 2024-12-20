import 'package:android_client/classes/game_room.dart';
import 'package:android_client/services/socket_service.dart';
import 'package:rxdart/rxdart.dart';

class GameFinderService {
  final SocketService _socketService = SocketService();
  late String gameMode;
  // StreamController<bool> gameExists$ = StreamController<bool>();

  GameFinderService(this.gameMode);

  
  BehaviorSubject<List<GameRoom>> getGames(String? gameName) {
    final controller = BehaviorSubject<List<GameRoom>>();
    
    _socketService.on('games', (dynamic data) {
      if ((gameMode == 'mode Temps Limité' && data['gameMode'] == 'mode Temps Limité') ||
        (gameMode == 'mode Classique' && data['gameName'] == gameName && data['gameMode'] ==  'mode Classique')) {
        if (data['games'].length > 0) {
        controller.add((data['games'] as List).map((gameData) => GameRoom.fromJson(gameData)).toList());
        } else {
          controller.add([]);
        }
      }
    });
    
    _socketService.send('getGames', {'gameMode': gameMode, 'gameName': gameName});
    
    return controller;
  }

}
