import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "outputs", "katalon-tour-testdata");
const imageDir = path.join(outputDir, "images");
await fs.mkdir(imageDir, { recursive: true });

const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

for (let i = 1; i <= 12; i++) {
  await fs.writeFile(path.join(imageDir, `tour_img_${String(i).padStart(2, "0")}.png`), png1x1);
}

const image = (i) => path.join(imageDir, `tour_img_${String(i).padStart(2, "0")}.png`);
const gallery = (count, start = 1) =>
  Array.from({ length: count }, (_, idx) => image(((start + idx - 1) % 12) + 1)).join(";");

const headers = [
  "TC_ID", "Run", "ExpectedResult", "CaseType",
  "BaseUrl", "CreateTourUrl", "LoginEmail", "LoginPassword", "LoginUrl",
  "TenTour", "Difficulty", "SoNgay", "SoDem", "DiemXuatPhat", "DiemDen", "Gia", "MoTaTour",
  "Highlight1", "Highlight2", "Highlight3", "Highlight4", "Highlight5",
  "Schedule1_NgayDi", "Schedule1_NgayVe", "Schedule1_Gia", "Schedule1_ChoToiDa",
  "Schedule2_NgayDi", "Schedule2_NgayVe", "Schedule2_Gia", "Schedule2_ChoToiDa",
  "Schedule3_NgayDi", "Schedule3_NgayVe", "Schedule3_Gia", "Schedule3_ChoToiDa",
];

for (let i = 1; i <= 5; i++) {
  headers.push(`Day${i}_TieuDe`, `Day${i}_HoatDongChinh`, `Day${i}_MoTa`, `Day${i}_BuaAn`, `Day${i}_Anh`);
}

for (let i = 1; i <= 8; i++) {
  headers.push(`Location${i}_Ngay`, `Location${i}_TenDiaDiem`, `Location${i}_ViDo`, `Location${i}_KinhDo`, `Location${i}_Anh`);
}

for (let i = 1; i <= 8; i++) {
  headers.push(`Activity${i}_Ngay`, `Activity${i}_Gio`, `Activity${i}_TenHoatDong`, `Activity${i}_MoTa`);
}

headers.push(
  "ThumbnailPath", "GalleryPaths",
  "Gallery1", "Gallery2", "Gallery3", "Gallery4", "Gallery5", "Gallery6", "Gallery7", "Gallery8", "Gallery9", "Gallery10",
  "Info_BaoGom", "Info_KhongBaoGom", "Info_DieuKien", "Info_PhuongTien", "Info_LuuTru", "Info_DiemThamQuan", "Info_AmThuc", "Info_UuDai",
  "SubmitAction", "ExpectedMessage", "Note",
);

const base = {
  Run: "Y",
  ExpectedResult: "PASS",
  BaseUrl: "http://localhost:5173",
  CreateTourUrl: "http://localhost:5173/operator/tours/new",
  LoginUrl: "http://localhost:5173/login",
  LoginEmail: "",
  LoginPassword: "",
  Difficulty: "easy",
  DiemXuatPhat: "TP Hồ Chí Minh",
  DiemDen: "TP Hồ Chí Minh",
  Gia: 850000,
  MoTaTour: "Tour kiểm thử tự động bằng Katalon.",
  Highlight1: "Lịch trình rõ ràng",
  Highlight2: "Có hướng dẫn viên",
  Highlight3: "Ảnh minh họa đầy đủ",
  Schedule1_NgayDi: "2026-08-10",
  Schedule1_NgayVe: "2026-08-10",
  Schedule1_Gia: 850000,
  Schedule1_ChoToiDa: 20,
  Day1_TieuDe: "Sài Gòn city tour",
  Day1_HoatDongChinh: "Tham quan trung tâm thành phố",
  Day1_MoTa: "Di chuyển ngắn, nhiều điểm chụp ảnh.",
  Day1_BuaAn: "L",
  Day1_Anh: image(1),
  Location1_Ngay: 1,
  Location1_TenDiaDiem: "Nhà thờ Đức Bà",
  Location1_ViDo: "10.7798",
  Location1_KinhDo: "106.6990",
  Location1_Anh: image(2),
  Activity1_Ngay: 1,
  Activity1_Gio: "08:00",
  Activity1_TenHoatDong: "Tập trung tại điểm hẹn",
  Activity1_MoTa: "Hướng dẫn viên phổ biến lịch trình.",
  ThumbnailPath: image(1),
  GalleryPaths: gallery(3, 1),
  Info_BaoGom: "Xe đưa đón, hướng dẫn viên, vé tham quan theo chương trình.",
  Info_KhongBaoGom: "Chi phí cá nhân, VAT, phụ thu ngoài chương trình.",
  Info_DieuKien: "Đặt tour trước ngày khởi hành tối thiểu 2 ngày.",
  Info_PhuongTien: "Xe du lịch đời mới.",
  Info_LuuTru: "Không bao gồm lưu trú với tour 1 ngày.",
  Info_DiemThamQuan: "Các điểm theo lịch trình đã công bố.",
  Info_AmThuc: "Bữa ăn theo lịch trình.",
  Info_UuDai: "Ưu đãi nhóm từ 5 khách.",
  SubmitAction: "draft",
  ExpectedMessage: "Đã lưu bản nháp",
};

