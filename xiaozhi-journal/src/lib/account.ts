// Account management stub
// Placeholder for account deletion and management

export async function deleteAccount(userId?: string): Promise<boolean> {
  // Stub - userId optional, no actual deletion
  console.log('deleteAccount stub called for user:', userId || 'current');
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAccountInfo(_userId?: string): Promise<{
  email: string;
  createdAt: Date;
  journalCount: number;
}> {
  return {
    email: 'stub@example.com',
    createdAt: new Date(),
    journalCount: 0,
  };
}