export interface CreateUserInput {
  username: string;
  password: string;
  role?: 'admin' | 'member';
}

export interface UpdateUserInput {
  username?: string;
  password?: string;
  role?: 'admin' | 'member';
}
