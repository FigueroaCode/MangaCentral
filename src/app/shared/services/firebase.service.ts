import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import { AngularFirestore, AngularFirestoreDocument, DocumentChangeAction } from '@angular/fire/firestore';

import { Manga } from '../interfaces/manga';
import { Subscription } from '../interfaces/subscription';
import { MangaItem } from '../interfaces/mangaitem';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(public afs: AngularFirestore) { }

  getSubscriptions(): Observable<MangaItem[]> {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
      return userRef.collection('subscriptions').valueChanges() as Observable<MangaItem[]>;
    }
    return new Observable<MangaItem[]>();
  }

  subscriptionAdded(): Observable<MangaItem[]> {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
        return userRef.collection('subscriptions').stateChanges(['added']).pipe(
          map(data => {
            return data.map(res => {
              return { ...res.payload.doc.data(), id: res.payload.doc.id }
            })
          })
        ) as Observable<MangaItem[]>;
      }
      return new Observable<MangaItem[]>();
    }

  saveManga(manga: Manga, source: string) {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
      const data: MangaItem = {
        ...manga, source: source, last_read: 0, id: '',
        release_date: '', chapter_link: '', latest_chapter: 0
      };
      return userRef.collection('subscriptions').add(data).then(res => {
        userRef.collection('subscriptions').doc(res.id).update({ id: res.id });
      });
    }
    return null;
  }

  updateManga(manga: MangaItem) {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);

      return userRef.collection('subscriptions').doc(manga.id).update(manga);
    }
    return null;
  }

  updateLatestChapter(id: string, latestChapter: number, releaseDate: string, chapterLink: string) {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
      const chapter = {
        latest_chapter: latestChapter,
        release_date: releaseDate,
        chapter_link: chapterLink
      };
      return userRef.collection('subscriptions').doc(id).update(chapter);
    }
    return null;
  }

  removeManga(id: string) {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
      return userRef.collection('subscriptions').doc(id).delete();
    }
    return null;
  }
}
