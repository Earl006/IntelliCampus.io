import { TestBed } from '@angular/core/testing';

import { CommentReviewService } from './comment-review.service';

describe('CommentReviewService', () => {
  let service: CommentReviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentReviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
