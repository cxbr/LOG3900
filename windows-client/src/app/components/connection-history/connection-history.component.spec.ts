import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Connection } from '@app/interfaces/user';
import { UserHttpService } from '@app/services/user-http/user-http.service';
import { UserService } from '@app/services/user/user.service';
import { of } from 'rxjs';
import { ConnectionHistoryComponent } from './connection-history.component';

describe('ConnectionHistoryComponent', () => {
    let component: ConnectionHistoryComponent;
    let fixture: ComponentFixture<ConnectionHistoryComponent>;
    let userServiceStub: Partial<UserService>;
    let userHttpServiceStub: Partial<UserHttpService>;

    beforeEach(async () => {
        userServiceStub = {
            loggedInUser: { _id: 'fakeId', username: 'testUser', password: 'testPassword' },
        };

        userHttpServiceStub = {
            getConnectionHistory: jasmine.createSpy('getConnectionHistory').and.returnValue(of<Connection[]>([])),
        };

        await TestBed.configureTestingModule({
            declarations: [ConnectionHistoryComponent],
            providers: [
                { provide: UserService, useValue: userServiceStub },
                { provide: UserHttpService, useValue: userHttpServiceStub },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConnectionHistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
