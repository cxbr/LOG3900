export const environment = {
    production: true,
    serverUrl: 'http://ec2-35-183-113-250.ca-central-1.compute.amazonaws.com:3000',
};

if (!environment.production) {
    environment.serverUrl = 'http://localhost:3000';
}
