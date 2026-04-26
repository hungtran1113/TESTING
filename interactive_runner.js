const { spawn } = require('child_process');
const readline = require('readline');

// Khởi tạo công cụ đọc input từ bàn phím
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askMenu() {
    console.log("\n=========================================");
    console.log("   MENU KIỂM THỬ TỰ ĐỘNG JIRA (PLAYWRIGHT) ");
    console.log("=========================================");
    console.log("1. UC01 - Tạo dự án mới (Create Project)");
    console.log("2. UC02 - Mời thành viên (Add People)");
    console.log("3. UC03 - Tạo mới Issue (Create Issue)");
    console.log("4. UC04 - Cập nhật Issue (Edit Issue)");
    console.log("5. UC05 - Tạo Sprint mới (Create Sprint)");
    console.log("6. UC06 - Viết bình luận (Add Comment)");
    console.log("7. Chạy TẤT CẢ các chức năng trên");
    console.log("0. Thoát chương trình");
    console.log("=========================================");
    
    rl.question("Nhập lựa chọn của bạn (0-7): ", (choice) => {
        let tagToRun = "";

        switch (choice.trim()) {
            case "1": tagToRun = "@UC01"; break;
            case "2": tagToRun = "@UC02"; break;
            case "3": tagToRun = "@UC03"; break;
            case "4": tagToRun = "@UC04"; break;
            case "5": tagToRun = "@UC05"; break;
            case "6": tagToRun = "@UC06"; break;
            case "7": tagToRun = "ALL"; break;
            case "0":
                console.log("Đang tắt hệ thống kiểm thử. Tạm biệt!");
                rl.close();
                return;
            default:
                console.log("Lựa chọn không hợp lệ, vui lòng nhập lại!");
                askMenu();
                return;
        }

        console.log(`\n>>> ĐANG KHỞI CHẠY KỊCH BẢN: ${tagToRun === "ALL" ? "TẤT CẢ" : tagToRun} <<<`);

        // Cấu hình lệnh gọi Cucumber hỗ trợ file .ts
        let args = [
            'cucumber-js',
            'features/**/*.feature',      // Quét tất cả file kịch bản
            '--require', 'steps/**/*.ts', // Quét tất cả file code chạy (step definitions)
            '--require-module', 'ts-node/register', // Dịch TypeScript sang JS khi chạy
            '--format', 'html:cucumber-report.html' // Tự động xuất báo cáo HTML
        ];

        // Nếu không phải chọn chạy ALL thì thêm bộ lọc theo Tag
        if (tagToRun !== "ALL") {
            args.push('--tags', tagToRun);
        }

        // Fix lỗi npx trên Windows
        const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

        // Gọi tiến trình con (Terminal ẩn) để chạy Playwright
        const testProcess = spawn(npxCmd, args, {
            stdio: 'inherit', // Hiển thị nguyên log trình duyệt ra console này
            shell: true
        });

        testProcess.on('close', (code) => {
            console.log("-----------------------------------------");
            if (code === 0) {
                console.log("=> KẾT QUẢ: THÀNH CÔNG (Pass)");
            } else {
                console.log("=> KẾT QUẢ: THẤT BẠI (Có lỗi xảy ra, check màn hình đỏ)");
            }
            console.log("=> Báo cáo chi tiết đã lưu tại: cucumber-report.html");
            console.log("\n... Nhấn [Enter] để quay lại Menu chính ...");
            
            // Chờ người dùng gõ Enter rồi mới hiện lại Menu (tránh bị trôi text)
            rl.question("", () => {
                askMenu(); 
            });
        });
    });
}

// Gọi hàm chạy Menu lần đầu tiên
askMenu();