import { Injectable, NgZone } from '@angular/core';
import { Router } from "@angular/router";
import firebase from 'firebase/app';
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: any;
  constructor(
    public afs: AngularFirestore,   // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,
    public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {
    /* Saving user data in localstorage when 
        logged in and setting up null when logged out */
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.user = user;
        const userJson = JSON.stringify(this.user);
        localStorage.setItem('user', userJson);
        this.ngZone.run(() => {
           this.router.navigate(['collection']);
        });
        // Make them verify email before sending to jobs
        //if (this.user.emailVerified) {
        //  this.ngZone.run(() => {
        //    this.router.navigate(['collection']);
        //  });
        //} else {
        //  this.ngZone.run(() => {
        //    this.router.navigate(['verify-email-address']);
        //  });
        //}
      } else {
        localStorage.setItem('user', '');
        this.ngZone.run(() => {
          this.router.navigate(['login']);
        });
      }
    })
  }

  // Sign in with email/password
  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password)
      .then((result) => {
        if (result && result.user) {
          this.setUserData(result.user);
        }
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  // Sign up with email/password
  register(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password)
      .then((result) => {
        /* Call the SendVerificaitonMail() function when new user sign 
        up and returns promise */
        result.user?.sendEmailVerification();
        if (result && result.user) {
          this.setUserData(result.user);
        }
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  // Reset Forgotten password
  forgotPassword(passwordResetEmail: string) {
    return this.afAuth.sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert('Password reset email sent, check your inbox.');
      }).catch((error) => {
        window.alert(error)
      })
  }

  // Returns true when user is logged in and email is verified
  get isLoggedIn(): boolean {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      return user !== null; //&& user.emailVerified !== false;
    }
    return false;
  }

  // Sign in with Google
  googleAuth() {
    return this.authLogin(new firebase.auth.GoogleAuthProvider());
  }

  // Auth logic to run auth providers
  authLogin(provider: firebase.auth.AuthProvider) {
    return this.afAuth.signInWithPopup(provider)
      .then((result) => {
        //this.ngZone.run(() => {
        //  this.router.navigate(['jobs']);
        //})
        if (result && result.user) {
          this.setUserData(result.user);
        }
      }).catch((error) => {
        window.alert(error)
      })
  }

  /* Setting up user data when sign in with username/password, 
    sign up with username/password and sign in with social auth  
    provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  setUserData(user: firebase.User) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    }
    return userRef.set(userData, {
      merge: true
    })
  }

  // Sign out 
  logout() {
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
      //this.router.navigate(['collection']);
    })
  }
}
