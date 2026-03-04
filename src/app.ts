import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import cookieParser from "cookie-parser";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";

const app: Application = express();

export const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://72.60.70.222:3000",
    "https://togetheradmin.site",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use((req, res, next) => {
  const start = performance.now();
  res.on("finish", () => {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`${req.method} ${req.originalUrl} → ${duration}ms`);
  });
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "🚀 Server is running perfectly!",
  });
});

app.use("/api/v1", router);

app.use(GlobalErrorHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
