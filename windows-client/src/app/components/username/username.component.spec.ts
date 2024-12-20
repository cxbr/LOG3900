import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChildrenOutletContexts, UrlSerializer } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { UsernameComponent } from './username.component';

describe('UsernameComponent', () => {
    let component: UsernameComponent;
    let fixture: ComponentFixture<UsernameComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule],
            declarations: [UsernameComponent],
            providers: [UrlSerializer, ChildrenOutletContexts],
        }).compileComponents();

        fixture = TestBed.createComponent(UsernameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
