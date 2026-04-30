import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from './common_step'; 
import * as fs from 'fs'; 

const SHARED_DATA_FILE = 'project_key.json';

// =====================================================================
// PHẦN 1: UC05 - QUẢN LÝ SPRINT (CREATE & EDIT SPRINT)
// =====================================================================

Given('Tôi đã ở trong trang Backlog của dự án', async function () {
    const baseUrl = process.env.JIRA_BASE_URL || 'https://our-testing.atlassian.net';

    if (!fs.existsSync(SHARED_DATA_FILE)) {
        throw new Error(`❌ Không tìm thấy file ${SHARED_DATA_FILE}! Hãy chạy UC01 để tạo dự án trước.`);
    }
    const data = JSON.parse(fs.readFileSync(SHARED_DATA_FILE, 'utf8'));
    const projectKey = data.projectKey;

    await page.goto(`${baseUrl}/projects/${projectKey}`, { waitUntil: 'load' });
    await page.waitForTimeout(3000);

    const backlogMenu = page.locator('a[href*="/backlog"], a:has-text("Backlog"), [data-testid*="navigation-item-backlog"]').first();
    await backlogMenu.waitFor({ state: 'visible', timeout: 10000 });
    await backlogMenu.click();

    await page.waitForTimeout(2000);
});

When('Tôi nhấn nút "Create sprint"', async function () {
    const createSprintBtn = page.locator('[data-testid="software-backlog.card-list.card-list-header.create-sprint-button"]').first();
    await createSprintBtn.waitFor({ state: 'visible', timeout: 10000 });
    await createSprintBtn.click();
    await page.waitForTimeout(1000);
});

Then('Sprint mới xuất hiện với tên mặc định tiếp theo', async function () {
    const sprintContainer = page.locator('[data-testid*="sprint-container"], [data-testid*="sprint-header"]').first();
    await expect(sprintContainer).toBeVisible({ timeout: 10000 });
});

// -----------------------------------------------------------
// GỘP CHUNG TẤT CẢ CÁC HÀNH ĐỘNG "NHẤN" VÀO 1 HÀM (Cho cả UC05 và UC06)
// -----------------------------------------------------------
When('Tôi nhấn {string}', async function (actionName: string) {
    if (actionName === "Edit sprint") {
        // Dùng *= để bỏ qua tiền tố tên dự án động
        const moreMenuBtn = page.locator('button[data-testid*="software-backlog.card-list.sprints-menu."]').first();
        await moreMenuBtn.waitFor({ state: 'visible', timeout: 5000 });
        await moreMenuBtn.click();

        const editOption = page.locator('[data-testid="software-backlog.card-list.sprints-menu.sprint-edit"]').first();
        await editOption.waitFor({ state: 'visible', timeout: 5000 });
        await editOption.click();
        
        await page.waitForTimeout(1000); 
    } 
    else if (actionName === "Update") {
        const updateBtn = page.locator('div[role="dialog"] button:has-text("Update")').first();
        await updateBtn.click({ force: true }).catch(() => {});
    }
    else if (actionName === "Save") {
        // Tích hợp luôn nút Save của phần Add Comment vào đây
        const saveBtn = page.locator('[data-testid="comment-save-button"]').first();
        await saveBtn.click();
        await page.waitForTimeout(2000); 
    }
    else {
        // Các nút bấm thông thường khác
        const targetBtn = page.locator(`button:has-text("${actionName}")`).first();
        await targetBtn.click();
    }
});

// -----------------------------------------------------------
// TC_SPR_02: XÓA SẠCH TÊN SPRINT (CẬP NHẬT LOCATOR CHUẨN)
// -----------------------------------------------------------
When('Tôi xóa sạch nội dung tại ô Name', async function () {
    // Sử dụng chính xác name="sprintName" theo mã HTML bạn vừa lấy được
    const nameInput = page.locator('input[name="sprintName"]').first();    
    // Đợi ô input xuất hiện
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.focus();
    
    // Bôi đen toàn bộ và nhấn Backspace để xóa
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // Chờ 0.5s để UI của Jira kịp nhận diện là ô này đã bị trống
    await page.waitForTimeout(500);
});

When('Tôi nhấn Save hoặc Enter', async function () {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500); 
});

