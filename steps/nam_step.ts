import { When, Then } from '@cucumber/cucumber';
import { page, sharedData } from './common_step'; 
import * as fs from 'fs';

// ==========================================
// 1. AUTO-HEALING ĐĂNG NHẬP (Chống lật lọng)
// ==========================================
When('Tôi truy cập vào trang chủ Jira', async function () {
    const baseUrl = process.env.JIRA_BASE_URL || 'https://our-testing.atlassian.net';
    await page.goto(`${baseUrl}/jira/your-work`, { waitUntil: 'domcontentloaded' });
    
    await page.waitForTimeout(5000); 

    // SIÊU CHIẾN THUẬT: TÌM BẰNG CHỨNG ĐĂNG NHẬP
    // Kiểm tra xem thanh Menu chính của Jira có load được không
    const isLoggedIn = await page.locator('nav[aria-label="Primary"], button:has-text("Create"), [data-testid="atlassian-navigation--primary-actions"]').first().isVisible({ timeout: 5000 }).catch(() => false);

    // Nếu không thấy Menu VÀ chưa ở trang login => Chắc chắn là dính "Trang ma"
    if (!isLoggedIn && !page.url().includes('login')) {
        console.log("\n=> ⚠️ Không tìm thấy Menu Jira! Cookies đã chết. Đang ép chuyển sang trang Login...");
        await page.goto('https://id.atlassian.com/login', { waitUntil: 'load' });
        await page.waitForTimeout(3000);
    }

    // KÍCH HOẠT AUTO-HEALING ĐĂNG NHẬP
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
        
        await page.waitForURL(/.*(jira|for-you|projects).*/, { timeout: 30000 }).catch(() => {});
        await page.goto(`${baseUrl}/jira/your-work`, { waitUntil: 'load' });
    } else {
        console.log("=> ✅ Cookies hợp lệ, trang chủ đã load ổn định.");
    }
});

// ==========================================
// 2. NHẤN NÚT TẠO SPACE / PROJECT
// ==========================================
When('Tôi nhấn nút dấu cộng tạo Space trên menu', async function () {
    await page.waitForTimeout(3000); 

    const topMenu = page.locator('button, span, div[role="button"]').filter({ hasText: /^(Projects|Spaces)$/i }).first();
    if (await topMenu.isVisible().catch(() => false)) {
        await topMenu.click(); 
    }
    await page.waitForTimeout(1500); 

    const createBtn = page.locator('button:has-text("Create space"), button:has-text("Create project"), span:has-text("Create project")').first();
    await createBtn.waitFor({ state: 'visible', timeout: 15000 });
    await createBtn.click({ force: true });
    
    console.log("=> Đã nhấn nút Tạo mới dự án/space thành công!");
});

// ==========================================
// 3. CHỌN TEMPLATE (Bắt buộc qua danh mục)
// ==========================================
When('Tôi chọn template {string}', async function (templateName: string) {
    await page.waitForTimeout(3000); 

    // 1. BẮT BUỘC CLICK VÀO DANH MỤC "Software development"
    console.log("[Terminal] Đang tìm và click danh mục 'Software development'...");
    
    // Dựa vào HTML bạn cung cấp: dùng thẻ span có data-item-title="true" cực kỳ chắc chắn
    const categoryBtn = page.locator('span[data-item-title="true"]:has-text("Software development"), button:has-text("Software development")').first();
    
    // Ép robot phải đợi và click bằng được danh mục này
    await categoryBtn.waitFor({ state: 'visible', timeout: 15000 });
    await categoryBtn.click({ force: true });
    console.log("[Terminal] 📂 Đã chọn danh mục: Software development");
    
    // Đợi 2 giây để Jira load lại danh sách các thẻ template bên phải
    await page.waitForTimeout(2000);

    // 2. TÌM VÀ CLICK VÀO THẺ TEMPLATE 
    console.log(`[Terminal] Đang tìm thẻ Template: ${templateName}...`);
    
    // Dựa vào HTML bạn cung cấp: Tên template nằm trong thẻ h3 > span
    const templateTargets = page.locator('h3, span').filter({ hasText: new RegExp(`^${templateName}$`, 'i') });

    try {
        await templateTargets.first().waitFor({ state: 'visible', timeout: 15000 });
        await templateTargets.first().scrollIntoViewIfNeeded().catch(() => {});
        await templateTargets.first().click({ force: true });
        console.log(`[Terminal] 🃏 Đã nhấn chọn thẻ Template: ${templateName}`);
    } catch (e) {
        // Cứu cánh cuối cùng
        console.log(`=> ⚠️ Đang thử click mù vào chữ ${templateName}...`);
        await page.locator(`text="${templateName}"`).last().click({ force: true });
    }

    // 3. Đợi side-pane mở ra và click nút Use Template
    await page.waitForTimeout(1500); 
    const useBtn = page.locator('button:has-text("Use template"), [data-testid*="use-template"]').first();
    await useBtn.waitFor({ state: 'visible', timeout: 15000 });
    await useBtn.click({ force: true });
});

