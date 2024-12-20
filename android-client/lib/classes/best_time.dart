class BestTime {
  String name;
  int time;

  BestTime({required this.name, required this.time});

  // Factory constructor to create BestTime instance from JSON
  factory BestTime.fromJson(Map<String, dynamic> json) {
    return BestTime(
      name: json['name'],
      time: json['time'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'time': time,
    };
  }
  @override
  String toString() {
    return 'Name: $name, Time: $time';
  }
}
