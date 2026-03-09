import { faker } from '@faker-js/faker';
import { AccountStatus, SessionRevokeReason } from '../../browser.js';
import { prisma } from '../../prisma.js';
const TOTAL_USERS = faker.number.int({ min: 200, max: 300 });

async function seedCustomers() {
  console.log(`Starting to seed ${TOTAL_USERS} customers...`);

  for (let i = 0; i < TOTAL_USERS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });
    const isVerified = faker.datatype.boolean({ probability: 0.8 });
    const hasPhone = faker.datatype.boolean({ probability: 0.6 });

    let status: AccountStatus = 'ACTIVE';
    const statusRand = Math.random();
    if (statusRand > 0.95) status = 'BANNED';
    else if (statusRand > 0.9) status = 'SUSPENDED';
    else if (statusRand > 0.85) status = 'DEACTIVATED';

    const userCreateInput = {
      name: firstName,
      surname: lastName,
      email: email,
      phone: hasPhone ? faker.phone.number() : null,
      emailVerified: isVerified,
      phoneVerified: hasPhone ? faker.datatype.boolean() : false,
      avatar: faker.image.avatar(),
      status: status,
      password: faker.internet.password({ length: 12 }),
      loginCount: faker.number.int({ min: 0, max: 100 }),
      lastLoginAt: faker.date.recent({ days: 30 }),
      createdAt: faker.date.past({ years: 2 }),
      twoFactorEnabled: faker.datatype.boolean({ probability: 0.2 }),
    };

    const user = await prisma.user.create({
      data: userCreateInput,
    });

    const deviceCount = faker.number.int({ min: 1, max: 3 });

    for (let d = 0; d < deviceCount; d++) {
      const deviceTypeRand = Math.random();
      let deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN' = 'DESKTOP';
      if (deviceTypeRand > 0.6) deviceType = 'MOBILE';
      else if (deviceTypeRand > 0.9) deviceType = 'TABLET';

      const osName =
        deviceType === 'DESKTOP'
          ? faker.helpers.arrayElement(['Windows', 'macOS'])
          : faker.helpers.arrayElement(['iOS', 'Android']);
      const browserName =
        deviceType === 'DESKTOP'
          ? faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari'])
          : faker.helpers.arrayElement(['Mobile Safari', 'Chrome Mobile']);

      const device = await prisma.device.create({
        data: {
          userId: user.id,
          deviceName: `${optionsFromType(
            deviceType
          )} - ${faker.word.adjective()}`,
          deviceType: deviceType,
          osName: osName,
          osVersion: faker.system.semver(),
          browserName: browserName,
          browserVersion: faker.system.semver(),
          fingerprint: faker.string.uuid(),
          isTrusted: faker.datatype.boolean({ probability: 0.7 }),
          firstSeenAt: faker.date.past({ years: 1 }),
          lastSeenAt: faker.date.recent({ days: 30 }),
        },
      });

      if (status === 'ACTIVE' && faker.datatype.boolean({ probability: 0.8 })) {
        const sessionCount = faker.number.int({ min: 1, max: 2 });
        for (let s = 0; s < sessionCount; s++) {
          const isActiveSession = faker.datatype.boolean({ probability: 0.6 });

          const session = await prisma.session.create({
            data: {
              userId: user.id,
              deviceId: device.id,
              sessionToken: faker.string.alphanumeric({ length: 64 }),
              ipAddress: faker.internet.ipv4(),
              userAgent: faker.internet.userAgent(),
              deviceType: device.deviceType,
              osName: device.osName,
              osVersion: device.osVersion,
              browserName: device.browserName,
              browserVersion: device.browserVersion,
              city: faker.location.city(),
              country: faker.location.country(),
              lat: faker.location.latitude(),
              lng: faker.location.longitude(),
              isActive: isActiveSession,
              expiresAt: faker.date.future(),
              createdAt: faker.date.recent({ days: 60 }),
              lastActivityAt: faker.date.recent({ days: 5 }),
              revokedAt: !isActiveSession
                ? faker.date.recent({ days: 1 })
                : null,
              revokeReason: !isActiveSession
                ? faker.helpers.arrayElement(
                    Object.values(SessionRevokeReason).map((data) => data)
                  )
                : null,
            },
          });

          const loginHistoryCount = faker.number.int({ min: 1, max: 5 });
          for (let l = 0; l < loginHistoryCount; l++) {
            const isSuccess = faker.datatype.boolean({ probability: 0.95 });

            await prisma.loginHistory.create({
              data: {
                userId: user.id,
                sessionId: session.id,
                deviceId: device.id,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                city: session.city,
                country: session.country,
                lat: session.lat,
                lng: session.lng,
                loginMethod: faker.helpers.arrayElement([
                  'EMAIL',
                  'PHONE',
                  'OAUTH_GOOGLE',
                  'OAUTH_GITHUB',
                  'TWO_FACTOR',
                ]),
                status: isSuccess ? 'SUCCESS' : 'FAILURE',
                failureReason: isSuccess
                  ? null
                  : faker.helpers.arrayElement([
                      'Invalid Password',
                      'Account Locked',
                      'Rate Limited',
                    ]),
                createdAt: faker.date.between({
                  from: user.createdAt,
                  to: new Date(),
                }),
              },
            });
          }
        }
      }
    }
  }

  console.log(
    `Successfully seeded ${TOTAL_USERS} customers with relationships!`
  );
}

function optionsFromType(type: string): string {
  if (type === 'DESKTOP')
    return faker.helpers.arrayElement([
      'MacBook Pro',
      'Dell XPS',
      'iMac',
      'ThinkPad',
    ]);
  if (type === 'MOBILE')
    return faker.helpers.arrayElement(['iPhone 14', 'Galaxy S23', 'Pixel 8']);
  if (type === 'TABLET')
    return faker.helpers.arrayElement(['iPad Pro', 'Galaxy Tab S9']);
  return 'Unknown Device';
}

seedCustomers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
