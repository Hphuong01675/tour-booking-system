import "dotenv/config"; // gọi hàm config của dotenv để chạy lệnh process.env.PORT
import express from "express"; // nạp express
import bodyParser from "body-parser"; // nạp body-parser lấy tham số từ client /user?id=7
import cors from "cors"; // Nạp thư viện cors
import viewEngine from "./config/viewEngine"; // nạp viewEngine
import initWebRoutes from "./routes/auth.routes"; // nạp file web từ Route
import connectDB from "./config/configdb";

let app = express();

// config cors
app.use(
    cors({
        origin: "http://localhost:5173", // Cho phép ReactJS truy cập
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true, // Cho phép gửi cookie/headers nếu cần
    }),
);

//config app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
viewEngine(app);
app.use("/api/auth", initWebRoutes);
connectDB();

let port = process.env.PORT || 6969; //tạo tham số port lấy từ .env
//Port === undefined => port 6969

//chạy server
app.listen(port, () => {
    //callback
    console.log("Backend Nodejs is runing on the port: " + port);
});
