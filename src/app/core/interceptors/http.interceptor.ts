import { HttpInterceptorFn } from '@angular/common/http';

const AUTH_TOKEN = 'Token eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJTb3BvcnRlTW92aWxnbyIsImNvbmV4aW9uIjoiMjgvMDcvMjAyNiIsImFwZWxsaWRvX3BhdGVybm8iOiJzb3BvcnRlbW92aWxnbyIsImFwZWxsaWRvX21hdGVybm8iOiIiLCJleHAiOjE3ODUyODM5MjksIm5vbWJyZSI6IlNvcG9ydGVtb3ZpbGdvIn0.L-x-9De-oi8-OWUb1YbiyQK__BXFyW5v1UUt8nbKCr1doj8x36LpnD-fgN-zDBF6lWHKVS4CXE6JnpJN-E3Q8Q';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const authenticatedReq = req.clone({
    setHeaders: {
      Authorization: `${AUTH_TOKEN}`,
    },
  });
  return next(authenticatedReq);
};
