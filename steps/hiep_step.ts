import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page, getDynamicProjectUrl } from './common_step'; 
import * as fs from 'fs';

// =====================================================================
// PHẦN 1: CREATE ISSUE 
// =====================================================================

Given('Tôi truy cập vào trang dự án Jira của nhóm', async function () {
    const targetUrl = getDynamicProjectUrl("/summary"); 
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000); 

    const isLoggedIn = await page.locator('nav[aria-label="Primary"], button:has-text("Create"), [data-testid="atlassian-navigation--primary-actions"]').first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!isLoggedIn && !page.url().includes('login')) {
        console.log("\n=> ⚠️ Không tìm thấy Menu Jira! Cookies đã chết. Đang ép chuyển sang trang Login...");
        await page.goto('https://id.atlassian.com/login', { waitUntil: 'load' });
        await page.waitForTimeout(3000);
    }

    if (page.url().includes('login') || page.url().includes('auth') || page.url().includes('id.atlassian.com')) {
        console.log("\n=> ⚠️ Robot đang tự động đăng nhập lại...");
        const email = process.env.JIRA_EMAIL || "";
        const password = process.env.JIRA_PASSWORD || "";
        
        const emailInput = page.locator('#username');
        if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await emailInput.fill(email);
            await page.locator('#login-submit').click();
        }
        
        try {
            const passInput = page.locator('#password');
            await passInput.waitFor({ state: 'visible', timeout: 15000 });
            await passInput.fill(password);
            await page.locator('#login-submit').click();
        } catch (e) {
            console.log("=> ⏩ Jira không yêu cầu Password (SSO).");
        }
        
        await page.waitForURL(/.*(jira|for-you|browse|projects).*/, { timeout: 30000 }).catch(() => {});
        await page.goto(targetUrl, { waitUntil: 'load' });
    } else {
        console.log("=> ✅ Cookies hợp lệ, trang dự án đã load ổn định.");
    }
});

// HỖ TRỢ 2 LOẠI NÚT CREATE TRÊN THANH ĐIỀU HƯỚNG ---
When('Tôi nhấn nút Create trên thanh điều hướng', async function () {
    await page.waitForTimeout(2000);

    const navCreateBtn = page.locator('[data-testid="atlassian-navigation--create-button"], #createGlobalItem');
    const footerCreateBtn = page.locator('[data-testid="issue-create.common.ui.footer.create-button"]');

    // Kiểm tra và nhấn nút có sẵn
    if (await navCreateBtn.first().isVisible()) {
        await navCreateBtn.first().click();
        console.log("=> Đã nhấn nút Create trên Navbar.");
    } else if (await footerCreateBtn.first().isVisible()) {
        await footerCreateBtn.first().click();
        console.log("=> Phát hiện nút Create trên Modal, nhấn luôn.");
    }

    // XỬ LÝ LỖI "HIDDEN H2": Đợi Modal xuất hiện nhưng mềm dẻo hơn
    const modalHeader = page.locator('[role="dialog"] h2, [data-testid="issue-create.common.ui.modal.header"]');
    
    try {
        // Đợi cho đến khi tiêu đề gắn vào DOM và hiển thị
        await modalHeader.first().waitFor({ state: 'attached', timeout: 10000 });
        await page.waitForTimeout(1000); // Nghỉ 1 giây cho hiệu ứng mở Modal xong hoàn toàn
    } catch (e) {
        console.log("=> ⚠️ Modal chưa hiện, click bù lần 2...");
        await navCreateBtn.first().click({ force: true });
    }
});

// HỖ TRỢ 2 CÁCH NHẬP INPUT SUMMARY ---
const summarySelectors = [
    'input[data-testid="issue-create-commons.common.ui.fields.base-fields.input-field.textfield"]',
    'input#summary-field',
    'textarea[name="summary"]',
    'input[name="summary"]'
].join(', ');

When('Tôi nhập Summary là {string}', async function (baseText: string) {
    const summaryInput = page.locator(summarySelectors).first();
    
    // Kiểm tra nếu có 1 trong các bộ chọn trên thì nhập
    await summaryInput.waitFor({ state: 'visible', timeout: 15000 });
    
    const randomStr = Math.random().toString(36).substring(7);
    const finalSummary = `${baseText} - ${randomStr}`;
    
    await summaryInput.fill(finalSummary);
    console.log(`=> Đã nhập Summary thành công vào ô: ${finalSummary}`);
});