function row(overrides) {
  return { ...base, ...overrides };
}

const rows = [
  row({ TC_ID: "TC001", CaseType: "Tour 1 ngày - lưu nháp", TenTour: "Katalon TC001 Sài Gòn 1 ngày" }),
  row({
    TC_ID: "TC002", CaseType: "Tour 2 ngày 1 đêm - gửi duyệt", TenTour: "Katalon TC002 Đà Lạt 2 ngày",
    SoNgay: 2, SoDem: 1, DiemDen: "Đà Lạt", Gia: 2350000,
    Schedule1_NgayDi: "2026-08-12", Schedule1_NgayVe: "2026-08-13", Schedule1_Gia: 2350000, Schedule1_ChoToiDa: 18,
    Day2_TieuDe: "Đà Lạt ngày 2", Day2_HoatDongChinh: "Tham quan nông trại", Day2_MoTa: "Check-out và về lại TP Hồ Chí Minh.", Day2_BuaAn: "B,L", Day2_Anh: image(3),
    Location2_Ngay: 2, Location2_TenDiaDiem: "Quảng trường Lâm Viên", Location2_ViDo: "11.9404", Location2_KinhDo: "108.4583", Location2_Anh: image(4),
    Activity2_Ngay: 2, Activity2_Gio: "09:00", Activity2_TenHoatDong: "Tham quan quảng trường", Activity2_MoTa: "Chụp ảnh và tự do tham quan.",
    SubmitAction: "pending", ExpectedMessage: "Đã gửi phê duyệt",
  }),
  row({
    TC_ID: "TC003", ExpectedResult: "FAIL", CaseType: "Tour 2 ngày 3 đêm - validation", TenTour: "Katalon TC003 Sai ngày đêm",
    SoNgay: 2, SoDem: 3, Schedule1_NgayDi: "2026-08-15", Schedule1_NgayVe: "2026-08-16", ExpectedMessage: "Số ngày và số đêm không hợp lệ",
  }),
  row({ TC_ID: "TC004", CaseType: "Tour có 3 ảnh gallery", TenTour: "Katalon TC004 Gallery 3 ảnh", GalleryPaths: gallery(3, 2) }),
  row({
    TC_ID: "TC005", CaseType: "Tour có 10 ảnh gallery", TenTour: "Katalon TC005 Gallery 10 ảnh", GalleryPaths: gallery(10, 1),
    Gallery1: image(1), Gallery2: image(2), Gallery3: image(3), Gallery4: image(4), Gallery5: image(5),
    Gallery6: image(6), Gallery7: image(7), Gallery8: image(8), Gallery9: image(9), Gallery10: image(10),
  }),
  row({
    TC_ID: "TC006", CaseType: "Tour 3 lịch khởi hành", TenTour: "Katalon TC006 Nhiều lịch khởi hành",
    Schedule2_NgayDi: "2026-08-20", Schedule2_NgayVe: "2026-08-20", Schedule2_Gia: 900000, Schedule2_ChoToiDa: 25,
    Schedule3_NgayDi: "2026-08-25", Schedule3_NgayVe: "2026-08-25", Schedule3_Gia: 950000, Schedule3_ChoToiDa: 30,
  }),
  row({ TC_ID: "TC007", ExpectedResult: "FAIL", CaseType: "Thiếu ảnh đại diện", TenTour: "Katalon TC007 Thiếu thumbnail", ThumbnailPath: "", ExpectedMessage: "Vui lòng tải lên ảnh đại diện" }),
  row({ TC_ID: "TC008", ExpectedResult: "FAIL", CaseType: "Ngày đêm lệch", TenTour: "Katalon TC008 Lệch ngày đêm", SoNgay: 1, SoDem: 2, ExpectedMessage: "Số ngày và số đêm không hợp lệ" }),
  row({ TC_ID: "TC009", ExpectedResult: "FAIL", CaseType: "Ngày về không khớp", TenTour: "Katalon TC009 Ngày về sai", Schedule1_NgayDi: "2026-09-01", Schedule1_NgayVe: "2026-09-05", ExpectedMessage: "không khớp" }),
  row({ TC_ID: "TC010", ExpectedResult: "FAIL", CaseType: "Giá âm", TenTour: "Katalon TC010 Giá âm", Gia: -100000, ExpectedMessage: "Giá cơ bản không hợp lệ" }),
  row({ TC_ID: "TC011", ExpectedResult: "FAIL", CaseType: "Thiếu tên tour", TenTour: "", ExpectedMessage: "Vui lòng điền tên tour" }),
  row({ TC_ID: "TC012", ExpectedResult: "FAIL", CaseType: "Thiếu tiêu đề ngày", TenTour: "Katalon TC012 Thiếu tiêu đề ngày", Day1_TieuDe: "", ExpectedMessage: "Vui lòng nhập tiêu đề" }),
  row({ TC_ID: "TC013", ExpectedResult: "FAIL", CaseType: "Tọa độ sai", TenTour: "Katalon TC013 Tọa độ sai", Location1_ViDo: "999", Location1_KinhDo: "999", ExpectedMessage: "tọa độ" }),
  row({ TC_ID: "TC014", CaseType: "Bữa ăn sáng", TenTour: "Katalon TC014 Bữa sáng", Day1_BuaAn: "B" }),
  row({ TC_ID: "TC015", CaseType: "Bữa ăn trưa tối", TenTour: "Katalon TC015 Trưa tối", Day1_BuaAn: "L,D" }),
  row({ TC_ID: "TC016", CaseType: "Ba bữa ăn", TenTour: "Katalon TC016 Ba bữa", Day1_BuaAn: "B,L,D" }),
  row({
    TC_ID: "TC017", CaseType: "Nhiều địa điểm trong ngày", TenTour: "Katalon TC017 Nhiều địa điểm",
    Location2_Ngay: 1, Location2_TenDiaDiem: "Dinh Độc Lập", Location2_ViDo: "10.7770", Location2_KinhDo: "106.6954", Location2_Anh: image(5),
    Location3_Ngay: 1, Location3_TenDiaDiem: "Chợ Bến Thành", Location3_ViDo: "10.7725", Location3_KinhDo: "106.6980", Location3_Anh: image(6),
  }),
  row({
    TC_ID: "TC018", CaseType: "Nhiều hoạt động trong ngày", TenTour: "Katalon TC018 Nhiều hoạt động",
    Activity2_Ngay: 1, Activity2_Gio: "09:30", Activity2_TenHoatDong: "Tham quan điểm nổi bật", Activity2_MoTa: "Nghe thuyết minh.",
    Activity3_Ngay: 1, Activity3_Gio: "13:30", Activity3_TenHoatDong: "Tự do mua sắm", Activity3_MoTa: "Mua đặc sản địa phương.",
  }),
  row({
    TC_ID: "TC019", CaseType: "Tour 3 ngày 2 đêm", TenTour: "Katalon TC019 3 ngày 2 đêm", SoNgay: 3, SoDem: 2, DiemDen: "Nha Trang", Gia: 3990000,
    Schedule1_NgayDi: "2026-09-10", Schedule1_NgayVe: "2026-09-12", Schedule1_Gia: 3990000, Schedule1_ChoToiDa: 22,
    Day2_TieuDe: "Nha Trang ngày 2", Day2_HoatDongChinh: "Tour đảo", Day2_MoTa: "Tham quan đảo và tắm biển.", Day2_BuaAn: "B,L,D", Day2_Anh: image(7),
    Day3_TieuDe: "Nha Trang ngày 3", Day3_HoatDongChinh: "Mua sắm", Day3_MoTa: "Trả phòng và về lại điểm đón.", Day3_BuaAn: "B,L", Day3_Anh: image(8),
  }),
  row({ TC_ID: "TC020", CaseType: "Gửi duyệt tour 1 ngày", TenTour: "Katalon TC020 Gửi duyệt", SubmitAction: "pending", ExpectedMessage: "Đã gửi phê duyệt" }),
  row({ TC_ID: "TC021", CaseType: "Điểm nhấn 5 dòng", TenTour: "Katalon TC021 Nhiều điểm nhấn", Highlight4: "Lịch trình linh hoạt", Highlight5: "Phù hợp gia đình" }),
  row({ TC_ID: "TC022", CaseType: "Thông tin bổ sung đầy đủ", TenTour: "Katalon TC022 Thông tin đầy đủ" }),
  row({ TC_ID: "TC023", CaseType: "Sức chứa tối đa lớn", TenTour: "Katalon TC023 Sức chứa lớn", Schedule1_ChoToiDa: 100 }),
  row({ TC_ID: "TC024", ExpectedResult: "FAIL", CaseType: "Chỗ tối đa trống", TenTour: "Katalon TC024 Thiếu chỗ tối đa", Schedule1_ChoToiDa: "", ExpectedMessage: "Chỗ tối đa" }),
  row({ TC_ID: "TC025", ExpectedResult: "FAIL", CaseType: "Thiếu điểm đến", TenTour: "Katalon TC025 Thiếu điểm đến", DiemDen: "", ExpectedMessage: "điểm đến" }),
  row({ TC_ID: "TC026", CaseType: "Lưu nháp cuối bộ dữ liệu", TenTour: "Katalon TC026 Lưu nháp cuối", GalleryPaths: gallery(3, 8) }),
].map((item) => ({
  SoNgay: 1,
  SoDem: 0,
  ...item,
}));

