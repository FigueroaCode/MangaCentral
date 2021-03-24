import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FirebaseService } from '../services/firebase.service';
import { Subscription } from '../interfaces/subscription';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as moment from 'moment';
import { MatPaginator } from '@angular/material/paginator';

export class SubscriptionDataSource implements DataSource<Subscription> {
  private mangasSubject = new BehaviorSubject<Subscription[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private lengthSubject = new BehaviorSubject<number>(0);

  private paginator!: MatPaginator;

  private subscriptions: Subscription[] = [];
  private pendingMangas: Subscription[] = [];

  private BATCH_SIZE = 30;
  private DEFAULT_PAGE_INDEX = 0;
  private DEFAULT_PAGE_SIZE = 5;

  public loading$ = this.loadingSubject.asObservable();
  public length$ = this.lengthSubject.asObservable();

  constructor(private fbService: FirebaseService, private httpClient: HttpClient) {
    // TODO: Properly unsubscribe from all subscriptions
    this.fbService.subscriptionAdded()
      .pipe(catchError(() => of([])))
      .subscribe(snapshot => {
        for (let snap of snapshot) {
          if (this.shouldUpdateLatest(snap.release_date, snap.scheduledRefresh)) {
            this.pendingMangas.push(snap);
          }
        }
        this.updateLatest();
      });
  }
  // TODO: Make time diff adjustable and add button to manually update
  private shouldUpdateLatest(release_date: string, timeLimit: number) {
    if (release_date !== '') {
      const timeDiff = Math.abs(moment(release_date, 'MM/DD/YYYY').diff(moment.now(), 'days'));
      return timeDiff >= timeLimit;
    }
    return true;
  }

  setPaginator(pag: MatPaginator) {
    this.paginator = pag;
  }

  connect(collectionViewer: CollectionViewer): Observable<Subscription[] | readonly Subscription[]> {
    return this.mangasSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.mangasSubject.complete();
    this.loadingSubject.complete();
    this.lengthSubject.complete();
  }

  loadMangas() {
    this.loadingSubject.next(true);

    this.fbService.getSubscriptions()
      .pipe(catchError(() => of([])))
      .subscribe(snapshot => {
        if (snapshot) {
          this.subscriptions = snapshot;
          this.lengthSubject.next(this.subscriptions.length);
          this.setContent();
          this.loadingSubject.next(false);
        }
      });
  }

  updateLatest() {
    while (this.pendingMangas.length > 0) {
      const batch = this.pendingMangas.slice(0, this.BATCH_SIZE);

      this.httpClient.post(`${environment.api_url}/latest`, JSON.stringify({ 'mangas': batch }))
        .subscribe(latest_data => {
          if ('mangas' in latest_data) {
            const mangas = latest_data['mangas'] as Array<Subscription>;
            for (let manga of mangas) {
              this.fbService.updateLatestChapter(
                manga.id, manga.latest_chapter, manga.release_date, manga.chapter_link);
            }
          }
        });
      // Remove the current batch from queue
      this.pendingMangas.splice(0, this.BATCH_SIZE);
    }
  }

  setContent() {
    this.mangasSubject.next(this.handlePaging());
  }
  // TODO: When deleting if there are no more items on the page,
  // it should reset to the previous page
  private handlePaging(): Subscription[] {
    const curMangas: Subscription[] = [];
    const pageSize = this.paginator ? this.paginator.pageSize : this.DEFAULT_PAGE_SIZE;
    const pageIndex = this.paginator ? this.paginator.pageIndex : this.DEFAULT_PAGE_INDEX;

    for (let i = 0; i < pageSize; i++) {
      const index = i + pageIndex * pageSize;
      const manga = this.subscriptions[index];
      if (manga) {
        curMangas.push(manga);
      } else {
        break;
      }
    }

    return curMangas;
  }
}