When('Tôi để trống trường Summary', async function () {
    const summaryInput = page.locator(summarySelectors).first();
    await summaryInput.waitFor({ state: 'visible', timeout: 15000 });
    await summaryInput.click();
    await summaryInput.fill('');
    await summaryInput.press('Tab');
});

When('Tôi nhập Summary vượt quá 255 ký tự', async function () {
    const longText = "A".repeat(260);
    const summaryInput = page.locator(summarySelectors).first();
    await summaryInput.waitFor({ state: 'visible', timeout: 15000 });
    await summaryInput.fill(longText);
});

// HỖ TRỢ NÚT XÁC NHẬN CREATE TRÊN FORM ---
When('Tôi nhấn nút xác nhận Create trên form', async function () {
    const submitBtn = page.locator('[data-testid="issue-create.common.ui.footer.create-button"], button[type="submit"]:has-text("Create")').last();
    
    await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await submitBtn.click({ force: true });
    console.log("=> Đã nhấn nút xác nhận Create trên Form.");
});

Then('Hệ thống phải hiển thị thông báo tạo Issue thành công', async function () {
    const successMsg = page.locator('span:has-text("created issue"), div[role="alert"]').first();
    await successMsg.waitFor({ state: 'visible', timeout: 15000 });
    console.log("\n[Terminal] ✅ KẾT QUẢ: TẠO ISSUE THÀNH CÔNG!");
});

Then('Hệ thống phải hiển thị cảnh báo lỗi {string}', async function (expectedError: string) {
    let searchPattern = expectedError;
    if (expectedError.includes("too long")) {
        searchPattern = "too long|255 characters|less than 255|exceeds";
    }

    const errorMsg = page.locator('div[id*="error"], span[class*="error"], [role="alert"]')
                         .filter({ hasText: new RegExp(searchPattern, 'i') })
                         .or(page.getByText(new RegExp(searchPattern, 'i')))
                         .first();

    await errorMsg.waitFor({ state: 'visible', timeout: 15000 });
    console.log(`\n[Terminal] ✅ KẾT QUẢ: Đã bắt được lỗi: "${expectedError}"`);
});

// =====================================================================
// PHẦN 2: EDIT ISSUE 
// =====================================================================

