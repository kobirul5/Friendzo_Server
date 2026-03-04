import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import { deleteImageAndFile } from "../../../helpars/fileDelete";
import prisma from "../../../shared/prisma";



// Upload chat images
const uploadImages = async (req:any) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files || !files.images || files.images.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No images provided");
  }

  const uploadPromises = files.images.map(file => fileUploader.uploadToDigitalOcean(file));
  const uploadedImages = await Promise.all(uploadPromises);

  const imageUrls = uploadedImages.map(img => img.Location);
    if (imageUrls.length === 0) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload images");
    }

  return imageUrls
};



const deleteFiles = async (files:any) => {

  const deleted = await deleteImageAndFile.deleteMultipleFileFromDigitalOcean(files);

  if (!deleted) {
    throw new ApiError(httpStatus.NOT_FOUND, " Image delete failed!");
  }

  return 
};

const deleteFile = async (file:string, userId:string) => {
  throw new ApiError(httpStatus.NOT_IMPLEMENTED, "deleteFile is not implemented");
};
 


const uploadSingleImageService = async (file: Express.Multer.File) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No image file provided");
  }

  let uploadedFile;
  try {
    uploadedFile = await fileUploader.uploadToDigitalOcean(file);
  } catch (error) {
    console.error("File upload failed:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "File upload failed");
  }

  if (!uploadedFile?.Location) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to get file URL");
  }

  return uploadedFile.Location;
};

// badge upload service
const uploadBadgeImageService = async (file: Express.Multer.File, userId:string) => {
  const user =  await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if(user.role !== "ADMIN"){
    throw new ApiError(httpStatus.FORBIDDEN, "Only admins can upload badge images");
  }

  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No image file provided");
  }

  let uploadedFile;
  try {
    uploadedFile = await fileUploader.uploadToDigitalOcean(file);
  } catch (error) {
    console.error("File upload failed:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "File upload failed");
  }

  if (!uploadedFile?.Location) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to get file URL");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { adminBadge: uploadedFile.Location },
    select: { adminBadge: true, id: true, email: true, firstName: true, lastName: true, role: true },
  });

  return updatedUser;

  }



export const fileUploadService = {
  uploadImages,
  deleteFiles,
  deleteFile,
  uploadSingleImageService,
  uploadBadgeImageService
};