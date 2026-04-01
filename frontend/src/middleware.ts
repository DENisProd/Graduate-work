import { auth } from '@/auth';

export default auth((req) => {
  return;
});

export const config = {
  // matcher: ['/dashboard/:path*', '/admin/:path*'],
  matcher: ['/dashboard/:path*'],
};
