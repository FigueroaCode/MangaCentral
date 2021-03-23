import { Component, OnInit, ViewChildren, AfterViewInit, QueryList } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { AuthService } from '../shared/services/auth.service';
import { FirebaseService } from '../shared/services/firebase.service';
import { HttpClient } from '@angular/common/http';
import { Manga } from '../shared/interfaces/manga';
import { MangaItem } from '../shared/interfaces/mangaitem';
import { MangaItemDataSource } from '../shared/DataSources/MangaItemDataSource';
import { MangaDataSource } from '../shared/DataSources/MangaDataSource';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnInit, AfterViewInit {
  displayedColumns = ['mangas'];
  mangaItemDataSource: MangaItemDataSource;
  mangaDataSource: MangaDataSource;

  @ViewChildren(MatPaginator) paginator!: QueryList<MatPaginator>;

  mangaSites = ['manga4life.com'];
  selectedSite = 'manga4life.com';
  showSubs = true;

  mangas: Array<Manga> = [];
  // TODO: Don't let adding of already subscribed mangas
  mangaSubscriptions: Array<MangaItem> = [];

  constructor(
    public authService: AuthService,
    public fbService: FirebaseService,
    private httpClient: HttpClient) {
    this.mangaItemDataSource = new MangaItemDataSource(this.fbService, this.httpClient);
    this.mangaDataSource = new MangaDataSource(this.httpClient);
  }

  ngOnInit(): void {
    this.mangaItemDataSource.loadMangas();
  }

  ngAfterViewInit() {
    // Pagination for Manga Items
    this.paginator.toArray()[0].page.pipe(
      tap(() => this.mangaItemDataSource.setContent(
        this.paginator.toArray()[0].pageIndex, this.paginator.toArray()[0].pageSize))
    ).subscribe();
    // Pagination for Manga search results
    this.paginator.toArray()[1].page.pipe(
      tap(() => this.mangaDataSource.setContent(
        this.paginator.toArray()[1].pageIndex, this.paginator.toArray()[1].pageSize))
    ).subscribe();
  }

  searchMangaSite(mangaKeywords: string) {
    this.mangaDataSource.search(
      this.selectedSite, mangaKeywords,
      this.paginator.toArray()[1].pageIndex, this.paginator.toArray()[1].pageSize)
  }

  subscribe(manga: Manga) {
    this.fbService.saveManga(manga, this.selectedSite);
  }

  removeSubscription(id: string) {
    this.fbService.removeManga(id);
  }

  toggleView() {
    this.showSubs = !this.showSubs;
  }
}
