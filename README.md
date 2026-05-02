# Hướng dẫn Chạy Kiểm thử Tự động Jira Cloud

Dự án này sử dụng Playwright và Cucumber để kiểm thử tự động các tính năng quản lý trên Jira Cloud (Tạo Space, Mời thành viên, Tạo Issue, Cập nhật Issue, Tạo Sprint, Viết bình luận). 

Để giúp Thầy/Cô có thể clone code về và chạy kiểm thử một cách trơn tru nhất, nhóm đã tích hợp sẵn thông tin tài khoản (đẩy trực tiếp file `.env`) và luồng đăng nhập tự động. Thầy/Cô vui lòng thực hiện theo các bước sau:

## 📁 Cấu trúc thư mục và mô tả chức năng chính

Dự án được tổ chức theo mô hình BDD (Behavior-Driven Development) với cấu trúc các file/thư mục chính như sau:

```text
TESTING/
├── features/                # Chứa các kịch bản kiểm thử (Test Scenarios) viết bằng ngôn ngữ Gherkin dễ đọc hiểu.
│   ├── add_comment.feature  # UC: Bình luận vào Issue
│   ├── add_people.feature   # UC: Mời thành viên vào dự án
│   ├── create_issue.feature # UC: Tạo Issue mới
│   ├── create_space.feature # UC: Tạo Project/Space
│   ├── create_sprint.feature# UC: Tạo Sprint mới
│   └── edit_issue.feature   # UC: Chỉnh sửa/Cập nhật Issue
├── steps/                   # Chứa mã nguồn TypeScript thực thi các bước định nghĩa trong thư mục features (Step Definitions).
│   ├── common_step.ts       # Các step dùng chung (Before/After hooks, Setup UI...)
│   ├── hiep_step.ts         # Logic Automation do bạn Hiệp đảm nhiệm
│   ├── hieu_step.ts         # Logic Automation do bạn Hiếu đảm nhiệm
│   └── nam_step.ts          # Logic Automation do bạn Nam đảm nhiệm
├── .env                     # Chứa các biến môi trường cấu hình (Tài khoản Jira, Mật khẩu, Base URL...).
├── auth_gen.ts              # Kịch bản xử lý đăng nhập tự động và vượt qua màn hình Auth của Jira.
├── cucumber.js              # File cấu hình cho framework kiểm thử Cucumber (Set timeout, retry...).
├── interactive_runner.js    # Mã nguồn tạo Menu tương tác (CLI) giúp chọn Test Case dễ dàng trên Terminal.
├── package.json             # Quản lý danh sách các thư viện (Dependencies) và các lệnh chạy (Scripts).
├── playwright.config.ts     # Cấu hình lõi của Playwright (Trình duyệt ảo, chế độ Headless/UI...).
├── project_key.json         # Lưu trữ dữ liệu động (VD: Mã Project vừa tạo) để truyền cho các Test Case sau.
├── state.json               # Lưu trữ trạng thái đăng nhập (Cookies, Token) giúp robot bỏ qua bước Login ở các lần test sau.
└── README.md                # Tài liệu hướng dẫn sử dụng dự án.
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy kịch bản

### Bước 1: Cài đặt môi trường và thư viện
Thầy/Cô mở Terminal tại thư mục dự án và chạy lần lượt 2 lệnh sau:
```bash
npm install
```
Lệnh thứ hai dưới đây rất quan trọng, giúp Playwright tải lõi các trình duyệt cần thiết để mở trang web.
```bash
npx playwright install
```

### Bước 2: Đăng nhập tự động (Chỉ chạy 1 lần duy nhất)
Thầy/Cô không cần cấu hình tài khoản vì nhóm đã chuẩn bị sẵn khi clone về. Thầy/Cô chỉ cần chạy lệnh sau để hệ thống tiến hành nạp phiên đăng nhập:
```bash
npm run auth
```
- 📌 **Lưu ý:** Trình duyệt sẽ mở lên và tự động điền thông tin. Nếu Jira yêu cầu nhập mã xác nhận (MFA/OTP) hoặc hiện mã CAPTCHA bảo mật, Thầy/Cô vui lòng thực hiện giải hệ thống chống bot bằng tay trực tiếp trên trình duyệt đó. Khi load thành công vào trang chủ Jira, robot sẽ tự động lưu lại trạng thái (Cookies) và đóng trình duyệt.

### Bước 3: Khởi chạy Menu Kiểm thử
Sau khi đã lưu Cookies thành công ở Bước 2, Thầy/Cô có thể chạy chương trình kiểm thử bất cứ lúc nào bằng lệnh:
```bash
npm run runner
```
Hệ thống sẽ hiển thị một Menu tương tác trực tiếp trên Terminal.

Thầy/Cô chỉ cần nhập số tương ứng trên bàn phím để chọn các Use Case (UC) hoặc Test Case (TC) chi tiết muốn chạy. Robot sẽ tự động mở trang và thực thi kịch bản.

- 📌 **Lưu ý về cơ chế Auto-Retry:** Để giảm thiểu sai số do đường truyền mạng hoặc sự chậm trễ của Jira UI, kịch bản test được thiết lập tự động chạy lại (retry) tối đa 2 lần đối với các case gặp lỗi. (Ngoại trừ các Test Case được chủ đích bắt Bug như TC04 sẽ chỉ chạy 1 lần). Thầy/cô vui lòng đợi chương trình chạy hết chu kỳ để ghi nhận kết quả chính xác nhất.

---
## ⚠️ CÁC LỖI THƯỜNG GẶP KHI CLONE CODE (TROUBLESHOOTING)

**1. Lỗi "npm is not recognized as an internal or external command"**
* **Nguyên nhân:** Máy Thầy/Cô chưa cài đặt Node.js.
* **Cách khắc phục:** Vui lòng truy cập [nodejs.org](https://nodejs.org/), tải và cài đặt phiên bản LTS mới nhất, sau đó khởi động lại Terminal.

**2. Lỗi chữ đỏ trên Windows "...cannot be loaded because running scripts is disabled..."**
* **Nguyên nhân:** PowerShell của Windows chặn thực thi script lạ.
* **Cách khắc phục:** 
  1. Mở phần mềm Windows PowerShell bằng quyền Quản trị viên (Run as Administrator).
  2. Dán lệnh này vào và nhấn Enter: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
  3. Gõ `Y` và nhấn Enter để xác nhận. Quay lại VS Code chạy lại là được.

**3. Lỗi Playwright không thể mở trình duyệt (Thiếu thư viện OS)**
* **Nguyên nhân:** Hệ điều hành thiếu một số thư viện lõi (C++, Media...) để chạy trình duyệt ẩn.
* **Cách khắc phục:** Chạy lệnh sau để Playwright tự động bổ sung thư viện hệ thống:
  ```bash
  npx playwright install-deps
  ```

**4. Lỗi "Unsupported engine" hoặc SyntaxError khi chạy lệnh**
* **Nguyên nhân:** Phiên bản Node.js trên máy đang quá cũ (Playwright yêu cầu Node v18+).
* **Cách khắc phục:** Truy cập [nodejs.org](https://nodejs.org/), tải và cài đặt bản LTS mới nhất để cập nhật.

**5. Lỗi "ENOENT: no such file or directory" liên quan đến Cookies hoặc project_key.json**
* **Nguyên nhân:** Thầy/Cô đang chạy kịch bản Kiểm thử trước khi hệ thống kịp tạo ra các file dữ liệu nền.
* **Cách khắc phục:** Vui lòng đảm bảo đã chạy lệnh `npm run auth` ít nhất 1 lần để hệ thống sinh ra file Cookies. Với các Test Case cần dữ liệu liên kết, vui lòng chạy theo thứ tự (VD: Chạy UC tạo dự án trước để lấy Key, sau đó mới chạy UC tạo Issue).

---
*Chúc Thầy/Cô có trải nghiệm tốt với bài tập của nhóm chúng em!*
```