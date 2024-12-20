// ignore: avoid_classes_with_only_static_members
class InputFilteringService {
  static bool isMessageVulgar(String message) {
    final List<String> forbiddenWords = <String>[
      'fuck',
      'tabarnak',
      'shit',
      'merde',
      'criss',
      'calisse',
      'caliss',
      'esti',
      'osti',
      'putain',
      'marde',
      'nique',
      'ta gueule',
      'va te faire foutre',
      'connard',
      'trou de cul',
      'enfoiré',
      'baise',
      'league of legends',
      'pute'
    ];

    for (String word in forbiddenWords) {
      if (message.toLowerCase().contains(word.toLowerCase())) {
        return true;
      }
    }

    return false;
  }
}
