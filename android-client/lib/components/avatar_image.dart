import 'package:flutter/material.dart';

class ImageAvatar extends StatelessWidget {
  final String avatar;
  final double radius;

  const ImageAvatar({super.key, required this.avatar, this.radius = 50});

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      backgroundImage: NetworkImage(avatar),
      backgroundColor: Colors.white,
      radius: radius,
    );
  }
}
