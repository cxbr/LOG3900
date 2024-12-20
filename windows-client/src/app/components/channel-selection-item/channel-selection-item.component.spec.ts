import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelSelectionItemComponent } from '@app/components/channel-selection-item/channel-selection-item.component';
import { ChannelData } from '@app/interfaces/channel-data';

describe('ChannelSelectionItemComponent', () => {
    let component: ChannelSelectionItemComponent;
    let fixture: ComponentFixture<ChannelSelectionItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChannelSelectionItemComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ChannelSelectionItemComponent);
        component = fixture.componentInstance;
        component.channel = new ChannelData('1', 'Test');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