// ==========================================
// 4. ĐIỀN THÔNG TIN TÊN & KEY DỰ ÁN
// ==========================================
When('Tôi điền thông tin dự án Team-managed với tên ngẫu nhiên', async function () {
    const randomNum = Math.floor(Math.random() * 100000);
    const projectName = `test${randomNum}`;
    sharedData.projectKey = projectName.toUpperCase(); 

    const nameInputSelectors = [
        'input[id*="project-create.create-form.name-field"]', 
        'input[name="project-name"]',
        'input[id*="name"]',
        'input[placeholder*="team name"]'
    ].join(', ');

    const nameInput = page.locator(nameInputSelectors).first();
    await nameInput.waitFor({ state: 'visible', timeout: 20000 });
    await nameInput.fill(projectName);
    await nameInput.press('Tab');

    try {
        const managedDropdown = page.locator('[class*="team-type-select__control"], input[id^="project-management-type-"]').first();
        await managedDropdown.click({ timeout: 5000 });
        await page.waitForTimeout(500);
        await page.locator('div[role="option"], div[role="menuitem"]').filter({ hasText: 'Team-managed' }).first().click();
    } catch (e) { }

    try {
        const accessDropdown = page.locator('label:has-text("Access")').locator('..').locator('div[role="combobox"]').first();
        await accessDropdown.click({ timeout: 5000 });
        await page.waitForTimeout(500);
        await page.locator('div[role="option"], div[role="menuitem"]').filter({ hasText: 'Open' }).first().click();
    } catch (e) { }

    const keyInput = page.locator('input[id*="key-field"], input[name*="key-field"]').first();
    await page.waitForTimeout(2000); 
    await keyInput.click({ clickCount: 3 }); 
    await page.keyboard.press('Backspace');
    await keyInput.fill(projectName); 
    
    fs.writeFileSync('project_key.json', JSON.stringify({ projectKey: sharedData.projectKey }));
    console.log(`=> Đã điền xong Bước 1. Name & Key: ${projectName}`);
});

When('Tôi nhấn nút Next để sang bước 2', async function () {
    const nextBtn = page.locator('button:has-text("Next")').first();
    await nextBtn.click();
});

When('Tôi thiết lập Role là {string} và hoàn tất', async function (roleName: string) {
    await page.waitForSelector('text="Bring your team along"', { timeout: 15000 });

    const laterBtn = page.locator('[data-testid="create-form-wizard.ui.common.ui.form-footer.skip-button"]')
                         .or(page.getByRole('button', { name: "I'll do this later" }))
                         .first();
    
    await laterBtn.waitFor({ state: 'visible', timeout: 5000 });
    await laterBtn.click();

    console.log("=> Đã click thành công nút 'I'll do this later' (Bỏ qua thiết lập team)!");
});

Then('Hệ thống chuyển hướng vào trang chi tiết của Space mới', async function () {
    await page.waitForURL(/.*(\/projects\/|\/spaces\/|browse)/, { timeout: 30000 });
    console.log(`=> OK: Đã tạo thành công dự án với Key: ${sharedData.projectKey}`);
});

// ==========================================
// 5. CÁC BƯỚC CHO TEST CASE FAIL (TC04 & TC05)
// ==========================================
When('Tôi để trống ô Name, Manage, Key', async function () {
    const nameInputSelectors = 'input[id*="project-create.create-form.name-field"], input[name="project-name"], input[id*="name"], input[placeholder*="team name"]';
    const nameInput = page.locator(nameInputSelectors).first();
    await nameInput.waitFor({ state: 'visible', timeout: 20000 });
    
    await nameInput.click();
    await nameInput.fill('');
    await nameInput.press('Tab');
    console.log("[Terminal] ⚠️ Đã để trống ô Name, Manage, Key.");

    const nextBtn = page.locator('button:has-text("Next"), [data-testid="create-form-wizard.ui.common.ui.form-footer.submit-button"]').first();
    await nextBtn.click({ force: true });
});

Then('Hệ thống phải hiển thị lỗi yêu cầu nhập Name, Manage, Key', async function () {
    const nameError = page.getByText(/Your new project needs a name/i).first();
    await nameError.waitFor({ state: 'visible', timeout: 10000 });

    const manageError = page.getByText(/You must select how your space is managed/i).first();
    await manageError.waitFor({ state: 'visible', timeout: 10000 });

    const keyError = page.getByText(/Your space must have a key/i).first();
    await keyError.waitFor({ state: 'visible', timeout: 10000 });

    console.log("\n[Terminal] ✅ KẾT QUẢ: Kịch bản Fail (TC04) chạy ĐÚNG - Đã bắt đủ 3 lỗi (Name, Manage, Key)!");
});

When('Tôi nhập tên dự án là {string} và Key là {string}', async function (name: string, invalidKey: string) {
    const nameInputSelectors = 'input[id*="project-create.create-form.name-field"], input[name="project-name"], input[id*="name"]';
    const nameInput = page.locator(nameInputSelectors).first();
    await nameInput.waitFor({ state: 'visible', timeout: 20000 });
    await nameInput.fill(name);
    await nameInput.press('Tab');

    await page.waitForTimeout(2000); 

    const keyInput = page.locator('input[id*="key-field"], input[name*="key-field"]').first();
    await keyInput.click({ clickCount: 3 }); 
    await page.keyboard.press('Backspace');
    await keyInput.fill(invalidKey);
    await keyInput.press('Tab');
    console.log(`[Terminal] ⚠️ Đã nhập Key sai định dạng: ${invalidKey}`);

    const nextBtn = page.locator('button:has-text("Next"), [data-testid="create-form-wizard.ui.common.ui.form-footer.submit-button"]').first();
    await nextBtn.click({ force: true });
});

Then('Hệ thống phải hiển thị lỗi Key không hợp lệ', async function () {
    const errorMsg = page.getByText(/Project keys must start with an uppercase letter/i).first();
    await errorMsg.waitFor({ state: 'visible', timeout: 10000 });
    console.log("\n[Terminal] ✅ KẾT QUẢ: Kịch bản Fail (TC05) chạy ĐÚNG - Đã chặn Key sai định dạng!");
});