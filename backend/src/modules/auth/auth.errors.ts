const AUTH_ERROR_TRANSLATIONS: Array<[RegExp, string]> = [
  [/email rate limit exceeded/i, '邮件发送过于频繁，请稍等一会儿再试。'],
  [/you can only request this after 15 seconds/i, '请求过于频繁，请 15 秒后再重试。'],
  [/user already registered/i, '该邮箱已经注册，请直接登录。'],
  [/invalid login credentials/i, '邮箱或密码不正确。'],
  [/email not confirmed/i, '该邮箱尚未完成验证，请先去邮箱里完成验证。'],
  [/signup is disabled/i, '当前项目暂未开放注册。'],
  [/password should be at least/i, '密码长度太短，请至少输入 6 位。'],
  [/unable to validate email address/i, '邮箱地址格式不正确，请检查后重试。'],
];

export function translateSupabaseAuthError(message?: string) {
  if (!message) {
    return '认证失败，请稍后再试。';
  }

  const matched = AUTH_ERROR_TRANSLATIONS.find(([pattern]) => pattern.test(message));
  return matched?.[1] ?? message;
}
