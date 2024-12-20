import { Component } from '@angular/core';
import { Connection } from '@app/interfaces/user';
import { UserHttpService } from '@app/services/user-http/user-http.service';
import { UserService } from '@app/services/user/user.service';

@Component({
    selector: 'app-connection-history',
    templateUrl: './connection-history.component.html',
    styleUrls: ['./connection-history.component.scss'],
})
export class ConnectionHistoryComponent {
    connections: Connection[] = [];

    constructor(private readonly userService: UserService, private readonly userHttpService: UserHttpService) {
        this.getConnectionsFromServer();
    }

    getConnectionsFromServer(): void {
        const userId = this.userService.loggedInUser?._id || '';
        this.userHttpService.getConnectionHistory(userId).subscribe((connections) => {
            this.connections = connections.reverse();
        });
    }
}
