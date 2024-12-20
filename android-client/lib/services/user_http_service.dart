import 'dart:convert';
import 'dart:io';

import 'package:android_client/classes/game_rating.dart';
import 'package:android_client/classes/user.dart';
import 'package:android_client/services/project_constants_service.dart';
import 'package:http/http.dart' as http;

class UserHttpService {
  final String baseUrl = ProjectConstantsService.serverAddress;
  final http.Client httpClient;

  UserHttpService(this.httpClient);

  Future<String> signUp(NewUser newUser) async {
    final response = await httpClient.post(
      Uri.parse('$baseUrl/user/signup'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(newUser.toJson()),
    );
    if (response.statusCode == HttpStatus.badRequest) {
      throw Exception("Ce nom d'utilisateur est déjà pris");
    } else if (response.statusCode == HttpStatus.conflict) {
      throw Exception("Cette addresse courriel est déjà utilisée");
    } else if (response.statusCode == HttpStatus.created) {
      return response.body.toString();
    } else {
      throw Exception('Une erreur est survenue');
    }
  }

  Future<User> login(LoginUser user) async {
    final response = await httpClient.post(
      Uri.parse('$baseUrl/user/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(user.toJson()),
    );
    if (response.statusCode == HttpStatus.badRequest) {
      throw Exception('Utilisateur déjà connecté');
    } else if (response.statusCode == HttpStatus.ok) {
      return User.fromJson(json.decode(response.body));
    } else if (response.statusCode == HttpStatus.unauthorized) {
      throw Exception("Nom d'utilisateur ou mot de passe incorrect");
    } else {
      throw Exception('Une erreur est survenue');
    }
  }

  Future<http.Response> logout(String username) async {
    final response = await httpClient.post(
      Uri.parse('$baseUrl/user/logout/$username'),
      headers: {'Content-Type': 'application/json'},
    );
    if (response.statusCode == HttpStatus.ok) {
      return response;
    } else {
      throw Exception('Une erreur est survenue');
    }
  }

  Future<http.Response> updateConnectionHistory(Connection connection) async {
    final response = await httpClient.post(
      Uri.parse('$baseUrl/user/connections'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(connection.toJson()),
    );
    if (response.statusCode == HttpStatus.ok) {
      return response;
    } else {
      throw Exception('Une erreur est survenue: ' + response.body);
    }
  }

  Future<List<Connection>> getConnection(String username) async {
    final response = await httpClient.get(
      Uri.parse('$baseUrl/user/connections/$username'),
      headers: {'Content-Type': 'application/json'},
    );
    if (response.statusCode == HttpStatus.ok) {
      return (json.decode(response.body) as List)
          .map((e) => Connection.fromJson(e))
          .toList();
    } else {
      throw Exception('Une erreur est survenue');
    }
  }

  Future<List<String>> getPredefinedAvatars() async {
    final response = await httpClient.get(Uri.parse('$baseUrl/user/avatars'));
    if (response.statusCode == HttpStatus.ok) {
      List<dynamic> data = json.decode(response.body);
      List<String> picUrls = data.map((url) => url as String).toList();
      picUrls = _fixLocalHostAddress(picUrls);
      return picUrls;
    } else {
      throw Exception("Une erreur est survenue : ${response.statusCode}");
    }
  }

  Future<UserAvatar> setAvatar(UserAvatar avatar) async {
    final response = await httpClient.patch(Uri.parse('$baseUrl/user/avatar'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(avatar.toJson()));
    if (response.statusCode == HttpStatus.ok) {
      return UserAvatar.fromJson(json.decode(response.body));
    } else {
      throw Exception('Une erreur est survenue : ${response.statusCode}');
    }
  }

  static String getReplacedUrl(String url) {
    return url.replaceAll(
        "http://localhost:3000", ProjectConstantsService.serverBaseAddress);
  }

  // This function is used to fix the localhost address to the local machine
  // address so that the images work on the emulator
  List<String> _fixLocalHostAddress(List<String> picUrlList) {
    List<String> modifiedList = picUrlList.map(getReplacedUrl).toList();

    return modifiedList;
  }

  Future<http.Response> updateUsername(UpdateUsername user) async {
    final response = await httpClient.put(
      Uri.parse('$baseUrl/user/update-username'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(user.toJson()),
    );
    if (response.statusCode == HttpStatus.ok) {
      return response;
    } else {
      var errorMessage = 'Une erreur est survenue';
      if (response.statusCode == HttpStatus.badRequest) {
        errorMessage = 'Ce nom d\'utilisateur est déjà pris';
      }
      throw Exception(errorMessage);
    }
  }

  Future<GameRating> getAverageReviews(String gameName) async {
    final response = await http.get(
      Uri.parse('$baseUrl/game/gameReviews/$gameName'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      return GameRating.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load username');
    }
  }

  Future<http.Response> sendFCMtoken(String token) async {
    final response = await http.post(
      Uri.parse('$baseUrl/user/fcm-token'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'token': token}),
    );
    if (response.statusCode == HttpStatus.ok) {
      return response;
    } else {
      throw Exception('Une erreur est survenue');
    }
  }

  Future<ResetPasswordUser> getUserByEmail(String email) async {
    final response = await httpClient.get(
      Uri.parse('$baseUrl/user/by-email/$email'),
      headers: {'Content-Type': 'application/json'},
    );
    if (response.statusCode == HttpStatus.ok) {
      return ResetPasswordUser.fromJson(json.decode(response.body));
    } else {
      var errorMessage = 'Une erreur est survenue';
      if (response.statusCode == HttpStatus.notFound) {
        errorMessage = "Cet email n'est pas associé à un utilisateur";
      }
      throw Exception(errorMessage);
    }
  }

  Future<http.Response> sendPasswordRecuperationEmail(String email) async {
    final response = await httpClient.post(
      Uri.parse('$baseUrl/user/send-recup-email'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email}),
    );
    if (response.statusCode == HttpStatus.ok) {
      return response;
    } else {
      throw Exception('Une erreur est survenue');
    }
  }

  Future<http.Response> verifyCode(String code) async {
    final response = await httpClient.post(
      Uri.parse('$baseUrl/user/verify-code'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'code': code}),
    );
    if (response.statusCode == HttpStatus.badRequest) {
      throw Exception('Code invalide');
    } else {
      return response;
    }
  }

  Future<http.Response> updatePassword(UpdateUsername user) async {
    final response = await httpClient.put(
      Uri.parse('$baseUrl/user/update-password'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(user.toJson()),
    );
    if (response.statusCode == HttpStatus.ok) {
      return response;
    } else {
      throw Exception('Une erreur est survenue');
    }
  }

  Future<String> getUsername(String id) async {
    final response = await http.get(Uri.parse('$baseUrl/user/id/$id'));
    if (response.statusCode == 200) {
      return response.body;
    } else {
      throw Exception('Failed to load username');
    }
  }

  Future<UserProfileUI> getUsernameUI(String userId) async {
    final response =
        await http.get(Uri.parse('$baseUrl/user/username-color/$userId'));
    if (response.statusCode == 200) {
      return UserProfileUI.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load username color');
    }
  }

  Future<String> getUserIdByUsername(String username) async {
    final response =
        await http.get(Uri.parse('$baseUrl/user/username/$username'));
    if (response.statusCode == 200) {
      return response.body;
    } else {
      throw Exception('Failed to load user id');
    }
  }

  Future<List<UserProfile>> getUserList(String userId) async {
    final response = await httpClient.get(
      Uri.parse('$baseUrl/user/list/$userId'),
    );
    if (response.statusCode == HttpStatus.ok) {
      List<dynamic> data = json.decode(response.body);
      List<UserProfile> profileList =
          await Future.wait(data.map((profile) async {
        UserProfile jsonProfile = await UserProfile.fromJson(profile);
        jsonProfile.avatar = _fixLocalHostAddress([jsonProfile.avatar])[0];
        return jsonProfile;
      }).toList());
      return profileList;
    } else {
      var errorMessage = 'Une erreur est survenue';
      throw Exception("${response.statusCode}: $errorMessage");
    }
  }

  Future<List<String>> getFriendList(String userId) async {
    final http.Response response = await httpClient.get(
      Uri.parse('$baseUrl/user/friend-list/$userId'),
    );
    if (response.statusCode == HttpStatus.ok) {
      List<dynamic> data = json.decode(response.body);
      List<String> friendList = await Future.wait(data.map((friend) async {
        return friend.toString();
      }).toList());
      return friendList;
    } else {
      var errorMessage = 'Une erreur est survenue';
      throw Exception("${response.statusCode}: $errorMessage");
    }
  }

  Future<String> getFriendNotificationCount(String id) async {
    final http.Response response =
        await http.get(Uri.parse('$baseUrl/user/friend-requests/$id'));
    if (response.statusCode == HttpStatus.ok) {
      return response.body;
    } else {
      throw Exception('Failed to retrieve friend notification count');
    }
  }
}
