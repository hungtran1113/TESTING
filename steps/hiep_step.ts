import { Given, When, Then } from '@cucumber/cucumber';
import { page, getDynamicProjectUrl } from './common_step'; // Import page và hàm lấy URL

Given('Tôi truy cập vào trang dự án Jira của nhóm', async function () {
    const targetUrl = getDynamicProjectUrl("/summary"); 
    await page.goto(targetUrl, { waitUntil: 'load' });
    
    // Đợi 3 giây để kiểm tra xem Jira có "lật lọng" đá văng ra trang Login không
    await page.waitForTimeout(3000); 

    if (page.url().includes('login') || page.url().includes('auth') || page.url().includes('id.atlassian.com')) {
        console.log("\n=> ⚠️ Jira từ chối Cookies. Robot đang tự động đăng nhập lại...");
        const email = process.env.JIRA_EMAIL || "";
        const password = process.env.JIRA_PASSWORD || "";
        
        const emailInput = page.locator('#username');
        if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await emailInput.fill(email);
            await page.locator('#login-submit').click();
        }
        const passInput = page.locator('#password');
        await passInput.waitFor({ state: 'visible', timeout: 15000 });
        await passInput.fill(password);
        await page.locator('#login-submit').click();
        
        // Đợi Jira xác thực xong
        await page.waitForURL(/.*(jira|for-you).*/, { timeout: 30000 });
        
        // Nhảy lại vào đúng URL của dự án
        await page.goto(targetUrl, { waitUntil: 'load' });
        console.log(`[Terminal] 🚀 Đã đăng nhập lại và truy cập dự án: ${targetUrl}`);
    } else {
        console.log(`[Terminal] 🚀 Cookies hợp lệ, truy cập dự án: ${targetUrl}`);
    }
});

When('Tôi nhấn nút Create trên thanh điều hướng', async function () {
    // 1. Dừng 2 giây để Jira load xong các script ngầm (rất quan trọng)
    await page.waitForTimeout(2000);

    // 2. Tìm nút Create
    const createBtn = page.locator('[data-testid="atlassian-navigation--create-button"], #createGlobalItem').first();
    await createBtn.waitFor({ state: 'visible', timeout: 15000 });

    // 3. Bấm lần 1
    await createBtn.click();
    console.log("=> Đã nhấn nút Create lần 1, đang đợi popup hiện ra...");

    try {
        // Đợi popup trong 8 giây
        await page.locator('[role="dialog"], [data-testid="issue-create.common.ui.modal.header"], h2:has-text("Create issue")')
                  .first()
                  .waitFor({ state: 'visible', timeout: 8000 });
    } catch (e) {
        // 4. Bấm bù lần 2 nếu lần 1 Jira bị lag không nhận lệnh
        console.log("=> ⚠️ Jira lag chưa hiện popup, tiến hành click bù lần 2...");
        await createBtn.click({ force: true });
        
        // Đợi thêm lần nữa cho chắc chắn
        await page.locator('[role="dialog"], [data-testid="issue-create.common.ui.modal.header"], h2:has-text("Create issue")')
                  .first()
                  .waitFor({ state: 'visible', timeout: 15000 });
    }
    
    console.log("=> ✅ Đã mở popup tạo Issue thành công!");
});

When('Tôi nhập Summary là {string}', async function (baseText: string) {
    const summaryInput = page.locator('input#summary-field, [data-testid="issue-create-commons.common.ui.fields.base-fields.input-field.textfield"]').first();
    await summaryInput.waitFor({ state: 'visible', timeout: 15000 });

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < 20; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const finalSummary = `${baseText} - ${randomString}`;
    await summaryInput.fill(finalSummary);
    console.log(`=> Đã nhập Summary: ${finalSummary}`);
});

When('Tôi để trống trường Summary', async function () {
    const summaryInput = page.locator('input#summary-field').first();
    await summaryInput.fill('');
});

When('Tôi nhấn nút xác nhận Create trên form', async function () {
    const submitBtn = page.locator('button[type="submit"], [data-testid="issue-create.common.ui.footer.create-button"]').last();
    await submitBtn.click();
});

Then('Hệ thống phải hiển thị thông báo tạo Issue thành công', async function () {
    // Sử dụng locator().waitFor() thay cho waitForSelector để không bị lỗi cú pháp
    const successMsg = page.locator('span:has-text("created issue"), div[role="alert"]').first();
    
    await successMsg.waitFor({ state: 'visible', timeout: 15000 });
    console.log("\n[Terminal] ✅ KẾT QUẢ: TẠO ISSUE THÀNH CÔNG!");
});

Then('Hệ thống phải hiển thị cảnh báo lỗi {string}', async function (errorMsg: string) {
    await page.waitForSelector(`text="${errorMsg}"`, { timeout: 5000 });
});

Given('Tôi đang xem chi tiết một Issue hiện có', async function () {
    const targetUrl = getDynamicProjectUrl("/browse/"); 
    await page.goto(targetUrl, { waitUntil: 'load' });
});

When('Tôi nhập {string} vào trường Story point estimate', async function (value: string) {
    const storyPointField = page.locator('input[aria-label*="Story point estimate"], [data-testid*="story-point"] input');
    const textClickArea = page.locator('[data-testid*="story-point"]');
    
    if (await textClickArea.isVisible()) {
        await textClickArea.click();
    }
    
    await storyPointField.fill(value);
    await page.keyboard.press('Enter');
});

Then('Hệ thống phải báo lỗi định dạng số không hợp lệ', async function () {
    await page.waitForSelector('text=Please enter a number, text=Invalid number', { timeout: 5000 });
});