import 'package:android_client/constants/style.dart';
import 'package:flutter/material.dart';

class ReplayTimer extends StatefulWidget {
  const ReplayTimer({super.key});

  @override
  ReplayTimerState createState() => ReplayTimerState();
}

class ReplayTimerState extends State<ReplayTimer> {
  int _secondsElapsed = 0;
  int secondToMinute = 60;

  @override
  void initState() {
    super.initState();
  }

  String _formatTime(int time) {
    return time.toString().padLeft(2, '0');
  }

  @override
  Widget build(BuildContext context) {
    int minutes = _secondsElapsed ~/ 60;
    int seconds = _secondsElapsed % 60;

    return Scaffold(
        body: Stack(children: [
      Center(
        child: Container(
          padding: const EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(width: 2.0),
            borderRadius: BorderRadius.circular(8.0),
          ),
          child: Text(
            '${_formatTime(minutes)}:${_formatTime(seconds)} ',
            style: defaultFont.copyWith(
              color: Colors.black,
              fontSize: 20,
            ),
          ),
        ),
      ),
    ]));
  }

  @override
  void dispose() {
    super.dispose();
  }
}
