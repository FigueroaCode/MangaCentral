import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';

import { Manga } from '../interfaces/manga';
import { Subscription } from '../interfaces/subscription';
import { MangaItem } from '../interfaces/mangaitem';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
      return userRef.collection('subscriptions').snapshotChanges().pipe(
        map(data => {
          return data.map(res => {
            return { ...res.payload.doc.data(), id: res.payload.doc.id }
          })
        })
      ) as Observable<MangaItem[]>;
    }
    return new Observable<MangaItem[]>();
  }

  saveManga(manga: Manga) {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
      const data: Subscription = { ...manga, last_read: 0 };
      // TODO: Check that manga doesn't exist in list before adding it
      // TODO: Add Manga site source to subscription
      // TODO: Group mangas and get all the latest chapters in one api call
      return userRef.collection('subscriptions').add(data);
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
