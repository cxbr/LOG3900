class GameRating {
  num numberOfRating;
  num rating;

  GameRating({required this.numberOfRating, required this.rating});

  factory GameRating.fromJson(Map<String, dynamic> json) {
    return GameRating(
      numberOfRating: json['numberOfRating'],
      rating: json['rating'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': numberOfRating,
      'time': rating,
    };
  }

  @override
  String toString() {
    return 'Name: $numberOfRating, Time: $rating';
  }
}
