import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";

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
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, "Report not found");
  }

  const result = await prisma.report.delete({
    where: { id: reportId },
  });

  return result;
};

const getReportedUsersService = async () => {
  const result = await prisma.report.findMany();
  return result;
};

export const reportService = {
  createReportUserService,
  createReportPostService,
  deleteReportService,
  getReportedUsersService
};