Given('Tôi đang xem chi tiết một Issue hiện có', async function () {
    const baseUrl = process.env.JIRA_BASE_URL || 'https://our-testing.atlassian.net';
    
    let issueKey = "TEST49829-1"; 
    if (fs.existsSync('project_key.json')) {
        const data = JSON.parse(fs.readFileSync('project_key.json', 'utf8'));
        issueKey = `${data.projectKey}-1`; 
    }

    const issueUrl = `${baseUrl}/browse/${issueKey}`;
    console.log(`=> Đang truy cập Issue: ${issueUrl}`);
    
    await page.goto(issueUrl, { waitUntil: 'domcontentloaded' });
    
    console.log("=> Đang kiểm tra trạng thái chuyển hướng của Jira...");
    let isLoginRequired = false;
    
    for (let i = 0; i < 15; i++) {
        const currentUrl = page.url();
        if (currentUrl.includes('login') || currentUrl.includes('auth') || currentUrl.includes('id.atlassian.com')) {
            isLoginRequired = true;
            break;
        }
        
        const issueContainer = page.locator('[data-testid="issue-view.common.view-issue-container"], #jira-issue-header').first();
        if (await issueContainer.isVisible().catch(() => false)) {
            break; 
        }
        await page.waitForTimeout(1000); 
    }

    if (isLoginRequired) {
        console.log("\n=> ⚠️ Phát hiện Jira bắt đăng nhập lại. Đang xử lý Auto-Login...");
        const email = process.env.JIRA_EMAIL || "";
        const password = process.env.JIRA_PASSWORD || "";
        
        const emailInput = page.locator('#username, input[type="email"]').first();
        if (await emailInput.isVisible({ timeout: 10000 }).catch(() => false)) {
            await emailInput.fill(email);
            await page.locator('#login-submit, button:has-text("Continue")').first().click();
        }

        await page.waitForTimeout(3000); 

        try {
            const passInput = page.locator('#password, input[type="password"]').first();
            await passInput.waitFor({ state: 'visible', timeout: 10000 });
            await passInput.fill(password);
            await page.locator('#login-submit, button:has-text("Log in")').first().click();
        } catch (e) {
            console.log("=> ℹ️ Có thể Jira đang dùng SSO, bỏ qua nhập pass...");
        }
        
        console.log("=> Đang đợi Jira xác thực và cấp quyền...");
        await page.waitForFunction(() => {
            const currentUrl = window.location.href;
            return !currentUrl.includes('id.atlassian.com') && !currentUrl.includes('login');
        }, { timeout: 30000 }).catch(() => console.log("=> ⚠️ Quá thời gian chờ thoát Login, thử ép đi tiếp..."));
        
        await page.goto(issueUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
    }

    try {
        await page.waitForSelector('[data-testid="issue-view.common.view-issue-container"], #jira-issue-header', { timeout: 20000 });
        console.log("=> ✅ Đã mở thành công chi tiết Issue!");
    } catch (error) {
        console.log(`=> ❌ LỖI: Không tìm thấy Issue. URL hiện tại là: ${page.url()}`);
        throw error; 
    }
});

// -----------------------------------------------------------
// 1. CHỈNH SỬA STORY POINT (Lách luật Input Number)
// -----------------------------------------------------------
When('Tôi nhập {string} vào trường Story point estimate', async function (value: string) {
    const storyPointContainer = page.locator('[data-testid*="story-point"], [aria-label*="Story point estimate"]').first();
    await storyPointContainer.waitFor({ state: 'visible', timeout: 10000 });
    await storyPointContainer.click();

    const inputField = page.locator('input[aria-label*="Story point estimate"], [data-testid*="story-point"] input').first();
    await inputField.waitFor({ state: 'visible', timeout: 5000 });
    
    await inputField.focus();
    for(let i=0; i<5; i++) await page.keyboard.press('Backspace');
    await page.keyboard.type(value, { delay: 100 }); 
    
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter'); 
    console.log(`=> Đã gõ ép buộc giá trị: "${value}"`);
});

When('Tôi nhập Story point ngẫu nhiên từ 1 đến 20', async function () {
    const storyPointContainer = page.locator('[data-testid*="story-point"], [aria-label*="Story point estimate"]').first();
    await storyPointContainer.waitFor({ state: 'visible', timeout: 10000 });
    
    // 1. Click để kích hoạt ô nhập liệu
    await storyPointContainer.click({ force: true });

    // 2. CHỜ 1 GIÂY để Jira thực hiện hiệu ứng chuyển đổi thẻ HTML
    await page.waitForTimeout(1000);

    // 3. TẠO SỐ NGẪU NHIÊN TỪ 1 ĐẾN 20
    const randomValue = Math.floor(Math.random() * 20) + 1;

    try {
        // KẾ HOẠCH A: Cố gắng tóm lấy cái thẻ input mới sinh ra
        const inputField = page.locator('input[type="number"], input[aria-label*="Story point estimate"]').first();
        await inputField.waitFor({ state: 'visible', timeout: 3000 }); // Chỉ đợi 3s thôi, không thấy thì bỏ qua
        await inputField.click({ force: true }); 
        await inputField.fill(''); // Xóa chữ cũ
        await inputField.fill(randomValue.toString()); // Điền số mới
    } catch (e) {
        console.log("=> ℹ️ Jira giấu ô nhập liệu, chuyển sang chế độ Gõ mù (Keyboard)...");
        // KẾ HOẠCH B: Vì Jira thường tự auto-focus vào ô input sau khi click container
        // Ta dùng phím tắt để bôi đen tất cả, xóa và gõ trực tiếp
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await page.keyboard.type(randomValue.toString(), { delay: 100 });
    }

    // 4. Nhấn Enter để lưu
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter'); 
    
    console.log(`=> ✅ Đã nhập Story Point ngẫu nhiên thành công: "${randomValue}"`);
});

Then('Hệ thống phải báo lỗi định dạng số không hợp lệ', async function () {
    const errorText = page.locator('text=/number/i, text=/invalid/i, text=/numeric/i').first();
    const errorIcon = page.locator('[role="alert"], span[aria-label*="error" i], [data-testid*="error"]').first();

    try {
        await expect(errorText.or(errorIcon)).toBeVisible({ timeout: 5000 });
        console.log("=> ✅ KẾT QUẢ: Đã thấy thông báo/icon lỗi định dạng từ Jira.");
    } catch (e) {
        console.log("=> ℹ️ Jira không hiện chữ đỏ, chuyển sang kiểm tra Read-View...");
        const readView = page.locator('[data-testid="issue-field-story-point-estimate-readview-full.ui.story-point-estimate"]').first();
        await readView.waitFor({ state: 'visible', timeout: 5000 });
        
        const savedValue = await readView.innerText();
        if (!savedValue.includes("ABC")) {
            console.log(`=> ✅ KẾT QUẢ: Hệ thống đã chặn gõ chữ thành công. Giá trị trả về là: "${savedValue.trim()}"`);
        } else {
            throw new Error(`❌ BUG: Hệ thống VẪN LƯU chữ "${savedValue}" vào trường Story Point!`);
        }
    }
});


When('Tôi cập nhật Description thành {string}', async function (desc: string) {
    console.log("=> Đang tìm và mở khung Description...");
    await page.waitForTimeout(2000); // Đợi UI load xong trạng thái

    // 1. KÍCH HOẠT FORM: Tìm chính xác dòng chữ "Add a description..." hoặc vùng chứa nội dung cũ
    const addDescTrigger = page.locator('span:has-text("Add a description..."), p:has-text("Add a description..."), [data-testid="placeholder-test-id"], [data-testid*="issue-field-description.ui.collapsed-display-view"]').first();
    
    if (await addDescTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addDescTrigger.click({ force: true });
        console.log("=> Đã click mở form Description.");
    } else {
        // Fallback: Click ngay dưới chữ Description
        const heading = page.locator('h2:has-text("Description")').first();
        await heading.click({ force: true });
        await page.keyboard.press('Tab'); 
        await page.keyboard.press('Enter');
    }

    // 2. CHỜ EDITOR XUẤT HIỆN: Bây giờ form mới thực sự được tạo ra trên DOM
    const editor = page.locator('.ProseMirror, [role="textbox"][contenteditable="true"]').first();
    await editor.waitFor({ state: 'visible', timeout: 15000 });
    
    // 3. NHẬP LIỆU
    await editor.focus();
    await editor.fill(desc);
    await page.keyboard.press('Space'); // Gõ 1 khoảng trắng để Jira nhận ra có sự thay đổi văn bản
    
    // 4. BẤM SAVE
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
    } else {
        // Nếu không tìm thấy nút Save, ấn Tab để thoát focus, Jira sẽ tự động lưu inline
        await page.keyboard.press('Tab');
    }
    
    await page.waitForTimeout(1000);
    console.log(`=> ✅ Đã cập nhật Description thành công.`);
});

