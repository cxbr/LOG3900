export enum ChatEvents {
    MessageSent = 'messageSent',
    RequestSendMessage = 'requestSendMessage',
    RequestListOfChannels = 'requestListOfChannels',
    ListOfChannelsSent = 'listOfChannelsSent',
    RequestJoinChannel = 'requestJoinChannel', // Used to enter a channel
    RequestExitChannel = 'requestExitChannel', // Used to exit from an entered channel
    RequestChannelCreation = "requestChannelCreation",
    RequestChannelDeletion = "requestChannelDeletion",
    RequestChannelSubscription = "requestChannelSubscription",
    RequestChannelUnsubscription = "requestChannelUnsubscription",
    RequestUserSubscribedChannels = "requestUserSubscribedChannels",
    UserSubscribedChannelsSent = "userSubscribedChannelsSent",
    NotifyMessageSentInChannel = "notifyMessageSentInChannel",
    ListOfUsersInSpecificChannelSent = "listOfUsersInSpecificChannelSent",
}
