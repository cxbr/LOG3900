import 'package:flutter/material.dart';

class LittleBoxWidget extends StatelessWidget {
  final String name;
  final String imageUrl;

  const LittleBoxWidget(
      {super.key, required this.name, required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(8.0),
      padding: const EdgeInsets.all(8.0),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.black),
        borderRadius: BorderRadius.circular(8.0),
      ),
      width: 300,
      height: 300,
      child: Column(
        children: [
          Text(
            name,
            style: const TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8.0),
          Image.network(
            imageUrl,
            height: 200.0,
            width: 300.0,
            fit: BoxFit.cover,
          ),
        ],
      ),
    );
  }
}