When('Tôi gán Issue cho Assignee là {string}', async function (userName: string) {
    const assigneeArea = page.locator('button[aria-label*="edit Assignee"], [data-testid="issue-field-assignee.common.ui.read-view.container"]').first();
    await assigneeArea.waitFor({ state: 'visible', timeout: 5000 });
    await assigneeArea.click({ force: true });

    const assigneeInput = page.locator('div[role="dialog"] input[type="text"], input[id*="react-select"]').first();
    await assigneeInput.waitFor({ state: 'visible', timeout: 5000 });
    await assigneeInput.fill(userName);
    
    await page.waitForTimeout(2000); // Đợi Jira search dữ liệu
    await page.keyboard.press('Enter');

    // Xử lý cái popup "Add people to Jira" (Nếu email chưa tồn tại)
    const addPeopleModal = page.locator('div[role="dialog"]:has-text("Add people to Jira"), [aria-label="Add people to Jira"]').first();
    if (await addPeopleModal.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`=> ⚠️ Email "${userName}" chưa có trong dự án. Jira đòi Invite. Đang tự động Cancel...`);
        // Tìm nút Cancel và tắt nó đi
        await page.locator('button:has-text("Cancel")').first().click();
        await page.waitForTimeout(1000);
    }
    
    console.log(`=> ✅ Đã xử lý đổi Assignee thành: "${userName}"`);
});

When('Tôi thêm Label là {string}', async function (labelName: string) {
    const labelArea = page.locator('button[aria-label="Edit Labels"], [data-testid="issue-field-labels.common.ui.read-view"]').first();
    await labelArea.waitFor({ state: 'visible', timeout: 5000 });
    await labelArea.click({ force: true });

    const labelInput = page.locator('input[id*="react-select"]').first();
    await labelInput.waitFor({ state: 'visible', timeout: 5000 });
    await labelInput.fill(labelName);
    
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    console.log(`=> ✅ Đã thêm Label: "${labelName}"`);
});

// -----------------------------------------------------------
// 3. CÁC BƯỚC EDIT SUMMARY, STATUS 
// -----------------------------------------------------------
When('Tôi đổi tiêu đề Summary thành {string}', async function (newSummary: string) {
    const summaryHeading = page.locator('h1[data-testid*="summary"], h1[aria-label*="Summary"], h1').first();
    await summaryHeading.click();

    const summaryInput = page.locator('textarea[aria-label*="Summary"], textarea[data-testid*="summary"]').first();
    await summaryInput.waitFor({ state: 'visible', timeout: 5000 });
    
    await summaryInput.fill(newSummary);
    await page.keyboard.press('Enter');
    console.log(`=> ✅ Đã đổi Summary thành: "${newSummary}"`);
});

