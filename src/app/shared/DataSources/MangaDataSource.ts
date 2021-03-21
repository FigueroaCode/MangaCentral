import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Manga } from '../interfaces/manga';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export class MangaDataSource implements DataSource<Manga> {
  private mangasSubject = new BehaviorSubject<Manga[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private lengthSubject = new BehaviorSubject<number>(0);

  private curMangas: Manga[] = [];

  public loading$ = this.loadingSubject.asObservable();
  public length$ = this.lengthSubject.asObservable();

  constructor(private httpClient: HttpClient) { }

  connect(collectionViewer: CollectionViewer): Observable<Manga[] | readonly Manga[]> {
    return this.mangasSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.mangasSubject.complete();
    this.loadingSubject.complete();
    this.lengthSubject.complete();
  }

  search(site: string, keywords: string, pageIndex: number = 0, pageSize: number = 5) {
    this.loadingSubject.next(true);

    let url = `${environment.api_url}/search/${site}/${keywords}`;
    this.httpClient.get(url).subscribe(data => {
      // TODO: Check for status code?
      if ('mangas' in data) {
        this.curMangas = data['mangas'] as Array<Manga>;
        this.lengthSubject.next(this.curMangas.length);
        // Show the paged results
        this.setContent(pageIndex, pageSize);
        this.loadingSubject.next(false);
      }
    })
  }

  setContent(pageIndex: number = 0, pageSize: number = 5) {
    if (this.curMangas.length > 0) {
      this.mangasSubject.next(this.handlePaging(this.curMangas, pageIndex, pageSize));
    }
  }

  private handlePaging(data: Manga[] | never[], pageIndex: number, pageSize: number): Manga[] {
    const curMangas: Manga[] = [];

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
