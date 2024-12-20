import 'package:android_client/components/account_tab_view.dart';
import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/chat_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/game_constants_tab.dart';
import 'package:android_client/components/game_history_tab_view.dart';
import 'package:android_client/constants/style.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class ConfigScreen extends StatelessWidget {
  const ConfigScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: Column(
      children: [
        AlignedButton(
            button: DefaultButton(
                buttonText: "Retour",
                onPressed: () {
                  Navigator.pushNamed(context, "/mainScreen");
                }),
            rowAlignment: MainAxisAlignment.start,
            screenTitle: "Profil"),
        const ChatButton(padding: EdgeInsets.fromLTRB(30.0, 0, 0, 0)),
        const Expanded(child: ConfigTabLayout())
      ],
    ));
  }
}

class ConfigTabLayout extends StatelessWidget {
  const ConfigTabLayout({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Column(children: [
        Container(
            width: 900,
            padding: const EdgeInsets.only(bottom: 10),
            decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(width: 1))),
            child: const ConfigTabBar()),
        //       Add TabBarView with corresponding tab content here
        const Expanded(
            child: Padding(
          padding: EdgeInsets.all(20.0),
          child: ConfigTabBarView(),
        )),
      ]),
    );
  }
}

class ConfigTabBar extends StatelessWidget {
  const ConfigTabBar({super.key});

  @override
  Widget build(BuildContext context) {
    return TabBar(
      dividerColor: Colors.transparent,
      labelColor: Colors.black,
      indicatorColor: accentColor,
      tabs: [
        Tab(
            child: Text("Compte",
                style: defaultFont.copyWith(
                    color: Provider.of<ThemeModel>(context, listen: true)
                        .textColor))),
        Tab(
            child: Text("Historique",
                style: defaultFont.copyWith(
                    color: Provider.of<ThemeModel>(context, listen: true)
                        .textColor))),
        Tab(
            child: Text("Statistiques",
                style: defaultFont.copyWith(
                    color: Provider.of<ThemeModel>(context, listen: true)
                        .textColor))),
      ],
    );
  }
}

class ConfigTabBarView extends StatelessWidget {
  const ConfigTabBarView({super.key});

  @override
  Widget build(BuildContext context) {
    return TabBarView(
      children: [
        const AccountTabView(),
        GameHistoryTabView(),
        GameStatisticsPage()
      ],
    );
  }
}
