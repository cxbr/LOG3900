import 'package:android_client/components/buttons/aligned_button.dart';
import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/constants/style.dart';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

enum CameraSide { front, back }

class CameraService {
  late Function onCameraSwitched;
  bool _isSwitchingCamera = false;
  bool isFrontCamera = true;
  late List<CameraDescription> _cameras;
  late CameraDescription _camera;
  late CameraController controller;

  CameraService() {
    WidgetsFlutterBinding.ensureInitialized();
  }

  Future<void> setCamera() async {
    // Obtain a list of the available cameras on the device.
    _cameras = await availableCameras();

    // Get a specific camera from the list of available cameras.
    _camera = isFrontCamera ? _cameras[1] : _cameras[0];

    controller = CameraController(
        // Get a specific camera from the list of available cameras.
        _camera,
        // Define the resolution to use.
        ResolutionPreset.medium,
        enableAudio: false);

    // Next, initialize the controller. This returns a Future.
    return controller.initialize();
  }

  Future<void> switchCamera() async {
    if (_isSwitchingCamera) {
      return;
    }

    _isSwitchingCamera = true;

    try {
      await controller.dispose();

      isFrontCamera = !isFrontCamera;
      await setCamera();

      onCameraSwitched();
    } finally {
      _isSwitchingCamera = false;
    }
  }

  Widget loadCamera(context, snapshot, callback) {
    if (snapshot.connectionState == ConnectionState.done) {
      // If the Future is complete, display the preview.
      return Column(children: [
        AlignedButton(
            button: DefaultButton(
              buttonText: "Annuler",
              onPressed: () => Navigator.pop(context),
            ),
            rowAlignment: MainAxisAlignment.start),
        Container(
          decoration: defaultBoxDecoration.copyWith(
              border: Border.all(color: Colors.white, width: 10.0)),
          width: 800,
          child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: CameraPreview(controller)),
        ),
        const SizedBox(
          height: 20.0,
        ),
        SizedBox(
          width: 200,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Center(
                child: DefaultButton(
                  icon: Icons.camera_alt,
                  onPressed: callback,
                  customStyle: defaultSquarishButtonStyle,
                ),
              ),
              DefaultButton(
                icon: Icons.autorenew_rounded,
                onPressed: () async {
                  await switchCamera();
                },
                customStyle: defaultSquarishButtonStyle,
              )
            ],
          ),
        ),
      ]);
    } else {
      // Otherwise, display a loading indicator.
      return const Center(child: CircularProgressIndicator());
    }
  }

  Future<PermissionStatus> checkCameraAccess(context) async {
    final bool isGranted = await Permission.camera.isGranted;
    if (!isGranted) {
      PermissionStatus permission = await Permission.camera.request();
      return permission;
    }
    return PermissionStatus.granted;
  }
}
