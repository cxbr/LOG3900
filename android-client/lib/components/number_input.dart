import 'package:android_client/components/buttons/default_button.dart';
import 'package:android_client/components/text_input.dart';
import 'package:android_client/constants/style.dart';
import 'package:flutter/material.dart';

class NumberInput extends StatefulWidget {
  final int initialValue;
  final int min;
  final int max;
  final TextEditingController _controller;

  NumberInput(
      {super.key,
      required this.min,
      required this.max,
      required this.initialValue})
      : _controller = TextEditingController(text: initialValue.toString());

  @override
  NumberInputState createState() => NumberInputState();
}

class NumberInputState extends State<NumberInput> {
  late int _value;

  @override
  void initState() {
    super.initState();
    _value = widget.initialValue;
  }

  @override
  void dispose() {
    widget._controller.dispose();
    super.dispose();
  }

  void decrement() {
    setState(() {
      _value -= 1;
    });
    widget._controller.text = _value.clamp(widget.min, widget.max).toString();
  }

  void increment() {
    setState(() {
      _value += 1;
    });
    widget._controller.text = _value.clamp(widget.min, widget.max).toString();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
            flex: 1,
            child: Align(
                alignment: Alignment.centerRight,
                child: Text(widget.min.toString(), style: defaultFont))),
        Expanded(
          flex: 3,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              DefaultButton(
                icon: Icons.arrow_left_rounded,
                onPressed: _value > widget.min ? decrement : null,
              ),
              TextInput(
                controller: widget._controller,
                readOnly: true,
                width: 80.0,
                textAlign: TextAlign.center,
              ),
              DefaultButton(
                icon: Icons.arrow_right_rounded,
                onPressed: _value < widget.max ? increment : null,
              ),
            ],
          ),
        ),
        Expanded(
            flex: 1,
            child: Align(
                alignment: Alignment.centerLeft,
                child: Text(widget.max.toString(), style: defaultFont)))
      ],
    );
  }
}
