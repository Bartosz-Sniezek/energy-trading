import { sleep } from '@utils/sleep';
import { AppTestingFixture } from 'test/helpers/app-testing-fixture';
import { MockMailer } from 'test/mocks/q-mailer';

describe('Users outbox email consumer', () => {
  let testingFixture: AppTestingFixture;
  const mailer = new MockMailer();

  beforeAll(async () => {
    testingFixture = await AppTestingFixture.create({
      mailerMock: mailer,
      mockWs: true,
    });
    await testingFixture.truncateTopics([
      process.env.KAFKA_USERS_OUTBOX_TOPIC!,
    ]);
    await testingFixture.init();
  });

  afterAll(async () => {
    await testingFixture.close();
  });

  beforeEach(async () => {
    await testingFixture.truncateDatabase();
  });

  it('should process', async () => {
    await testingFixture.getUsersFixture().createUser();

    await sleep(8000);
    expect(mailer.messageQ).toHaveLength(1);
  }, 15000);
});
