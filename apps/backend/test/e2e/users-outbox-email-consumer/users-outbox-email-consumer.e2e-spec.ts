import { sleep } from '@utils/sleep';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';
import { MockMailer } from 'test/mocks/q-mailer';

describe('Users outbox email consumer', () => {
  let testingFixture: AppTestingFixture;
  const mailer = new MockMailer();

  beforeAll(async () => {
    testingFixture = await AppTestingFixture.create({
      mailerMock: mailer,
    });
    await testingFixture.init();
    await testingFixture.truncateDatabase();
  });

  afterAll(async () => {
    await testingFixture.close();
  });

  it('should process', async () => {
    await testingFixture.getUsersFixture().createUser();

    await sleep(4000);
    expect(mailer.messageQ).toHaveLength(1);
  });
});
