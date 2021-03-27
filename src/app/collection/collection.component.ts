import { Component, OnInit, ViewChildren, AfterViewInit, QueryList } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { AuthService } from '../shared/services/auth.service';
import { FirebaseService } from '../shared/services/firebase.service';
import { HttpClient } from '@angular/common/http';
import { Manga } from '../shared/interfaces/manga';
import { Subscription } from '../shared/interfaces/subscription';
import { SubscriptionDataSource } from '../shared/DataSources/SubscriptionDataSource';
import { MangaDataSource } from '../shared/DataSources/MangaDataSource';
import { tap, take, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import * as moment from 'moment';

interface DatetimeOption {
  name: string;
  timeInDays: number;
}

interface Chapter {
  chapter_number: number;
  date: string;
  link: string;
}

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnInit, AfterViewInit {
  default_img = '/assets/images/no_manga_img.png'

  displayedColumns = ['mangas'];
  subscriptionDataSource: SubscriptionDataSource;
  mangaDataSource: MangaDataSource;

  @ViewChildren(MatPaginator) paginator!: QueryList<MatPaginator>;

  mangaSites = ['manga4life.com', 'manganelo.com', 'leviatanscans.com', 'reaperscans.com'];
  selectedSite = 'manga4life.com';

  timeUpdateOptions: DatetimeOption[] = [
    {
      name: 'Every day',
      timeInDays: 1
    },
    {
      name: 'Every week',
      timeInDays: 7
    },
    {
      name: 'Every month',
      timeInDays: 30
    }
  ];

  showSubs = true;
  hasSearched = false;

  mangas: Array<Manga> = [];
  mangaSubscriptions: Array<Subscription> = [];

  constructor(
    public authService: AuthService,
    public fbService: FirebaseService,
    private httpClient: HttpClient) {
    this.subscriptionDataSource = new SubscriptionDataSource(this.fbService, this.httpClient);
    this.mangaDataSource = new MangaDataSource(this.httpClient);
  }

  ngOnInit(): void {
    this.subscriptionDataSource.loadMangas();
  }

  ngAfterViewInit() {
    // Pagination for Manga Items
    this.subscriptionDataSource.setPaginator(this.paginator.toArray()[0]);
    this.paginator.toArray()[0].page.pipe(tap(() => this.subscriptionDataSource.setContent())).subscribe();
    // Pagination for Manga search results
    this.paginator.toArray()[1].page.pipe(
      tap(() => this.mangaDataSource.setContent(
        this.paginator.toArray()[1].pageIndex, this.paginator.toArray()[1].pageSize))
    ).subscribe();
  }

  searchMangaSite(mangaKeywords: string) {
    this.mangaDataSource.search(
      this.selectedSite, mangaKeywords,
      this.paginator.toArray()[1].pageIndex, this.paginator.toArray()[1].pageSize);
    this.hasSearched = true;
  }

  refreshLatestChapter(manga: Subscription) {
    this.httpClient.get(`${environment.api_url}/latest_chapter/${manga.source}/${manga.link}`)
      .subscribe(chapter => {
        if ('latest_chapter' in chapter) {
          const latest_chapter = chapter['latest_chapter'] as Chapter;
          if (latest_chapter.link !== '') {
            if (manga.release_date === '' ||
              moment(latest_chapter.date, 'MM/DD/YYYY').isSameOrAfter(moment(manga.release_date, 'MM/DD/YYYY'))) {
              this.fbService.updateLatestChapter(manga.id,
                latest_chapter.chapter_number, latest_chapter.date, latest_chapter.link);
            }
          } else {
            console.log('Failed to retrieve data.')
            if ('error' in chapter) {
              console.log(chapter['error']);
            }
          }
        }
      });
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

  updateTime(id: string, days: number) {
    this.fbService.updateScheduledRefresh(id, days);
  }

  isSubscribed(manga: Manga) {
    for (let sub of this.subscriptionDataSource.subscriptionList) {
      if (manga.link === sub.link) {
        return true;
      }
    }
    return false;
  }
}
