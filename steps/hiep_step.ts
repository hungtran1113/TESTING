import { Given, When, Then } from '@cucumber/cucumber';
import { page, getDynamicProjectUrl } from './common_step';
import * as fs from 'fs';

// --- AUTO-HEALING ĐĂNG NHẬP (Giữ nguyên logic ổn định của bạn) ---
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

// --- CẢI TIẾN: HỖ TRỢ 2 LOẠI NÚT CREATE TRÊN THANH ĐIỀU HƯỚNG ---
When('Tôi nhấn nút Create trên thanh điều hướng', async function () {
    await page.waitForTimeout(2000);

    // Bao lưới 2 loại nút Create bạn cung cấp (Navbar button và Modal footer button phòng khi nó đã mở)
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

// --- CẢI TIẾN: HỖ TRỢ 2 CÁCH NHẬP INPUT SUMMARY ---
// Sử dụng chính xác data-testid bạn cung cấp
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

// --- CẢI TIẾN: HỖ TRỢ NÚT XÁC NHẬN CREATE TRÊN FORM ---
When('Tôi nhấn nút xác nhận Create trên form', async function () {
    // Dùng chính xác HTML data-testid bạn gửi: issue-create.common.ui.footer.create-button
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