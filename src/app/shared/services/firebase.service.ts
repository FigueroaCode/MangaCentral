import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import { AngularFirestore, AngularFirestoreDocument, DocumentChangeAction } from '@angular/fire/firestore';

import { Manga } from '../interfaces/manga';
import { Subscription } from '../interfaces/subscription';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(public afs: AngularFirestore) { }

  getSubscriptions(): Observable<Subscription[]> {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
      return userRef.collection('subscriptions').valueChanges() as Observable<Subscription[]>;
    }
    return new Observable<Subscription[]>();
  }

  subscriptionAdded(): Observable<Subscription[]> {
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
        ) as Observable<Subscription[]>;
      }
      return new Observable<Subscription[]>();
    }
  // TODO: Error Handling
  saveManga(manga: Manga, source: string) {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
      const data: Subscription = {
        ...manga, source: source, last_read: 0, id: '',
        release_date: '', chapter_link: '', latest_chapter: 0, scheduledRefresh: 1
      };
      return userRef.collection('subscriptions').add(data).then(res => {
        userRef.collection('subscriptions').doc(res.id).update({ id: res.id });
      });
    }
    return null;
  }
  // TODO: Error Handling
  updateManga(manga: Subscription) {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);

      return userRef.collection('subscriptions').doc(manga.id).update(manga);
    }
    return null;
  }
  // TODO: Error Handling
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
  // TODO: Error Handling
  updateScheduledRefresh(id: string, days: number) {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);

      return userRef.collection('subscriptions').doc(id).update({scheduledRefresh: days});
    }
    return null;
  }
  // TODO: Error Handling
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
