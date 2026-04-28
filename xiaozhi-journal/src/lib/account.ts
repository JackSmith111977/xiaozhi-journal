// Account management stub
// Placeholder for account deletion and management

export async function deleteAccount(userId?: string): Promise<boolean> {
  // Stub - userId optional, no actual deletion
  console.log('deleteAccount stub called for user:', userId || 'current');
  return true;
}

export async function getAccountInfo(userId?: string): Promise<{
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