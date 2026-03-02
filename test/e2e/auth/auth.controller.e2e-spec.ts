import { AuthController } from '@modules/auth/auth.controller';
import { randomEmail } from 'test/faker/random-email';
import { randomPassword } from 'test/faker/random-password';
import { UsersFixture } from 'test/fixtures/users-fixture';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { App } from 'supertest/types';

describe(AuthController.name, () => {
  let testingFixture: AppTestingFixture;
  let usersFixture: UsersFixture;
  let server: App;

  beforeAll(async () => {
    testingFixture = await AppTestingFixture.create({
      mockKafka: true,
    });
    usersFixture = testingFixture.getUsersFixture();
    server = (await testingFixture.init()).getHttpServer();
  });

  beforeEach(async () => {
    await testingFixture.truncateDatabase();
  });

  describe(AuthController.prototype.login.name, () => {
    const loginRoute = '/api/auth/login';

    it('should return 401 when for user that does not exist', async () => {
      const email = randomEmail();
      const password = randomPassword();

      const req = await request(server).post(loginRoute).send({
        email: email.getValue(),
        password: password.getValue(),
      });

      expect(req.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(req.body).toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Domain Error',
      });
      expect(req.header['set-cookie']).toBeUndefined();
    });

    it('should return 401 when for user with invalid password', async () => {
      const { email } = await usersFixture.createActivatedUser();
      const password = randomPassword();

      const req = await request(server).post(loginRoute).send({
        email: email.getValue(),
        password: password.getValue(),
      });

      expect(req.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(req.body).toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Domain Error',
      });
      expect(req.header['set-cookie']).toBeUndefined();
    });

    it('should return 400 when user account is inactive', async () => {
      const { email, password } = await usersFixture.createUser();

      const req = await request(server).post(loginRoute).send({
        email: email.getValue(),
        password: password.getValue(),
      });

      expect(req.status).toBe(HttpStatus.BAD_REQUEST);
      expect(req.body).toMatchObject({
        statusCode: 400,
        message: 'Account not activated error',
        error: 'Domain Error',
      });
      expect(req.header['set-cookie']).toBeUndefined();
    });

    it('should set cookies for existing user with correct credentials', async () => {
      const { email, password } = await usersFixture.createActivatedUser();

      const req = await request(server).post(loginRoute).send({
        email: email.getValue(),
        password: password.getValue(),
      });

      expect(req.status).toBe(HttpStatus.OK);
      expect(req.header['set-cookie']).toBeDefined();
      expect(req.header['set-cookie'][0]).toContain('access_token');
      expect(req.header['set-cookie'][1]).toContain('refresh_token');
    });
  });

  describe(AuthController.prototype.logout.name, () => {
    const logoutRoute = '/api/auth/logout';

    it('should return 401 when for authenticated user', async () => {
      const req = await request(server).post(logoutRoute).send();

      expect(req.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(req.body).toMatchObject({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    it('should return 200 for authenticated user', async () => {
      const client = await testingFixture.createAuthenticatedClient();

      const res = await client.post(logoutRoute);

      const [accessTokenCookie, refreshTokenCookie] = res.headers['set-cookie'];

      expect(res.status).toBe(HttpStatus.OK);
      expect(accessTokenCookie).toInclude('access_token=;');
      expect(refreshTokenCookie).toInclude('refresh_token=;');
    });
  });
});
