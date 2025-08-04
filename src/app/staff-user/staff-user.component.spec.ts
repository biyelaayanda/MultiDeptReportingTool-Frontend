import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffUserComponent } from './staff-user.component';

describe('StaffUserComponent', () => {
  let component: StaffUserComponent;
  let fixture: ComponentFixture<StaffUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StaffUserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
