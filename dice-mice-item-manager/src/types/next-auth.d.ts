import { DefaultSession } from 'next-auth';
import { AdapterUser as BaseAdapterUser } from 'next-auth/adapters';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'BASIC' | 'DM';
    } & DefaultSession['user'];
  }

  interface User {
    role: 'BASIC' | 'DM';
  }
}

declare module 'next-auth/adapters' {
  interface AdapterUser extends BaseAdapterUser {
    role: 'BASIC' | 'DM';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'BASIC' | 'DM';
  }
}
