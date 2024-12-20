class DifferencesHashMap {
  int number;
  List<List<int>> differenceMatrix;

  DifferencesHashMap({
    required this.number,
    required this.differenceMatrix,
  });

  factory DifferencesHashMap.fromJson(Map<String, dynamic> json) {
    return DifferencesHashMap(
      number: json['number'],
      differenceMatrix: List<List<int>>.from(
          json['differenceMatrix'].map((dynamic row) => List<int>.from(row))),
    );
  }
}