const workbook = Workbook.create();
const dataSheet = workbook.worksheets.add("Data_TaoTourMoi");
const guideSheet = workbook.worksheets.add("HuongDan");

const matrix = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))];
dataSheet.getRangeByIndexes(0, 0, matrix.length, headers.length).values = matrix;
dataSheet.freezePanes.freezeRows(1);
dataSheet.getRangeByIndexes(0, 0, 1, headers.length).format = {
  fill: "#0F4C81",
  font: { bold: true, color: "#FFFFFF" },
  wrapText: true,
};
dataSheet.getRangeByIndexes(0, 0, matrix.length, headers.length).format.borders = {
  preset: "all",
  style: "thin",
  color: "#D9E2EC",
};
dataSheet.getRangeByIndexes(1, headers.indexOf("Gia"), rows.length, 1).format.numberFormat = "#,##0";
dataSheet.getRangeByIndexes(1, headers.indexOf("Schedule1_Gia"), rows.length, 1).format.numberFormat = "#,##0";
dataSheet.getRangeByIndexes(1, headers.indexOf("Schedule2_Gia"), rows.length, 1).format.numberFormat = "#,##0";
dataSheet.getRangeByIndexes(1, headers.indexOf("Schedule3_Gia"), rows.length, 1).format.numberFormat = "#,##0";
dataSheet.getRangeByIndexes(0, 0, matrix.length, headers.length).format.autofitColumns();

