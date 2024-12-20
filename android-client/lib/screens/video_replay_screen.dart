import 'package:android_client/classes/replay.dart';
import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/chat_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/text_input.dart';
import 'package:android_client/components/video_replay_card.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/replay_http_service.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:android_client/services/user_service.dart';
import 'package:android_client/services/video_replay_service.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class VideoReplayScreen extends StatelessWidget {
  const VideoReplayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        resizeToAvoidBottomInset: false,
        body: Column(
          children: [
            AlignedButton(
                button: DefaultButton(
                    buttonText: "Retour",
                    onPressed: () {
                      Navigator.pushNamed(context, "/mainScreen");
                    }),
                rowAlignment: MainAxisAlignment.start,
                screenTitle: "Reprise vidéo"),
            const ChatButton(padding: EdgeInsets.fromLTRB(30.0, 0, 0, 0)),
            const Expanded(child: VideoReplayTabLayout())
          ],
        ));
  }
}

class VideoReplayTabLayout extends StatelessWidget {
  const VideoReplayTabLayout({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Column(children: [
        Container(
            width: 900,
            padding: const EdgeInsets.only(bottom: 10),
            decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(width: 1))),
            child: const VideoReplayTabBar()),
        const Expanded(child: VideoReplayTabBarView()),
      ]),
    );
  }
}

class VideoReplayTabBar extends StatefulWidget {
  const VideoReplayTabBar({super.key});

  @override
  VideoReplayTabBarState createState() => VideoReplayTabBarState();
}

class VideoReplayTabBarState extends State<VideoReplayTabBar> {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          dividerColor: Colors.transparent,
          labelColor: Colors.black,
          indicatorColor: accentColor,
          tabs: [
            Tab(
                child: Text("Reprises globales",
                    style: defaultFont.copyWith(
                        color: Provider.of<ThemeModel>(context, listen: true)
                            .textColor))),
            Tab(
                child: Text("Mes reprises",
                    style: defaultFont.copyWith(
                        color: Provider.of<ThemeModel>(context, listen: true)
                            .textColor))),
          ],
        ),
        const SizedBox(height: 10),
      ],
    );
  }
}

class VideoReplayTabBarView extends StatefulWidget {
  const VideoReplayTabBarView({super.key});

  @override
  VideoReplayTabBarViewState createState() => VideoReplayTabBarViewState();
}

