import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface manga {
  link: string;
  img_src: string;
  name: string;
}

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnInit {

  mangaSites = ['manga4life.com'];
  selectedSite = 'manga4life.com';

  mangas = [];

  constructor(public authService: AuthService, private httpClient: HttpClient) { }

  ngOnInit(): void {
  }

  searchMangaSite(mangaKeywords: string) {
    let url = `${environment.api_url}/search/${this.selectedSite}/${mangaKeywords}`;

    this.httpClient.get(url).subscribe(data => {
      console.log(data);
      // TODO: Check for status code?
      if ('mangas' in data) {
        this.mangas = data['mangas'];
      }
    });
  }
}