guideSheet.getRange("A1:D12").values = [
  ["Mục", "Giá trị", "Ghi chú", "Ví dụ"],
  ["Run", "Y/N", "Y thì chạy, N thì bỏ qua", "Y"],
  ["ExpectedResult", "PASS/FAIL", "FAIL nghĩa là mong đợi form báo validation", "PASS"],
  ["SubmitAction", "draft/pending", "draft = lưu nháp, pending = gửi duyệt", "draft"],
  ["Schedule*_ChoToiDa", "number", "Chỗ tối đa theo từng lịch khởi hành", "20"],
  ["Day*_BuaAn", "B,L,D", "B=sáng, L=trưa, D=tối", "B,L,D"],
  ["GalleryPaths", "path;path", "Có thể nhiều ảnh, script có thể giới hạn upload", "a.png;b.png"],
  ["ThumbnailPath", "path", "Ảnh đại diện tour", "tour_img_01.png"],
  ["Info_*", "text", "Mỗi loại thông tin bổ sung chỉ 1 dòng", "Xe đưa đón..."],
  ["Location*_Ngay", "number", "Ngày thứ mấy trong lịch trình", "1"],
  ["Activity*_Ngay", "number", "Ngày thứ mấy trong lịch trình", "1"],
  ["File ảnh mẫu", imageDir, "Đã tạo sẵn 12 ảnh PNG mẫu", ""],
];
guideSheet.getRange("A1:D1").format = {
  fill: "#0F766E",
  font: { bold: true, color: "#FFFFFF" },
};
guideSheet.getRange("A1:D12").format.borders = { preset: "all", style: "thin", color: "#D9D9D9" };
guideSheet.getRange("A:D").format.autofitColumns();

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(outputDir, "Data_TaoTourMoi.xlsx"));
await output.save(path.join(outputDir, "TaoTourMoi_TestData.xlsx"));

console.log(path.join(outputDir, "Data_TaoTourMoi.xlsx"));
