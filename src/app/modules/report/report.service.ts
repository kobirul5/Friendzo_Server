import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { Prisma } from "@prisma/client";

const createReportUserService = async (data: any, reporterId: string) => {
  const { reportedUserId, description } = data;

  const reporter = await prisma.user.findUnique({
    where: { id: reporterId },
  });

  if (!reporter) {
    throw new ApiError(httpStatus.NOT_FOUND, "Reporter user not found");
  }

  const reportedUser = await prisma.user.findUnique({
    where: { id: reportedUserId },
  });

  if (!reportedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Reported user not found");
  }

  if (!reportedUserId || !description) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Missing required fields, You must provide reportedUserId and description"
    );
  }

  // Create the report
  const result = await prisma.report.create({
    data: {
      reportedUserId,
      description,
      reporterId,
    },
  });
  return result;
};
const createReportPostService = async (data: any, reporterId: string) => {
  const { postId, description } = data;

  const reporter = await prisma.user.findUnique({
    where: { id: reporterId },
  });

  if (!reporter) {
    throw new ApiError(httpStatus.NOT_FOUND, "Reporter user not found");
  }

  const memory = await prisma.memory.findUnique({
    where: { id: postId },
  });

  if (!memory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Memory not found");
  }

  if (!postId || !description) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Missing required fields, You must provide reportedUserId and description"
    );
  }

  // Create the report
  const result = await prisma.reportPost.create({
    data: {
      memoryId: postId,
      description,
      reporterId,
    },
  });
  return result;
};

const deleteReportService = async (reportId: string) => {
  // Try to find in Report (user reports)
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (report) {
    return await prisma.report.delete({ where: { id: reportId } });
  }

  // Try to find in ReportPost (post/memory reports)
  const reportPost = await prisma.reportPost.findUnique({
    where: { id: reportId },
  });

  if (reportPost) {
    return await prisma.reportPost.delete({ where: { id: reportId } });
  }

  throw new ApiError(httpStatus.NOT_FOUND, "Report not found");
};


interface IGetReportedUsersOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  
}

const getReportedUsersService = async (options: IGetReportedUsersOptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder, } = paginationHelper.calculatePagination(options);


  const search = options.search;
  // 1️ Build search filter with proper Prisma types
  let searchFilter: Prisma.ReportWhereInput = {};
  if (search) {
    searchFilter = {
      OR: [
        { description: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
        {
          reportedUser: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
              { lastName: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
            ],
          },
        },
      ],
    };
  }

  // 2️ Fetch reported users with pagination
  const reported = await prisma.report.findMany({
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    where: searchFilter,
    include: {
      reportedUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  // 3️ Count total reports for meta
  const total = await prisma.report.count({ where: searchFilter });

  return {
    meta: { page, limit, total },
    data: reported,
  };
};
const getReportedPostsService = async (options: IGetReportedUsersOptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder, } = paginationHelper.calculatePagination(options);


  const search = options.search;
  // 1️ Build search filter with proper Prisma types
  let searchFilter: Prisma.ReportPostWhereInput = {};
  if (search) {
    searchFilter = {
      OR: [
        { description: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
        {
          reporter: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
              { lastName: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
            ],
          },
        },
      ],
    };
  }

  // 2️ Fetch reported users with pagination
  const reported = await prisma.reportPost.findMany({
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    where: searchFilter,
    include: {
      reporter: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  // 3️ Count total reports for meta
  const total = await prisma.reportPost.count({ where: searchFilter });

  return {
    meta: { page, limit, total },
    data: reported,
  };
};

export const reportService = {
  createReportUserService,
  createReportPostService,
  deleteReportService,
  getReportedUsersService,
  getReportedPostsService
};
