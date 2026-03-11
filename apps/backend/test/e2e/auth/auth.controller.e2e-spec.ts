import { AuthController } from '@modules/auth/auth.controller';
import { randomEmail } from 'test/faker/random-email';
import { randomPassword } from 'test/faker/random-password';
import { UsersFixture } from 'test/fixtures/users-fixture';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { UserEntity } from '@modules/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProblemDetails } from '@energy-trading/shared/types';
import {
  ErrorCode,
  resolveProblemDetailsUrn,
} from '@energy-trading/shared/errors';

describe(AuthController.name, () => {
  let testingFixture: AppTestingFixture;
  let usersFixture: UsersFixture;
  let usersRepository: Repository<UserEntity>;
  let server: App;

  beforeAll(async () => {
    testingFixture = await AppTestingFixture.create({ mockKafka: true });
    usersFixture = testingFixture.getUsersFixture();
    server = (await testingFixture.init()).getHttpServer();
    usersRepository = testingFixture
      .getApp()
      .get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    await testingFixture.close();
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
      expect(req.body).toMatchObject<ProblemDetails>({
        type: resolveProblemDetailsUrn(ErrorCode.INVALID_CREDENTIALS),
        title: 'Invalid credentials',
        status: 401,
        instance: '/api/auth/login',
      });
      expect(req.header['set-cookie']).toBeUndefined();
    });

    it('should return 401 when for user with invalid password', async () => {
      const { email } = await usersFixture.createActivatedUser();
      const password = randomPassword();

      const res = await request(server).post(loginRoute).send({
        email: email.getValue(),
        password: password.getValue(),
      });

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject<ProblemDetails>({
        type: resolveProblemDetailsUrn(ErrorCode.INVALID_CREDENTIALS),
        title: 'Invalid credentials',
        status: 401,
        instance: '/api/auth/login',
      });
      expect(res.header['set-cookie']).toBeUndefined();
    });

    it('should return 400 when user account is inactive', async () => {
      const { email, password } = await usersFixture.createUser();

      const res = await request(server).post(loginRoute).send({
        email: email.getValue(),
        password: password.getValue(),
      });

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body).toMatchObject<ProblemDetails>({
        type: resolveProblemDetailsUrn(ErrorCode.USER_ACCOUNT_NOT_ACTIVATED),
        title: 'Account not activated error',
        status: 400,
        instance: '/api/auth/login',
      });
      expect(res.header['set-cookie']).toBeUndefined();
    });

    it('should set cookies for existing user with correct credentials', async () => {
      const { email, password } = await usersFixture.createActivatedUser();

      const res = await request(server).post(loginRoute).send({
        email: email.getValue(),
        password: password.getValue(),
      });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.header['set-cookie']).toBeDefined();
      expect(res.header['set-cookie'][0]).toContain('access_token');
      expect(res.header['set-cookie'][1]).toContain('refresh_token');
    });
  });

  describe(AuthController.prototype.refresh.name, () => {
    const refreshRoute = '/api/auth/refresh';

    it('should return 401 for inactive user', async () => {
      const client = await testingFixture.createAuthenticatedClient();

      await usersRepository.updateAll({
        isActive: false,
      });

      const res = await client.post(refreshRoute);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject<ProblemDetails>({
        type: resolveProblemDetailsUrn(ErrorCode.INVALID_REFRESH_TOKEN),
        title: 'Invalid refresh token',
        status: 401,
        instance: '/api/auth/refresh',
      });
    });

    it('should return 401 when cookie refresh token is not present', async () => {
      const res = await request(server).post(refreshRoute).send();

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject<ProblemDetails>({
        type: `urn:problem:unauthorized-exception`,
        title: 'Unauthorized',
        status: 401,
        instance: '/api/auth/refresh',
      });
    });

    it('should return 200 for authenticated user', async () => {
      const client = await testingFixture.createAuthenticatedClient();

      const res = await client.post(refreshRoute);

      const [accessTokenCookie, refreshTokenCookie] = res.headers['set-cookie'];

      expect(res.status).toBe(HttpStatus.OK);
      expect(client.cookie[0]).not.toBe(accessTokenCookie);
      expect(client.cookie[1]).not.toBe(refreshTokenCookie);
      expect(accessTokenCookie).not.toInclude('access_token=;');
      expect(refreshTokenCookie).not.toInclude('refresh_token=;');
    });

    it('should return 401 for already rotated token', async () => {
      const client = await testingFixture.createAuthenticatedClient();

      // rotate once
      await client.post(refreshRoute);
      // attempt to rotate with same refresh token
      const res = await client.post(refreshRoute).send();

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 on rotated token reuse attempt', async () => {
      const client = await testingFixture.createAuthenticatedClient();

      // rotate once
      const { headers } = await client.post(refreshRoute);

      // rotate with same refresh token blacklist
      const blacklistRes = await client.post(refreshRoute).send();

      expect(blacklistRes.status).toBe(HttpStatus.UNAUTHORIZED);

      // session with rotated tokens should fail after refresh attempt with reused token
      const res = await request(server)
        .post(refreshRoute)
        .set('Cookie', headers['set-cookie'])
        .send();

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe(AuthController.prototype.logout.name, () => {
    const logoutRoute = '/api/auth/logout';

    it('should return 401 when for authenticated user', async () => {
      const res = await request(server).post(logoutRoute).send();

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject<ProblemDetails>({
        type: `urn:problem:unauthorized-exception`,
        title: 'Unauthorized',
        status: 401,
        instance: '/api/auth/logout',
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
