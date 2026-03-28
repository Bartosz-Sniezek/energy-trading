import { MinorUnitValue } from '@domain/ledger/value-objects/minor-unit-value';
import { LedgerFixture } from 'test/fixtures/ledger-fixture';
import { UsersFixture } from 'test/fixtures/users-fixture';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';

describe('LedgerController', () => {
  let appTestingFixture: AppTestingFixture;
  let usersFixture: UsersFixture;
  let ledgerFixture: LedgerFixture;

  beforeAll(async () => {
    appTestingFixture = await AppTestingFixture.createWithMocks();
    usersFixture = appTestingFixture.getUsersFixture();
    ledgerFixture = appTestingFixture.getLedgerFixture();

    await appTestingFixture.init();
  });

  afterAll(async () => {
    await appTestingFixture.close();
  });

  describe('/ledger/deposit', () => {
    const route = '/api/ledger/deposit';

    it('should throw 401 if user is not authenticated', async () => {
      const client = appTestingFixture.createUnauthenticatedClient();

      const res = await client
        .post(route)
        .send(JSON.stringify({ amount: 1000 }));

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid body', async () => {
      const client = await appTestingFixture.createAuthenticatedClient();
      await ledgerFixture.initializeForUser(client.user);

      const res = await client.post(route).send({ amountt: 1000 });

      expect(res.status).toBe(400);
    });

    it('should return 200 for authenticated user', async () => {
      const client = await appTestingFixture.createAuthenticatedClient();
      await ledgerFixture.initializeForUser(client.user);

      const res = await client.post(route).send({ amount: 1000 });

      expect(res.status).toBe(200);
    });
  });

  describe('/ledger/withdrawal', () => {
    const route = '/api/ledger/withdrawal';

    it('should throw 401 if user is not authenticated', async () => {
      const client = appTestingFixture.createUnauthenticatedClient();

      const res = await client
        .post(route)
        .send(JSON.stringify({ amount: 1000 }));

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid body', async () => {
      const client = await appTestingFixture.createAuthenticatedClient();
      await ledgerFixture.initializeForUser(client.user);

      const res = await client.post(route).send({ amountt: 1000 });

      expect(res.status).toBe(400);
    });

    it('should return 200 for authenticated user', async () => {
      const client = await appTestingFixture.createAuthenticatedClient();
      await ledgerFixture.initializeForUser(
        client.user,
        new MinorUnitValue(100000),
      );

      const res = await client.post(route).send({ amount: 1000 });

      expect(res.status).toBe(200);
    });

    it('should return 400 with insufficient funds', async () => {
      const client = await appTestingFixture.createAuthenticatedClient();
      await ledgerFixture.initializeForUser(
        client.user,
        new MinorUnitValue(10),
      );

      const res = await client.post(route).send({ amount: 1000 });

      expect(res.status).toBe(400);
    });
  });
});