Then('Hệ thống báo lỗi {string}', async function (errorMsgStr: string) {
    // Bỏ cái div[role="dialog"] đi, tìm trực tiếp đoạn text lỗi trên toàn màn hình
    const errorMsg = page.getByText(new RegExp(errorMsgStr, 'i')).first();
    
    try {
        await expect(errorMsg).toBeVisible({ timeout: 5000 });
        console.log(`=> ✅ KẾT QUẢ: Đã thấy báo lỗi "${errorMsgStr}" trên màn hình.`);
    } catch (error) {
        // Bật lại "camera giám sát" nhỡ đâu Jira nó đổi câu chữ báo lỗi khác
        await page.screenshot({ path: 'bug_tc_spr_02_error_msg.png', fullPage: true });
        throw new Error(`❌ BUG: Không tìm thấy chữ báo lỗi! Hãy mở ảnh 'bug_tc_spr_02_error_msg.png' để xem lúc đó màn hình hiển thị lỗi gì nhé!`);
    }
});

// -----------------------------------------------------------
// TC_SPR_03: NHẬP NGÀY BẮT ĐẦU VÀ KẾT THÚC
// -----------------------------------------------------------
When('Tôi chọn ngày bắt đầu {string} và ngày kết thúc {string} sớm hơn', async function (startDate: string, endDate: string) {
    const startDateInput = page.locator('[data-testid="software-sprint-form-components.ui.sprint-period.sprint-dates-range.sprint-date.date-time-picker-startDate--datepicker-select--input"]').first();
    const endDateInput = page.locator('[data-testid="software-sprint-form-components.ui.sprint-period.sprint-dates-range.sprint-date.date-time-picker-endDate--datepicker-select--input"]').first();
    
    // Xử lý Start Date: Dùng type() thay cho fill() để React kịp bắt sự kiện
    await startDateInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(startDate, { delay: 50 }); // Gõ từng ký tự
    await page.keyboard.press('Enter'); 
    
    // Xử lý End Date
    await endDateInput.click();
    await page.keyboard.press('Control+A'); 
    await page.keyboard.press('Backspace');
    await page.keyboard.type(endDate, { delay: 50 });
    await page.keyboard.press('Enter'); 
    
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000); 
});

// -----------------------------------------------------------
// TC_SPR_03: XÁC NHẬN CÂU BÁO LỖI (ĐÃ XÓA DIV DIALOG)
// -----------------------------------------------------------
Then('Thông báo lỗi logic thời gian không hợp lệ', async function () {
    // XÓA div[role="dialog"], chỉ tìm text thuần trên màn hình
    const errorMsg = page.getByText(/must be after the start date|The end date of a sprint/i).first();    

    try {
        await expect(errorMsg).toBeVisible({ timeout: 5000 });
        console.log("=> ✅ KẾT QUẢ: Đã thấy báo lỗi logic thời gian trên màn hình.");
    } catch (error) {
        throw new Error(`❌ BUG: Không tìm thấy chữ báo lỗi thời gian!`);
    }
});


// =====================================================================
// PHẦN 2: UC06 - QUẢN LÝ BÌNH LUẬN (ADD COMMENT)
// =====================================================================

Given('Tôi mở chi tiết Issue', async function () {
    const baseUrl = process.env.JIRA_BASE_URL || 'https://our-testing.atlassian.net';
    let issueKey = "SCRUM-1";

    if (fs.existsSync(SHARED_DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(SHARED_DATA_FILE, 'utf8'));
        if (data.issueKey) {
            issueKey = data.issueKey; 
        } else if (data.projectKey) {
            issueKey = `${data.projectKey}-1`; 
        }
    }

    console.log(`=> ℹ️ Đang điều hướng đến Issue: ${issueKey}`);
    await page.goto(`${baseUrl}/browse/${issueKey}`, { waitUntil: 'load', timeout: 60000 });
    
    const mainContent = page.locator('#jira-frontend, [data-testid="issue.views.issue-details.full-issue-details.view-layout"]').first();
    try {
        await mainContent.waitFor({ state: 'visible', timeout: 20000 });
        console.log("=> ✅ Đã tải xong trang chi tiết Issue.");
    } catch (e) {
        console.log("⚠️ Cảnh báo: Trang tải hơi chậm hoặc bị kẹt ở màn hình trung gian.");
        await page.screenshot({ path: 'debug_issue_page_load.png' });
    }
});

// -----------------------------------------------------------
// TC_CMT_02: CLICK VÀO Ô "ADD A COMMENT"
// -----------------------------------------------------------
When('Tôi click vào ô "Add a comment"', async function () {
    const editor = page.locator('#ak-editor-textarea, div.ProseMirror[contenteditable="true"]').first();
    const commentPlaceholder = page.locator('[data-testid="canned-comments.common.ui.comment-text-area-placeholder.textarea"]').first();
    
    if (!(await editor.isVisible().catch(() => false))) {
        await commentPlaceholder.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1000);
        if (!(await editor.isVisible().catch(() => false))) {
            await page.keyboard.press('m');
            await page.waitForTimeout(1000);
        }
    }
});

