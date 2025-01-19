import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import "./config/initializeDb.js";
import "./config/User.js";
import userRouter from "./routes/userRoutes.js";
import DocumentRouter from "./routes/DocumentRoutes.js";
import AccountRouter from "./routes/accountRoutes.js";
import ReplyRouter from "./routes/ReplyRoutes.js";
import EventRouter from "./routes/EventRoutes.js";
import config from "./config/api.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const corsOptions = {
  origin: `${config.API}`,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));

// Global Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "frame-ancestors": ["'self'", `${config.API}`],
      "default-src": ["'self'", `${config.API}`],
      "img-src": ["'self'", "data:", "blob:"],
      "media-src": ["'self'", "data:", "blob:"],
      "object-src": ["'none'"],
    },
  })
);

app.use(morgan("common"));
app.use(cors(corsOptions));

// Route Middleware
app.use("/", userRouter);
app.use("/", DocumentRouter);
app.use("/", AccountRouter);
app.use("/", ReplyRouter);
app.use("/", EventRouter);

app.use(
  "/documents",
  express.static(path.join(__dirname, "..", "assets", "Documents"))
);
app.use(
  "/profile_picture",
  express.static(path.join(__dirname, "..", "assets", "ProfilePic"))
);
app.use(
  "/reply-document",
  express.static(path.join(__dirname, "..", "assets", "replyDocument"))
);

// Error Handling Middleware (Optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: "An internal server error occurred." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
