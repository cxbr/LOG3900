export interface User {
    _id: string;
    username: string;
    password: string;
    avatar?: string;
}

export interface LoginUser {
    username: string;
    password: string;
}

export interface NewUser {
    username: string;
    email: string;
    password: string;
    avatar: string | null;
    avatarData: string | null;
}

export interface UserAvatar {
    _id: string;
    avatar: string | null;
    avatarData: string | null;
}

export interface Connection {
    userId: string;
    username: string;
    connectionType: string;
    connectionTime: number;
}

export interface ResetPasswordUser {
    username: string;
    userId: string;
}
