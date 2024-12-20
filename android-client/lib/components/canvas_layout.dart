import 'package:flutter/material.dart';

class CanvasWidget extends StatelessWidget {
  final double? width;

  final double? height;

  const CanvasWidget({super.key, this.height = 480.0, this.width = 640.0});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.black, width: 3.0),
      ),
    );
  }
}
