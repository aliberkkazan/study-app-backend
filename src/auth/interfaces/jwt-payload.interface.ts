export interface JwtPayload {
  email: string;
  sub: string;
  role: string;
  name?: string;
  mentorCode?: string;
  hasSwitchedRole?: boolean;
  tokenVersion?: number;
  tokenType?: 'access' | 'refresh';
}
