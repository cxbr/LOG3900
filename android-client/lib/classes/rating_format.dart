class RatingFormat {
  int rating;
  String gameName;

  RatingFormat({required this.rating, required this.gameName});

  Map<String, dynamic> toJson() {
    return {
      'rating': rating,
      'gameName': gameName,
    };
  }
}
