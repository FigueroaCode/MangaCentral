import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FirebaseService } from '../services/firebase.service';
import { MangaItem } from '../interfaces/mangaitem';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export class MangaItemDataSource implements DataSource<MangaItem> {
  private mangasSubject = new BehaviorSubject<MangaItem[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private lengthSubject = new BehaviorSubject<number>(0);

  private mangaItems: MangaItem[] = [];

  public loading$ = this.loadingSubject.asObservable();
  public length$ = this.lengthSubject.asObservable();

  constructor(private fbService: FirebaseService, private httpClient: HttpClient) { }

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
      .subscribe(data => {
        if (data) {
          if (data.length > 0) {
            this.httpClient.post(`${environment.api_url}/latest`, JSON.stringify({ 'mangas': data }))
              .subscribe(latest_data => {
                if ('mangas' in latest_data) {   
                  this.mangaItems = latest_data['mangas'] as Array<MangaItem>;
                  this.lengthSubject.next(this.mangaItems.length);
                  this.setContent(pageIndex, pageSize);
                  this.loadingSubject.next(false);
                }
              });
          }
        }
      });
  }

  setContent(pageIndex: number, pageSize: number) {
    this.mangasSubject.next(this.handlePaging(this.mangaItems, pageIndex, pageSize));
  }

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
