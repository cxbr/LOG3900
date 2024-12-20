export class UserGame {
    creator: string;
    currentPlayers: CurrentPlayer[];
    observers?: Observer[];
    gameName: string;
    chosenDifference: number;
    nbDifferenceFound: number;
    differenceFoundByPlayers: PlayerDifferences[];
    timer: number;
    potentialPlayers?: CurrentPlayer[];
    abandonedPlayers?: CurrentPlayer[];
}

export class PlayerDifferences {
    username: string;
    differencesFound: number;
}

export class Observer {
    username: string;
    color: string;
    isAndroid: boolean;
}

export class CurrentPlayer {
    username: string;
    isAndroid: boolean;
}
