import 'package:android_client/classes/game_data.dart';
import 'package:android_client/classes/game_rating.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/user_http_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;

class GameCard extends StatefulWidget {
  final GameData gameCardData;
  const GameCard({super.key, required this.gameCardData});

  @override
  _GameCardState createState() => _GameCardState();
}

class _GameCardState extends State<GameCard> {
  late String _usernameFuture = "";
  late final UserHttpService _userHttpService = UserHttpService(http.Client());
  GameRating gameRate = GameRating(numberOfRating: 5, rating: 5);

  @override
  void initState() {
    super.initState();
    if (widget.gameCardData.wantShoutout) {
      _userHttpService
          .getUsername(widget.gameCardData.creator)
          .then((String? username) => <void>{
                setState(() {
                  _usernameFuture = username ?? "";
                })
              });
    }
    _userHttpService
        .getAverageReviews(widget.gameCardData.name)
        .then((GameRating rating) {
      setState(() {
        gameRate = rating;
      });
    }).catchError((error) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text('Error'),
            content: const Text(
                'Failed to load game rating. Please try again later.'),
            actions: <Widget>[
              TextButton(
                child: const Text('OK'),
                onPressed: () {
                  Navigator.of(context).pop();
                },
              ),
            ],
          );
        },
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Container(
        width: MediaQuery.of(context).size.width * 0.5,
        padding: const EdgeInsets.all(8.0),
        decoration: defaultBoxDecoration,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            Text(
              widget.gameCardData.name,
              style: defaultFont,
            ),
            const SizedBox(height: 10),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: <Widget>[
              const Text(
                'Nombre de différences : ',
                style: defaultFont,
              ),
              Text(
                widget.gameCardData.nbDifference.toString(),
                style: defaultFont.merge(
                    TextStyle(color: accentColor, fontWeight: FontWeight.w900)),
              ),
            ]),
            const SizedBox(height: 10),
            if (widget.gameCardData.wantShoutout)
              Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    const Text(
                      'Créateur : ',
                      style: defaultFont,
                    ),
                    Text(
                      _usernameFuture.replaceAll('"', ''),
                      style: defaultFont.merge(TextStyle(
                          color: accentColor, fontWeight: FontWeight.w900)),
                    ),
                  ]),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                const Text(
                  'Note : ',
                  style: defaultFont,
                ),
                Text(
                  '${gameRate.rating.toDouble().toPrecision(1)} ',
                  style: const TextStyle(fontSize: 20, height: 2.75),
                ),
                IgnorePointer(
                  ignoring: true,
                  child: RatingBar.builder(
                    initialRating: gameRate.rating.toDouble(),
                    minRating: 0,
                    direction: Axis.horizontal,
                    allowHalfRating: true,
                    itemCount: 5,
                    itemPadding: const EdgeInsets.symmetric(horizontal: 4.0),
                    itemBuilder: (BuildContext context, _) => const Icon(
                      Icons.star,
                      color: Colors.amber,
                    ),
                    onRatingUpdate: (double userRating) {},
                  ),
                ),
                Text(
                  ' (${gameRate.numberOfRating})',
                  style: const TextStyle(fontSize: 20, height: 2.75),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Center(
              child: Container(
                width: MediaQuery.of(context).size.width * 0.3,
                height: MediaQuery.of(context).size.width * 0.19,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: Colors.black, width: 2),
                  image: DecorationImage(
                    image: NetworkImage(widget.gameCardData.image1url),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