// -----------------------------------------------------------
// TC_CMT_01: NHẬP BÌNH LUẬN HỢP LỆ
// -----------------------------------------------------------
When('Tôi nhập nội dung {string} vào ô Comment', async function (text: string) {
    const editor = page.locator('#ak-editor-textarea, div.ProseMirror[contenteditable="true"]').first();
    const commentPlaceholder = page.locator('[data-testid="canned-comments.common.ui.comment-text-area-placeholder.textarea"]').first();

    // 1. Mở form nếu chưa mở
    if (!(await editor.isVisible().catch(() => false))) {
        await commentPlaceholder.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1000);
        if (!(await editor.isVisible().catch(() => false))) {
            await page.keyboard.press('m');
            await page.waitForTimeout(1000);
        }
    }

    // 2. Chờ khung soạn thảo sẵn sàng
    await editor.waitFor({ state: 'visible', timeout: 10000 });
    
    // 3. Dọn rác cũ (nếu có)
    await editor.click({ force: true });
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);
    
    // 4. Gõ text mới
    await page.keyboard.type(text, { delay: 50 });
});

// -----------------------------------------------------------
// TC_CMT_01: XÁC NHẬN BÌNH LUẬN THÀNH CÔNG
// -----------------------------------------------------------
Then('Bình luận hiển thị đúng nội dung kèm nhãn thời gian {string}', async function (timeTag: string) {
    const commentContent = page.getByText('Test tự động').first();
    // Dùng Regex để bao quát mọi trường hợp hiển thị thời gian của Jira
    const timeLabel = page.getByText(/Just now|seconds?|minutes?/i).first();

    try {
        await expect(commentContent).toBeVisible({ timeout: 10000 });
        await expect(timeLabel).toBeVisible({ timeout: 5000 });
        console.log(`=> ✅ KẾT QUẢ: Đã thấy bình luận "Test tự động" xuất hiện thành công.`);
    } catch (error) {
        await page.screenshot({ path: 'bug_tc_cmt_01_result.png', fullPage: true });
        throw new Error(`❌ BUG: Không tìm thấy bình luận "Test tự động"! Xem ảnh 'bug_tc_cmt_01_result.png' nhé!`);
    }
});

// -----------------------------------------------------------
// TC_CMT_02: ĐỂ TRỐNG Ô BÌNH LUẬN (COMBO HỦY DIỆT RÁC)
// -----------------------------------------------------------
When('Tôi không nhập bất kỳ ký tự nào', async function () {
    const editor = page.locator('#ak-editor-textarea, div.ProseMirror[contenteditable="true"]').first();
    const commentPlaceholder = page.locator('[data-testid="canned-comments.common.ui.comment-text-area-placeholder.textarea"]').first();

    // 1. Mở form nếu chưa mở
    if (!(await editor.isVisible().catch(() => false))) {
        await commentPlaceholder.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1000);
        if (!(await editor.isVisible().catch(() => false))) {
            await page.keyboard.press('m');
            await page.waitForTimeout(1000);
        }
    }

    await editor.waitFor({ state: 'visible', timeout: 10000 });
    
    // 2. Click thẳng vào giữa ô nhập liệu để lấy Focus tuyệt đối
    await editor.click({ force: true });
    await page.waitForTimeout(500);

    // 3. COMBO 1: Bôi đen tất cả bằng cả 2 phím tắt (Bao trọn Windows + Mac)
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Meta+A'); 
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);

    // 4. COMBO 2: Đánh thức Jira bằng cách gõ 1 dấu cách rồi xóa ngay
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    await page.keyboard.press('Backspace');

    // 5. COMBO 3: SPAM phím Backspace 10 lần liên tiếp (Lỡ chữ dài quá không bôi đen được thì xóa lùi dần)
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(50); // Xóa từ từ cho giống người thật
    }

    // 6. CÚ CHỐT: Bấm chuột ra vùng trống ngoài trang để ô Comment bị mất Focus (onBlur).
    // Phải làm vậy Jira mới chịu tính toán lại trạng thái và khóa nút Save!
    await page.mouse.click(0, 0); // Bấm vào góc trên cùng bên trái màn hình
    
    // Đợi 1.5 giây cho cái nút Save nó mờ hẳn đi
    await page.waitForTimeout(1500);
});

