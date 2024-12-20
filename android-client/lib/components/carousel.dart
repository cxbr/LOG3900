import 'package:android_client/classes/game_data.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/config_card.dart';
import 'package:android_client/components/select_card.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/remote_games_manager_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

enum CardType { selectCard, configCard }

class Carousel extends StatefulWidget {
  final CardType cardType;

  const Carousel({super.key, required this.cardType});

  @override
  CarouselState createState() => CarouselState();
}

class CarouselState extends State<Carousel> {
  final CarouselController _carouselController = CarouselController();
  final RemoteGamesManagerService _remoteGamesManagerService =
      RemoteGamesManagerService();
  List<GameData> _games = [];
  int _currentPage = 0;
  List<GameData> _gameData = [];

  @override
  void initState() {
    super.initState();
    initGamesList();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      if (_games.isEmpty)
        SizedBox(
          width: MediaQuery.of(context).size.width,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                      text:
                          "Aucun jeu existant. \nVeuillez créer un jeu dans le client Windows.",
                      style: defaultFont.copyWith(
                        color: Provider.of<ThemeModel>(context, listen: false)
                            .textColor,
                      )))
            ],
          ),
        ),
      Center(
        child: CarouselSlider.builder(
          itemCount: _games.length,
          carouselController: _carouselController,
          itemBuilder: (context, index, realIndex) {
            return _buildCard(_games[index]);
          },
          options: CarouselOptions(
            height: 500,
            enableInfiniteScroll: false,
            viewportFraction: 1.0,
            onPageChanged: (index, reason) {
              setState(() {
                _currentPage = index;
              });
            },
          ),
        ),
      ),
      Center(
          child: Container(
        padding: EdgeInsets.symmetric(
            horizontal: MediaQuery.of(context).size.width * 0.05),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            DefaultButton(
                icon: Icons.arrow_back_ios_new_rounded,
                onPressed:
                    _currentPage > 0 ? _carouselController.previousPage : null),
            DefaultButton(
                icon: Icons.arrow_forward_ios_rounded,
                onPressed: _currentPage < _games.length - 1
                    ? _carouselController.nextPage
                    : null),
          ],
        ),
      ))
    ]);
  }

  Widget _buildCard(GameData game) {
    switch (widget.cardType) {
      case CardType.selectCard:
        return SelectCard(gameCardData: game);
      case CardType.configCard:
        return ConfigCard(gameCardData: game);
    }
  }

  Future<void> initGamesList() async {
    var result = await _remoteGamesManagerService.getAllRemoteGames();
    // Update the state with the fetched remote games
    setState(() {
      _games = result;
    });
  }
}
