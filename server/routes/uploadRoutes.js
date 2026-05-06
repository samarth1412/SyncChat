import express from "express";
import upload from "../config/cloudinary.js";
import { uploadPhoto } from "../controllers/uploadController.js";

const uploadRouter = express.Router();

uploadRouter.post("/photo", upload.single("photo"), uploadPhoto);

export default uploadRouter;