// -----------------------------------------------------------
// TC_CMT_02: KIỂM TRA NÚT SAVE BỊ VÔ HIỆU HÓA (BẢN GỌN NHẸ - CHỈ IN CONSOLE)
// -----------------------------------------------------------
Then('Nút "Save" bị vô hiệu hóa \\(Disabled\\), không thể nhấn thực hiện', async function () {
    const saveBtn = page.locator('[data-testid="comment-save-button"]').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 5000 });

    console.log("=> ℹ️ Đang kiểm tra: Cố tình bấm vào nút Save xem hệ thống có chặn không...");
    
    // 1. Cố tình bấm lưu!
    await saveBtn.click({ force: true });
    
    // 2. Chờ 1 giây xem hệ thống có đóng form lại không
    await page.waitForTimeout(1000); 

    // 3. Khung soạn thảo vẫn phải đang hiển thị trên màn hình
    const editor = page.locator('#ak-editor-textarea, div.ProseMirror[contenteditable="true"]').first();
    
    if (await editor.isVisible()) {
        console.log("=> ✅ KẾT QUẢ [PASS]: Nút Save đã bị khóa ngầm. Bấm vào không có tác dụng, hệ thống đã chặn gửi comment rỗng thành công!");
    } else {
        throw new Error("❌ BUG [FAIL]: Hệ thống không chặn! Khung Comment đã bị đóng và gửi thành công.");
    }
});
// -----------------------------------------------------------
// TC_CMT_03: TAG TÊN NGƯỜI DÙNG KHÔNG TỒN TẠI
// -----------------------------------------------------------
When('Tôi nhập nội dung có chứa ký tự {string} và tên không có trong dự án là {string}', async function (char: string, name: string) {
    const editor = page.locator('#ak-editor-textarea, div.ProseMirror[contenteditable="true"]').first();
    const commentPlaceholder = page.locator('[data-testid="canned-comments.common.ui.comment-text-area-placeholder.textarea"]').first();

    // 1. Mở form nếu chưa mở
    if (!(await editor.isVisible().catch(() => false))) {
        await commentPlaceholder.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1000);
        if (!(await editor.isVisible().catch(() => false))) {
            await page.keyboard.press('m');
            await page.waitForTimeout(1000);
        }
    }

    await editor.waitFor({ state: 'visible', timeout: 10000 });
    
    // 2. Dọn rác
    await editor.click({ force: true });
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);
    
    // 3. Gõ @Unknown và THÊM DẤU CÁCH (Space) ở cuối
    // Dấu cách này là "cú chốt" báo cho Jira biết là đã gõ xong từ, ép nó biến thành văn bản thuần!
    await page.keyboard.type(`${char}${name} `, { delay: 100 });
    await page.waitForTimeout(2000); 
});

Then('Hệ thống không hiển thị gợi ý thành viên và coi đó là văn bản thuần', async function () {
    // Bắt chính xác cái listbox chứa kết quả gợi ý mà Jira trả về trong log
    const mentionPopup = page.locator('div[role="listbox"][aria-label="Typeahead results"], [data-testid*="mention-popup"]').first();

    // Dùng cơ chế kiểm tra thông minh (Bao trọn 2 trường hợp)
    if (await mentionPopup.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Trường hợp 1: Popup vẫn hiện nhưng báo "Không tìm thấy"
        const optionCount = await mentionPopup.locator('[role="option"]').count();
        const popupText = await mentionPopup.innerText();

        // Nếu số lượng người dùng gợi ý = 0 hoặc có báo text "No result/match"
        if (optionCount === 0 || popupText.toLowerCase().includes('no match') || popupText.toLowerCase().includes('result')) {
            console.log(`=> ✅ KẾT QUẢ [PASS]: Popup có hiện nhưng báo lỗi "${popupText.replace(/\n/g, ' ')}", KHÔNG CÓ gợi ý thành viên nào.`);
        } else {
            throw new Error(`❌ BUG [FAIL]: Vẫn thấy ${optionCount} gợi ý người dùng xuất hiện! Nội dung: ${popupText}`);
        }
    } else {
        // Trường hợp 2: Popup đã bị ẩn đi hoàn toàn (Tuyệt vời nhất)
        console.log("=> ✅ KẾT QUẢ [PASS]: Popup gợi ý đã bị ẩn hoàn toàn (Jira coi đó là văn bản thuần).");
    }
});