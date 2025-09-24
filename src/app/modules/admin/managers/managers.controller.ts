import httpStatus from 'http-status'
import { managersService } from './managers.service';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';

const createManagers = catchAsync(async (req, res) => {

  const userId = req.user.id;
  const data = JSON.parse(req.body.data);
  const file = req.file;

  const result = await managersService.createUserService({userId, data, file});
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Managers created successfully',
    data: result,
  });
});

const getAllManagerList = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const options = req.query;              
  const result = await managersService.getAllManagers(options, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: result,
  });
});

const getManagersById = catchAsync(async (req, res) => {
  const result = await managersService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Managers details retrieved successfully',
    data: result,
  });
});

const updateManagers = catchAsync(async (req, res) => {
  const result = await managersService.updateIntoDb(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Managers updated successfully',
    data: result,
  });
});

const deleteManagers = catchAsync(async (req, res) => {
  const result = await managersService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Managers deleted successfully',
    data: result,
  });
});

export const managersController = {
  createManagers,
  getAllManagerList,
  getManagersById,
  updateManagers,
  deleteManagers,
};