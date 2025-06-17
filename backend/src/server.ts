import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { brdCreate } from "./funcs/brdCreate";
import { brdCreateFromText } from "./funcs/brdCreateFromText";
import { generateRepo } from "./funcs/brdGenerateRepo";

// import { brdCreateFromPdf } from "./funcs/brdPDFCreate";
// import { multerUpload } from "./utils/store";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("BRD to Git Backend is running!");
});

app.post("/api/brds", brdCreate);
app.post("/api/brds/create-from-text", brdCreateFromText);
app.post("/api/brds/generate-repo", generateRepo);
// app.post("/api/brds/create", multerUpload.single("pdfFile"), brdCreateFromPdf);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// main();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
