import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FirebaseService } from '../services/firebase.service';
import { MangaItem } from '../interfaces/mangaitem';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as moment from 'moment';

export class MangaItemDataSource implements DataSource<MangaItem> {
  private mangasSubject = new BehaviorSubject<MangaItem[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private lengthSubject = new BehaviorSubject<number>(0);

  private mangaItems: MangaItem[] = [];
  private pendingMangas: MangaItem[] = [];

  private BATCH_SIZE = 30;

  public loading$ = this.loadingSubject.asObservable();
  public length$ = this.lengthSubject.asObservable();

  constructor(private fbService: FirebaseService, private httpClient: HttpClient) {
    // TODO: Properly unsubscribe from all subscriptions
    this.fbService.subscriptionAdded()
      .pipe(catchError(() => of([])))
      .subscribe(snapshot => {
        for (let snap of snapshot) {
          if (this.shouldUpdateLatest(snap.release_date)) {
            this.pendingMangas.push(snap);
          }
        }
        this.updateLatest();
      });
  }
  // TODO: Make time diff adjustable and add button to manually update
  private shouldUpdateLatest(release_date: string) {
    if (release_date !== '') {
      const timeDiff = Math.abs(moment(release_date, 'MM/DD/YYYY').diff(moment.now(), 'days'));
      return timeDiff > 7;
    }
    return true;
  }

  connect(collectionViewer: CollectionViewer): Observable<MangaItem[] | readonly MangaItem[]> {
    return this.mangasSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.mangasSubject.complete();
    this.loadingSubject.complete();
    this.lengthSubject.complete();
  }

  loadMangas(pageIndex: number = 0, pageSize: number = 5) {
    this.loadingSubject.next(true);

    this.fbService.getSubscriptions()
      .pipe(catchError(() => of([])))
      .subscribe(snapshot => {
        if (snapshot) {
          this.mangaItems = snapshot;
          this.lengthSubject.next(this.mangaItems.length);
          this.setContent(pageIndex, pageSize);
          this.loadingSubject.next(false);
        }
      });
  }

  setContent(pageIndex: number, pageSize: number) {
    this.mangasSubject.next(this.handlePaging(this.mangaItems, pageIndex, pageSize));
  }

  updateLatest() {
    while (this.pendingMangas.length > 0) {
      const batch = this.pendingMangas.slice(0, this.BATCH_SIZE);

      this.httpClient.post(`${environment.api_url}/latest`, JSON.stringify({ 'mangas': batch }))
        .subscribe(latest_data => {
          if ('mangas' in latest_data) {
            const mangas = latest_data['mangas'] as Array<MangaItem>;
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
  // TODO: When deleting from not the first page,
  // after deletion it shows the first page instead of the page it was on
  private handlePaging(data: MangaItem[] | never[], pageIndex: number, pageSize: number): MangaItem[] {
    const curMangas: MangaItem[] = [];

    for (let i = 0; i < pageSize; i++) {
      const index = i + pageIndex * pageSize;
      const manga = data[index];
      if (manga) {
        curMangas.push(manga);
      } else {
        break;
      }
    }

    return curMangas;
  }
}
