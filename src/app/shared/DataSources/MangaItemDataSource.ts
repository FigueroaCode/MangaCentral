import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FirebaseService } from '../services/firebase.service';
import { MangaItem } from '../interfaces/mangaitem';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Chapter {
  release_date: string;
  latest_chapter: number;
  chapter_link: string;
}

export class MangaItemDataSource implements DataSource<MangaItem> {
  private mangasSubject = new BehaviorSubject<MangaItem[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private lengthSubject = new BehaviorSubject<number>(0);

  private mangaItems: MangaItem[] = [];
  private chapterMap = new Map<string, Chapter>();
  private pendingMangas: MangaItem[] = [];

  private BATCH_SIZE = 30;

  public loading$ = this.loadingSubject.asObservable();
  public length$ = this.lengthSubject.asObservable();

  constructor(private fbService: FirebaseService, private httpClient: HttpClient) {
    this.fbService.subscriptionAdded()
      .pipe(catchError(() => of([])))
      .subscribe(snapshot => {
        // update latest chapter
        this.pendingMangas.push(...snapshot);
        this.updateLatest();
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<MangaItem[] | readonly MangaItem[]> {
    return this.mangasSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.mangasSubject.complete();
    this.loadingSubject.complete();
    this.lengthSubject.complete();
  }
  // TODO: Save latest manga in db, only update
  // if it has been a week since the previous update
  // (make this time diff adjustable and add button to manually update)
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

  getLatest(id: string): Chapter {
    if (this.chapterMap.has(id)) {
      return this.chapterMap.get(id) as Chapter;
    }
    return { release_date: '', latest_chapter: 0, chapter_link: '' };
  }

  updateLatest() {
    while (this.pendingMangas.length > 0) {
      const batch = this.pendingMangas.slice(0, this.BATCH_SIZE);

      this.httpClient.post(`${environment.api_url}/latest`, JSON.stringify({ 'mangas': batch }))
        .subscribe(latest_data => {
          if ('mangas' in latest_data) {
            const mangas = latest_data['mangas'] as Array<MangaItem>;
            for (let manga of mangas) {
              const chapter = {
                'chapter_link': manga.chapter_link,
                'release_date': manga.release_date,
                'latest_chapter': manga.latest_chapter
              };
              this.chapterMap.set(manga.id, chapter);
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
