import request from 'supertest';
import { App } from 'supertest/types';

export class UnauthenticatedClient {
  constructor(private server: App) {}

  get(path: string) {
    return request(this.server).get(path);
  }

  post(path: string) {
    return request(this.server).post(path);
  }

  put(path: string) {
    return request(this.server).put(path);
  }

  delete(path: string) {
    return request(this.server).delete(path);
  }

  static create(server: App) {
    return new UnauthenticatedClient(server);
  }
}
