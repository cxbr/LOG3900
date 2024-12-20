class Vec2 {
  final double x;
  final double y;

  Vec2(this.x, this.y);

  Map<String, dynamic> toJson() {
    return {
      'x': x.toInt(),
      'y': y.toInt(),
    };
  }

  factory Vec2.fromJson(Map<String, dynamic> json) {
    return Vec2(
      json['x'].toDouble(),
      json['y'].toDouble(),
    );
  }
}
