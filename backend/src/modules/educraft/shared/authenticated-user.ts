/** Payload del JWT que `JwtStrategy` deja en `request.user`. */
export interface AuthenticatedUser {
  id: number;
  roles?: string[];
}
