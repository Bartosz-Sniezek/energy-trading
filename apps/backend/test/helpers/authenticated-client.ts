import { Email } from '@domain/users/value-objects/email';
import { Password } from '@domain/users/value-objects/password';
import { UserEntity } from '@domain/users/entities/user.entity';
import request from 'supertest';
import { App } from 'supertest/types';
import { UsersFixture } from 'test/fixtures/users-fixture';

export class AuthenticatedClient {
  constructor(
    private server: App,
    public cookie: string[],
    public user: UserEntity,
    public email: Email,
    public password: Password,
  ) {}

  get(path: string) {
    return request(this.server).get(path).set('Cookie', this.cookie);
  }

  post(path: string) {
    return request(this.server).post(path).set('Cookie', this.cookie);
  }

  put(path: string) {
    return request(this.server).put(path).set('Cookie', this.cookie);
  }

  delete(path: string) {
    return request(this.server).delete(path).set('Cookie', this.cookie);
  }

  static async create(server: App, usersFixture: UsersFixture) {
    const { email, password, user } = await usersFixture.createActivatedUser();

    const loginRes = await request(server).post('/api/auth/login').send({
      email: email.getValue(),
      password: password.getValue(),
    });

    return new AuthenticatedClient(
      server,
      loginRes.get('Set-Cookie')!,
      user,
      email,
      password,
    );
  }
}
