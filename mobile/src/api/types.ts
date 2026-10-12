export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export interface Place {
  id: string;
  name: string;
  locality: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface Photo {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  position: number;
}

export interface Visit {
  id: string;
  note: string | null;
  rating: number | null;
  visitedFrom: string | null;
  visitedTo: string | null;
  createdAt: string;
  place?: Place;
  photos?: Photo[];
}

export interface DiaryVisit {
  id: string;
  note: string | null;
  rating: number | null;
  createdAt: string;
  place: Place;
  coverPhoto: string | null;
}

export interface MapPin {
  placeId: string;
  name: string;
  locality: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  visitCount: number;
  lastVisitId: string;
}

export interface PlaceSearchResult {
  osmId: string | null;
  name: string;
  displayName: string | null;
  locality: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface WishlistItem {
  id: string;
  note: string | null;
  createdAt: string;
  place: Place;
}