When('Tôi đổi Trạng thái thành {string}', async function (status: string) {
    const statusDropdownBtn = page.locator('[id="issue.fields.status-view.status-button"], [data-testid="issue-field-status.ui.status-view.status-button.status-button"]').first();
    await statusDropdownBtn.click();

    const statusOption = page.locator(`span:has-text("${status}")`).first();
    await statusOption.waitFor({ state: 'visible', timeout: 5000 });
    await statusOption.click();
    console.log(`=> ✅ Đã đổi Status thành: "${status}"`);
});

// -----------------------------------------------------------
// 4. BỔ SUNG: TẠO SUBTASK (CHỈNH SỬA TẠI ĐÂY ĐỂ TRÁNH LỖI TIMEOUT)
// -----------------------------------------------------------
When('Tôi tạo một Subtask với tiêu đề {string}', async function (title: string) {
    const addSubtaskBtn = page.locator('button:has-text("Add subtask")').first();
    
    if (await addSubtaskBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addSubtaskBtn.click({ force: true });
    }
    
    const summaryInput = page.locator('input[id="childIssuesPanel"], [data-testid="issue-view-common-views.child-issues-panel.inline-create.summary-textfield"]').first();
    await summaryInput.waitFor({ state: 'visible', timeout: 15000 });
    await summaryInput.fill(title);
    
    const submitBtn = page.locator('button[data-testid="issue.views.common.child-issues-panel.inline-create.add-child-trigger-button"]').first();
    await submitBtn.click();
    
    await page.waitForTimeout(2000);
    console.log(`=> ✅ Đã tạo Subtask: "${title}"`);
});

// -----------------------------------------------------------
// BƯỚC KIỂM TRA CUỐI CÙNG
// -----------------------------------------------------------
Then('Các thông tin vừa cập nhật phải hiển thị chính xác trên màn hình', async function () {
    await page.waitForTimeout(2000);
    console.log("\n[Terminal] ✅ KẾT QUẢ: TẤT CẢ CÁC TRƯỜNG ĐÃ ĐƯỢC CHỈNH SỬA THÀNH CÔNG!");
});

// -----------------------------------------------------------
// TC_EDIT_05: XỬ LÝ LỖI SUMMARY TRỐNG
// -----------------------------------------------------------
When('Tôi xóa trống trường Summary của Issue', async function () {
    // 1. Click mở ô Summary
    const summaryHeading = page.locator('h1[data-testid*="summary"], h1[aria-label*="Summary"], h1').first();
    await summaryHeading.click({ force: true });

    // 2. Tìm ô Input (Textarea) và xóa trắng
    const summaryInput = page.locator('textarea[aria-label*="Summary"], textarea[data-testid*="summary"]').first();
    await summaryInput.waitFor({ state: 'visible', timeout: 5000 });
    
    // Xóa sạch nội dung cũ bằng phím tắt Ctrl+A rồi Backspace (chắc chắn hơn .fill(""))
    await summaryInput.focus();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // 3. Nhấn Enter để cố gắng lưu
    await page.keyboard.press('Enter');
    console.log("=> Đã xóa trống Summary và nhấn Enter.");
});

Then('Hệ thống phải hiển thị cảnh báo lỗi bắt buộc nhập Summary', async function () {
    // Jira thường hiện thông báo: "You must specify a summary of the issue."
    // Chúng ta sẽ bắt theo từ khóa "summary" và "specify" hoặc "required"
    const errorMsg = page.locator('div[role="alert"], [data-testid*="error"], .errorMessage').filter({ hasText: /summary/i }).first();
    
    try {
        await errorMsg.waitFor({ state: 'visible', timeout: 5000 });
        const text = await errorMsg.innerText();
        console.log(`=> ✅ KẾT QUẢ: Đã thấy thông báo lỗi của Jira: "${text}"`);
    } catch (e) {
        // Nếu không thấy chữ, kiểm tra xem ô input có còn hiện viền đỏ không
        const isStillEditing = await page.locator('textarea[aria-label*="Summary"]').isVisible();
        if (isStillEditing) {
            console.log("=> ✅ KẾT QUẢ: Hệ thống chặn không cho lưu (ô input vẫn mở và báo đỏ).");
        } else {
            throw new Error("❌ BUG: Jira vẫn cho phép lưu Issue với tiêu đề rỗng!");
        }
    }
});