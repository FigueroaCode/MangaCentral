import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { FirebaseService } from '../shared/services/firebase.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Manga } from '../shared/interfaces/manga';
import { MangaItem } from '../shared/interfaces/mangaitem';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnInit {

  mangaSites = ['manga4life.com'];
  selectedSite = 'manga4life.com';

  mangas: Array<Manga> = [];
  mangaSubscriptions: Array<MangaItem> = [];

  constructor(
    public authService: AuthService,
    public fbService: FirebaseService,
    private httpClient: HttpClient) { }

  ngOnInit(): void {
    this.fbService.getSubscriptions()
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        if (data) {
          this.mangaSubscriptions = data as Array<MangaItem>;
        }
      });
  }

  searchMangaSite(mangaKeywords: string) {
    let url = `${environment.api_url}/search/${this.selectedSite}/${mangaKeywords}`;

    this.httpClient.get(url).subscribe(data => {
      // TODO: Check for status code?
      if ('mangas' in data) {
        this.mangas = data['mangas'] as Array<Manga>;
      }
    });
  }

  subscribe(manga: Manga) {
    this.fbService.saveManga(manga);
  }

  removeSubscription(id: string) {
    this.fbService.removeManga(id);
  }
}
