import express from "express";
import morgan from "morgan";
import router from "./routes";

const app = express();

app.set("trust proxy", true);
app.use(express.json());
app.use(morgan("dev"));

// http://localhost:3000/api
app.use("/api", router);

export default app;
