// import express, { Application, NextFunction, Request, Response } from "express";

// import httpStatus from "http-status";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
// import router from "./app/routes";

// const app: Application = express();
// export const corsOptions = {
//   origin: [
//     "http://localhost:3001",
//     "http://72.60.70.222:3001",
//     "http://localhost:3000",
//     "http://72.60.70.222:3000",
//     "http://localhost:3002",
//     "http://72.60.70.222:3002",
//     "https://digital-animal3-dashboard.vercel.app",
//     "https://digital-animal3-dashboard-44nouw4zn.vercel.app",
//   ],
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// };

// // Middleware setup
// app.use(cors(corsOptions));
// app.use(cookieParser());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static("public"));

// // Route handler for root endpoint
// app.get("/", (req: Request, res: Response) => {
//   res.send({
//     success: true,
//     statusCode: httpStatus.OK,
//     message: "The server is running!",
//   });
// });

// // Router setup
// app.use("/api/v1", router);

// // Error handling middleware
// app.use(GlobalErrorHandler);

// // Not found handler
// app.use((req: Request, res: Response, next: NextFunction) => {
//   res.status(httpStatus.NOT_FOUND).json({
//     success: false,
//     message: "API NOT FOUND!",
//     error: {
//       path: req.originalUrl,
//       message: "Your requested path is not found!",
//     },
//   });
// });

// export default app;



import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import cookieParser from "cookie-parser";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";

const app: Application = express();

export const corsOptions = {
  origin: [
    "http://localhost:3001",
    "http://72.60.70.222:3001",
    "http://localhost:3000",
    "http://72.60.70.222:3000",
    "http://localhost:3002",
    "http://72.60.70.222:3002",
    "https://digital-animal3-dashboard.vercel.app",
    "https://digital-animal3-dashboard-44nouw4zn.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ✅ Middleware setup
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" })); // limit added
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ✅ Request duration logger (for profiling)
app.use((req, res, next) => {
  const start = performance.now();
  res.on("finish", () => {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`${req.method} ${req.originalUrl} → ${duration}ms`);
  });
  next();
});

// ✅ Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "🚀 Server is running perfectly!",
  });
});

// ✅ Router setup
app.use("/api/v1", router);

// ✅ Global error handler
app.use(GlobalErrorHandler);

// ✅ 404 handler
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
