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
    console.log("1. UC01 - Tạo dự án mới (Create Project) [CÓ SUB-MENU]");
    console.log("2. UC02 - Mời thành viên (Add People)");
    console.log("3. UC03 - Tạo mới Issue (Create Issue)   [CÓ SUB-MENU]");
    console.log("4. UC04 - Cập nhật Issue (Edit Issue)");
    console.log("5. UC05 - Tạo Sprint mới (Create Sprint)");
    console.log("6. UC06 - Viết bình luận (Add Comment)");
    console.log("7. Chạy TẤT CẢ các chức năng trên");
    console.log("0. Thoát chương trình");
    console.log("=========================================");
    
    rl.question("Nhập lựa chọn của bạn (0-7): ", (choice) => {
        switch (choice.trim()) {
            case "1": return askSubMenuUC01();
            case "2": return runCucumberTest("@UC02");
            case "3": return askSubMenuUC03();
            case "4": return runCucumberTest("@UC04");
            case "5": return runCucumberTest("@UC05");
            case "6": return runCucumberTest("@UC06");
            case "7": return runCucumberTest("ALL");
            case "0":
                console.log("Đang tắt hệ thống kiểm thử. Tạm biệt!");
                rl.close();
                return;
            default:
                console.log("Lựa chọn không hợp lệ, vui lòng nhập lại!");
                askMenu();
                return;
        }
    });
}

// HÀM HIỂN THỊ MENU CON CHO UC01 (Của Nam)
function askSubMenuUC01() {
    console.log("\n=============================================");
    console.log("   SUB-MENU: CHỨC NĂNG TẠO SPACE (UC01)");
    console.log("=============================================");
    console.log(" 1. [Success] Tạo Space mẫu Scrum (TC01)");
    console.log(" 2. [Success] Tạo Space mẫu Kanban (TC02)");
    console.log(" 3. [Success] Tạo Space mẫu Bug tracking (TC03)");
    console.log(" 4. [Fail] Báo lỗi khi để trống Tên dự án (TC04)");
    console.log(" 5. [Fail] Báo lỗi Key chứa ký tự đặc biệt (TC05)");
    console.log(" 0. Quay lại menu chính");
    console.log("---------------------------------------------");

    rl.question("Nhập test case bạn muốn chạy (0-5): ", (choice) => {
        let tagToRun = "";
        switch (choice.trim()) {
            case "1": tagToRun = "@TC01"; break;
            case "2": tagToRun = "@TC02"; break;
            case "3": tagToRun = "@TC03"; break;
            case "4": tagToRun = "@TC04"; break;
            case "5": tagToRun = "@TC05"; break;
            case "0": return askMenu();
            default:
                console.log("Lựa chọn không hợp lệ, vui lòng nhập lại!");
                return askSubMenuUC01();
        }
        runCucumberTest(tagToRun);
    });
}

// HÀM HIỂN THỊ MENU CON CHO UC03 (Của Hiệp)
function askSubMenuUC03() {
    console.log("\n=============================================");
    console.log("   SUB-MENU: CHỨC NĂNG TẠO ISSUE (UC03)");
    console.log("=============================================");
    console.log(" 1. [Success] Tạo Issue với dữ liệu hợp lệ (TC01)");
    console.log(" 2. [Success] Tạo Issue với Summary ngắn (TC02)");
    console.log(" 3. [Success] Tạo Issue ký tự đặc biệt (TC03)");
    console.log(" 4. [Fail] Báo lỗi khi để trống Summary (TC04)");
    console.log(" 5. [Fail] Báo lỗi khi Summary quá dài (TC05)");
    console.log(" 0. Quay lại menu chính");
    console.log("---------------------------------------------");

    rl.question("Nhập test case bạn muốn chạy (0-5): ", (choice) => {
        let tagToRun = "";
        switch (choice.trim()) {
            // Nối map chuẩn với tiền tố TC03_ của bạn
            case "1": tagToRun = "@TC03_01"; break;
            case "2": tagToRun = "@TC03_02"; break;
            case "3": tagToRun = "@TC03_03"; break;
            case "4": tagToRun = "@TC03_04"; break;
            case "5": tagToRun = "@TC03_05"; break;
            case "0": return askMenu();
            default:
                console.log("Lựa chọn không hợp lệ!");
                return askSubMenuUC03();
        }
        runCucumberTest(tagToRun);
    });
}

// HÀM THỰC THI LỆNH CUCUMBER (Dùng chung cho cả Menu chính và Sub-Menu)
// HÀM THỰC THI LỆNH CUCUMBER
function runCucumberTest(tagToRun) {
    console.log(`\n>>> ĐANG KHỞI CHẠY KỊCH BẢN: ${tagToRun === "ALL" ? "TẤT CẢ" : tagToRun} <<<`);

    let args = [
        'cucumber-js',
        'features/**/*.feature',      
        '--require', 'steps/**/*.ts',
        '--require-module', 'ts-node/register',
        '--format', 'html:cucumber-report.html',
        
        // MỚI THÊM: CƠ CHẾ TỰ ĐỘNG CHẠY LẠI (AUTO-RETRY)
        // Nếu Testcase thất bại, nó sẽ tự động chạy lại tối đa 2 lần. 
        // Chỉ khi nào cả 3 lần đều thất bại thì nó mới báo ĐỎ.
        '--retry', '2' 
    ];

    if (tagToRun !== "ALL") {
        args.push('--tags', `"${tagToRun}"`);
    }

    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

    const testProcess = spawn(npxCmd, args, {
        stdio: 'inherit',
        shell: true
    });

    testProcess.on('close', (code) => {
        console.log("-----------------------------------------");
        if (code === 0) {
            console.log("=> KẾT QUẢ CUỐI CÙNG: THÀNH CÔNG (Pass)");
        } else {
            console.log("=> KẾT QUẢ CUỐI CÙNG: THẤT BẠI (Đã thử chạy lại nhưng vẫn lỗi)");
        }
        console.log("=> Báo cáo chi tiết đã lưu tại: cucumber-report.html");
        console.log("\n... Nhấn [Enter] để quay lại Menu chính ...");
        
        rl.question("", () => {
            askMenu(); 
        });
    });
}

askMenu();