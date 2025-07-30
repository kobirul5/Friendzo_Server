import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';


const createReportService = async (data: any, reporterId: string) => {
    const {reportedUserId,  description } = data;

    if (!reportedUserId || !description) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Missing required fields");
    }

    // Create the report
    const result = await prisma.report.create({ 
      data: {
        reportedUserId,
        description,
        reporterId,
      }
    });
    return result;


};

const deleteReportService = async (reportId: string) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Report not found');
  }

  const result = await prisma.report.delete({
    where: { id: reportId },
  });

  return result;
};  


export const reportService = {
createReportService,
deleteReportService
};