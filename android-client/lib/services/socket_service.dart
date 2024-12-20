import 'package:android_client/services/project_constants_service.dart';
import 'package:socket_io_client/socket_io_client.dart' as Io;

class SocketService {
  Io.Socket? _socket;

  static final SocketService _instance = SocketService._internal();

  factory SocketService() {
    return _instance;
  }

  SocketService._internal();

  bool isSocketAlive() {
    if (_socket == null) {
      return false;
    }
    return _socket!.connected;
  }

  connect() {
    if (_socket != null) return;
    _socket = Io.io(
        ProjectConstantsService.serverBaseAddress,
        Io.OptionBuilder()
            .setTransports(['websocket'])
            .setPath('/socket.io')
            .disableAutoConnect()
            .build());
    _socket?.connect();
    _socket?.onConnect((_) {
      print('Connection established');
    });
  }

  disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  on<T>(String event, Function action) {
    _socket?.on(event, action as dynamic);
  }

  off(String event) {
    _socket?.off(event);
  }

  send<T>(String event, [T? data]) {
    if (data != null) {
      _socket?.emit(event, data);
    } else {
      _socket?.emit(event);
    }
  }

  getSocketId() {
    return _socket?.id;
  }
}
