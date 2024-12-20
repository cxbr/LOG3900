export class SignupInfoModel {
    private static email: string | null = null;
    private static username: string | null = null;
    private static password: string | null = null;
    private static passwordConf: string | null = null;

    get email(): string | null {
        return SignupInfoModel.email;
    }
    get username(): string | null {
        return SignupInfoModel.username;
    }
    get password(): string | null {
        return SignupInfoModel.password;
    }
    get passwordConf(): string | null {
        return SignupInfoModel.passwordConf;
    }

    static setInfo(info: { [key: string]: string }): void {
        SignupInfoModel.email = info.email;
        SignupInfoModel.username = info.username;
        SignupInfoModel.password = info.password;
        SignupInfoModel.passwordConf = info.passwordConf;
    }

    static resetInfo(): void {
        SignupInfoModel.email = null;
        SignupInfoModel.username = null;
        SignupInfoModel.password = null;
        SignupInfoModel.passwordConf = null;
    }
}
