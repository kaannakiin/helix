import type { AxiosInstance } from 'axios';
import {
  createAuthClient,
  loginUser,
  registerAndGetCredentials,
} from './auth.helper.js';
import { elevateUserToAdmin } from './prisma.helper.js';

export async function createAdminClient(): Promise<{
  client: AxiosInstance;
  email: string;
  password: string;
}> {
  const bootstrapClient = createAuthClient();
  const { email, password, response } = await registerAndGetCredentials(
    bootstrapClient
  );

  if (response.status !== 201) {
    throw new Error(`Failed to bootstrap admin user: ${response.status}`);
  }

  await elevateUserToAdmin(email);

  const adminClient = createAuthClient();
  const loginResponse = await loginUser(adminClient, email, password);

  if (loginResponse.status !== 200) {
    throw new Error(`Failed to login admin user: ${loginResponse.status}`);
  }

  return {
    client: adminClient,
    email,
    password,
  };
}
