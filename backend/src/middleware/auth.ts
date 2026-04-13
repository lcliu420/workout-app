import type { NextFunction, Request, Response } from 'express';
import { supabaseAuth } from '../lib/supabase.js';
import { HttpError } from '../lib/http-error.js';

function getBearerToken(request: Request) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw new HttpError(401, '缺少访问令牌');
  }

  return authorization.slice('Bearer '.length).trim();
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const token = getBearerToken(request);
    const { data, error } = await supabaseAuth.auth.getUser(token);

    if (error || !data.user?.email) {
      throw new HttpError(401, '登录状态已失效，请重新登录');
    }

    request.user = {
      id: data.user.id,
      email: data.user.email,
      accessToken: token,
    };

    next();
  } catch (error) {
    next(error);
  }
}
