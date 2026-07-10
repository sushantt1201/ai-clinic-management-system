import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '../utils/auth-token.js';

export const requireAuth = asyncHandler(async (request, _response, next) => {
  const token = request.cookies?.[AUTH_COOKIE_NAME];

  if (!token) throw new AppError(401, 'Authentication is required');

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    throw new AppError(401, 'Your session is invalid or has expired');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new AppError(401, 'This account is unavailable');

  request.user = user;
  next();
});

export function allowRoles(...roles) {
  return function roleAuthorization(request, _response, next) {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new AppError(403, 'You do not have permission to access this resource'));
    }

    return next();
  };
}
