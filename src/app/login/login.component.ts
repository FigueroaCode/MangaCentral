import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isSubmitted = false;
  // Toggle between login function and register function
  isLogin = true;

  constructor(public authService: AuthService, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
      passwordVerify: ['', Validators.required],
    });
  }

  get formControls() { return this.loginForm.controls; }

  login() {
    this.isSubmitted = true;
    if (this.formControls.password.errors || this.formControls.email.errors) {
      return;
    }
    const email = this.loginForm.value['email'];
    const password = this.loginForm.value['password'];
    this.authService.login(email, password)
  }

  register() {
    this.isSubmitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    const email = this.loginForm.value['email'];
    const password = this.loginForm.value['password'];
    this.authService.register(email, password)
  }

  toggleLogin() {
    // Reset States
    this.isSubmitted = false;
    this.isLogin = !this.isLogin;
  }
}
