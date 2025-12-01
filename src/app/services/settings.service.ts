import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ProfileSettings } from '../models/profile-settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly baseUrl = 'api/profiles';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ProfileSettings> {
    return this.http.get<ProfileSettings>(`${this.baseUrl}/1`);
  }

  updateProfile(profile: ProfileSettings): Observable<ProfileSettings> {
    return this.http.put<ProfileSettings>(`${this.baseUrl}/${profile.id}`, profile);
  }
}
