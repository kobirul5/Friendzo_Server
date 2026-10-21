import { NextFunction, Request, Response } from "express";

import config from "../../config";
import { JwtPayload, Secret } from "jsonwebtoken";

import httpStatus from "http-status";
import ApiError from "../../errors/ApiErrors";
import { jwtHelpers } from "../../helpars/jwtHelpers";
import prisma from "../../shared/prisma";
import { UserStatus } from "@prisma/client";

interface CachedAuthUser {
  id: string;
  role: string;
  status: UserStatus;
  isVerified: boolean;
  cachedAt: number;
}

const authUserCache = new Map<string, CachedAuthUser>();
const AUTH_CACHE_TTL = 60 * 1000; // 60 seconds

export const invalidateAuthUserCache = (userId?: string) => {
  if (userId) {
    authUserCache.delete(userId);
  } else {
    authUserCache.clear();
  }
};

const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      // Handle both "Bearer <token>" and raw token formats
      const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;

      const verifiedUser = jwtHelpers.verifyToken(
        actualToken,
        config.jwt.jwt_secret as Secret
      );
      const { id } = verifiedUser;

      let user: { id: string; role: string; status: UserStatus; isVerified: boolean } | null = null;
      const cached = authUserCache.get(id);

      if (cached && Date.now() - cached.cachedAt < AUTH_CACHE_TTL) {
        user = cached;
      } else {
        const dbUser = await prisma.user.findUnique({
          where: {
            id: id,
          },
          select: {
            id: true,
            role: true,
            status: true,
            isVerified: true,
          },
        });

        if (dbUser) {
          user = {
            id: dbUser.id,
            role: dbUser.role,
            status: dbUser.status,
            isVerified: dbUser.isVerified,
          };
          if (authUserCache.size > 5000) {
            authUserCache.clear();
          }
          authUserCache.set(id, { ...user, cachedAt: Date.now() });
        }
      }

      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
      }

      if (user.isVerified === false) {
        throw new ApiError(httpStatus.FORBIDDEN, "Your account is not verified!");
      }

      if (user.status === UserStatus.BLOCKED) {
        throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked!");
      }

      req.user = verifiedUser as JwtPayload;

      if (roles.length && !roles.includes(user.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;

