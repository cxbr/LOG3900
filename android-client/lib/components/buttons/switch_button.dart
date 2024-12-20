import 'package:android_client/constants/style.dart';
import 'package:android_client/services/switch_notifier_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class SwitchButton<T extends SwitchStateNotifier> extends StatefulWidget {
  const SwitchButton({super.key});

  @override
  State<SwitchButton> createState() => _SwitchButtonState<T>();
}

class _SwitchButtonState<T extends SwitchStateNotifier>
    extends State<SwitchButton> {
  @override
  Widget build(BuildContext context) {
    final switchState = Provider.of<T>(context);

    return SizedBox(
        width: 150,
        height: 100,
        child: FittedBox(
            fit: BoxFit.fill,
            child: Switch(
              value: switchState.isSwitched,
              onChanged: switchState.updateSwitch,
              thumbColor: MaterialStatePropertyAll(accentColor),
              trackColor: const MaterialStatePropertyAll(Colors.white),
              trackOutlineColor: const MaterialStatePropertyAll(Colors.black),
              trackOutlineWidth: const MaterialStatePropertyAll(1.3),
            )));
  }
}
