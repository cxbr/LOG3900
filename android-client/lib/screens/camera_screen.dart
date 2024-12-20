// A screen that allows users to take a picture using a given camera.
import 'dart:developer';
import 'dart:io';

import 'package:android_client/screens/picture_preview_screen.dart';
import 'package:android_client/services/camera_service.dart';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;

class CameraScreen extends StatefulWidget {
  final String initialRoute;
  final bool sendRightAway;

  const CameraScreen(
      {super.key, required this.initialRoute, required this.sendRightAway});

  @override
  CameraScreenState createState() => CameraScreenState();
}

class CameraScreenState extends State<CameraScreen> {
  late Future<void> _initializeControllerFuture;
  final CameraService _cameraService = CameraService();

  @override
  void initState() {
    super.initState();
    _initializeControllerFuture = _cameraService.setCamera();
    _cameraService.onCameraSwitched = () {
      setState(() {});
    };
  }

  @override
  void dispose() {
    _cameraService.controller.dispose();
    super.dispose();
  }

  void _flipSavedImage(XFile file) async {
    final image = img.decodeImage(File(file.path).readAsBytesSync());
    if (image != null) {
      final flippedImage = img.flipHorizontal(image);
      final flippedFile = File(file.path);
      await flippedFile.writeAsBytes(img.encodePng(flippedImage));
    }
  }

  void takePicture() async {
    try {
      // Ensure that the camera is initialized.
      await _initializeControllerFuture;

      final image = await _cameraService.controller.takePicture();
      if (_cameraService.isFrontCamera) {
        _flipSavedImage(image);
      }

      if (!mounted) return;

      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => PicturePreviewScreen(
            imagePath: image.path,
            initialRoute: widget.initialRoute,
            sendRightAway: widget.sendRightAway,
          ),
        ),
      );
    } on Exception catch (e) {
      log(e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: FutureBuilder<void>(
            future: _initializeControllerFuture,
            builder: (context, snapshot) {
              return _cameraService.loadCamera(
                context,
                snapshot,
                takePicture,
              );
            }));
  }
}