class VideoReplayTabBarViewState extends State<VideoReplayTabBarView> {
  ReplayHttpService replayHttpService = ReplayHttpService();
  UserService userService = UserService();
  List<VideoReplayCard> videoReplays = [];
  List<VideoReplayCard> allReplays = [];
  List<VideoReplayCard> publicReplays = [];
  final VideoReplayService videoReplayService = VideoReplayService();
  final CarouselController _publicCarouselController = CarouselController();
  final CarouselController _ownCarouselController = CarouselController();
  int _currentPublicPage = 0;
  int _currentOwnPage = 0;
  int nbPublicReplays = 0;
  int nbOwnReplays = 0;
  String filter = "";
  FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    videoReplayService.getAllGames();
    replayHttpService.getAllReplays().then((replays) {
      setState(() {
        videoReplays = replays
            .map((Replay replay) => VideoReplayCard(
                  videoReplayData: VideoReplay(
                      replay: replay,
                      isOwnReplay:
                          replay.creator == UserService.loggedInUser?.id,
                      videoReplays: replays),
                  deleteReplay: deleteReplay,
                  changeVisibility: changeVisibility,
                ))
            .toList();
        allReplays = videoReplays;
        _fetchUsernames();
        _setPublicReplays();
      });
      setLengths();
    });
  }

  void setLengths() {
    nbPublicReplays = videoReplays
        .where((VideoReplayCard replay) => replay.videoReplayData.replay.public)
        .length;
    nbOwnReplays = videoReplays
        .where((VideoReplayCard replay) => replay.videoReplayData.isOwnReplay)
        .length;
  }

  void deleteReplay(String replayId) {
    replayHttpService.deleteReplay(replayId).then((_) {
      videoReplays = videoReplays
          .where((VideoReplayCard replay) =>
              replay.videoReplayData.replay.id != replayId)
          .toList();
      setState(() {});
    });
  }

  void changeVisibility(String replayId) async {
    final int replayIndex = allReplays.indexWhere(
        (VideoReplayCard r) => r.videoReplayData.replay.id == replayId);
    if (replayIndex != -1) {
      VideoReplayCard replay = allReplays[replayIndex];
      if (replay.videoReplayData.replay.public) {
        nbPublicReplays--;
      } else {
        nbPublicReplays++;
      }
      replay.videoReplayData.replay.public =
          !replay.videoReplayData.replay.public;
      await replayHttpService.updateReplay(replay.videoReplayData.replay);
      _setPublicReplays();
      setState(() {});
    }
  }

  void _setPublicReplays() {
    publicReplays = allReplays
        .where((VideoReplayCard replay) => replay.videoReplayData.replay.public)
        .toList();
  }

  void _fetchUsernames() {
    for (VideoReplayCard replay in videoReplays) {
      userService
          .getUsernameByUserId(replay.videoReplayData.replay.creator)
          .then((String username) {
        replay.videoReplayData.replay.creatorUsername = username;
        setState(() {});
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 5),
        SizedBox(
          width: 300,
          height: 60,
          child: Row(
            children: <Widget>[
              Expanded(
                child: TextInput(
                  focusNode: _focusNode,
                  hintText: 'Filtrer',
                  onChanged: (String value) {
                    setState(() {
                      filter = value;
                      videoReplays = allReplays
                          .where((VideoReplayCard replay) =>
                              replay.videoReplayData.replay.creatorUsername!
                                  .toLowerCase()
                                  .contains(filter.toLowerCase()) ||
                              replay.videoReplayData.replay.gameName
                                  .toLowerCase()
                                  .contains(filter.toLowerCase()))
                          .toList();
                      nbPublicReplays = videoReplays
                          .where((VideoReplayCard replay) =>
                              replay.videoReplayData.replay.public)
                          .length;
                      nbOwnReplays = videoReplays
                          .where((VideoReplayCard replay) =>
                              replay.videoReplayData.isOwnReplay)
                          .length;
                    });
                  },
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  if (nbPublicReplays == 0)
                    const SizedBox(
                      height: 450,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text("Aucune reprise publique sauvegardée",
                              style: defaultFont)
                        ],
                      ),
                    ),
                  CarouselSlider.builder(
                    itemCount: nbPublicReplays,
                    carouselController: _publicCarouselController,
                    options: CarouselOptions(
                        viewportFraction: 1.0,
                        enableInfiniteScroll: false,
                        onPageChanged:
                            (int index, CarouselPageChangedReason reason) {
                          _focusNode.unfocus();
                          setState(() {
                            _currentPublicPage = index;
                          });
                        }),
                    itemBuilder:
                        (BuildContext context, int index, int realIndex) {
                      List<VideoReplayCard> filteredReplays = videoReplays
                          .where((VideoReplayCard replay) =>
                              replay.videoReplayData.replay.public)
                          .toList();
                      return Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [filteredReplays[index]],
                      );
                    },
                  ),
                  Positioned(
                    left: 70,
                    child: DefaultButton(
                      onPressed: _currentPublicPage > 0
                          ? _publicCarouselController.previousPage
                          : null,
                      icon: Icons.arrow_back_ios_new_rounded,
                    ),
                  ),
                  Positioned(
                    right: 70,
                    child: DefaultButton(
                      onPressed: _currentPublicPage < nbPublicReplays - 1
                          ? _publicCarouselController.nextPage
                          : null,
                      icon: Icons.arrow_forward_ios_rounded,
                    ),
                  ),
                ],
              ),
              Stack(
                alignment: Alignment.center,
                children: [
                  if (nbOwnReplays == 0)
                    const SizedBox(
                      height: 450,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text("Aucune reprise privée sauvegardée",
                              style: defaultFont)
                        ],
                      ),
                    ),
                  CarouselSlider.builder(
                    itemCount: nbOwnReplays,
                    carouselController: _ownCarouselController,
                    options: CarouselOptions(
                        viewportFraction: 1.0,
                        enableInfiniteScroll: false,
                        onPageChanged:
                            (int index, CarouselPageChangedReason reason) {
                          _focusNode.unfocus();
                          setState(() {
                            _currentOwnPage = index;
                          });
                        }),
                    itemBuilder:
                        (BuildContext context, int index, int realIndex) {
                      List<VideoReplayCard> filteredReplays = videoReplays
                          .where((VideoReplayCard replay) =>
                              replay.videoReplayData.isOwnReplay)
                          .toList();
                      return Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [filteredReplays[index]],
                      );
                    },
                  ),
                  Positioned(
                    left: 70,
                    child: DefaultButton(
                      onPressed: _currentOwnPage > 0
                          ? _ownCarouselController.previousPage
                          : null,
                      icon: Icons.arrow_back_ios_new_rounded,
                    ),
                  ),
                  Positioned(
                    right: 70,
                    child: DefaultButton(
                      onPressed: _currentOwnPage < nbOwnReplays - 1
                          ? _ownCarouselController.nextPage
                          : null,
                      icon: Icons.arrow_forward_ios_rounded,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
