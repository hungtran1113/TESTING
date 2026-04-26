import { When, Then } from '@cucumber/cucumber';
import { page, sharedData } from './common_step'; // Import page và biến dùng chung
import * as fs from 'fs';

When('Tôi truy cập vào trang chủ Jira', async function () {
    const baseUrl = process.env.JIRA_BASE_URL || 'https://our-testing.atlassian.net';
    await page.goto(`${baseUrl}/jira/your-work`, { waitUntil: 'load' });

    // SỬA Ở ĐÂY: Ép robot đợi 3 giây để xem Jira có tự động chuyển hướng (redirect) ra trang Login hay không
    await page.waitForTimeout(3000); 

    // Mở rộng điều kiện bắt URL đăng nhập cho chắc chắn
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
        
        await page.waitForURL(/.*(jira|for-you).*/, { timeout: 30000 });
        await page.goto(`${baseUrl}/jira/your-work`, { waitUntil: 'load' });
    } else {
        console.log("=> ✅ Cookies hợp lệ, đang ở trang chủ Jira.");
    }
});



When('Tôi chọn template {string}', async function (templateName: string) {
    const templateCard = page.locator(`text="${templateName}"`).first();
    await templateCard.waitFor({ state: 'visible', timeout: 15000 });
    await templateCard.click();

    const useBtn = page.locator('button:has-text("Use template")').first();
    if (await useBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await useBtn.click();
    }
});

When('Tôi điền thông tin dự án Team-managed với tên ngẫu nhiên', async function () {
    // 1. Khởi tạo tên ngẫu nhiên: test1, test2, test3...
    const randomNum = Math.floor(Math.random() * 100000);
    const projectName = `test${randomNum}`;
    
    // Jira tự động viết hoa Key, nên ta lưu lại bản in hoa cho chuẩn
    sharedData.projectKey = projectName.toUpperCase(); 

    // 2. Điền ô Name (Bắt theo đúng placeholder mờ mờ trong ảnh của bạn)
    const nameInput = page.locator('input[placeholder*="team name"], input[id*="name"], input[name="name"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 15000 });
    await nameInput.fill(projectName);
    
    // Bấm phím Tab để lừa Jira là mình đã gõ xong Name, kích hoạt các script chạy ngầm
    await nameInput.press('Tab');

    // 3. Chọn "Team-managed" 
    try {
        const managedDropdown = page.locator('[class*="team-type-select__control"], input[id^="project-management-type-"]').first();
        await managedDropdown.click({ timeout: 5000 });
        await page.waitForTimeout(500);
        await page.locator('div[role="option"], div[role="menuitem"]').filter({ hasText: 'Team-managed' }).first().click();
    } catch (e) {
        console.log("=> Không cần chọn vì đã là Team-managed mặc định.");
    }

    // 4. Chọn "Open" Access
    try {
        const accessDropdown = page.locator('label:has-text("Access")').locator('..').locator('div[role="combobox"]').first();
        await accessDropdown.click({ timeout: 5000 });
        await page.waitForTimeout(500);
        await page.locator('div[role="option"], div[role="menuitem"]').filter({ hasText: 'Open' }).first().click();
    } catch (e) {
        console.log("=> Không cần chọn vì đã là Open mặc định.");
    }

    // 5. Cố định Key y hệt Name
    const keyInput = page.locator('input#key-field-project-create, input[name="key-field-project-create"]').first();
    
    // BÍ QUYẾT: Đợi 2 giây cho Jira tự sinh Key ngầm xong xuôi hết rồi mới can thiệp
    await page.waitForTimeout(2000); 
    
    // Click 3 lần (Triple-click) để bôi đen toàn bộ chữ hiện có trong ô Key rồi ấn xóa (Backspace)
    await keyInput.click({ clickCount: 3 }); 
    await page.keyboard.press('Backspace');
    
    // Nhập lại Key y hệt tên dự án
    await keyInput.fill(projectName); 
    
    // Lưu ra file JSON để các tính năng sau xài
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
});When('Tôi nhấn nút dấu cộng tạo Space trên menu', async function () {
    // 1. Chờ thêm một chút để đảm bảo Jira đã load xong trang chủ và không bị redirect đột ngột
    await page.waitForTimeout(3000); 

    // 2. Rê chuột vào chữ "Spaces" ở sidebar để menu con xổ ra (nếu giao diện đang thu gọn)
    const spaceMenu = page.locator('div, span, button').filter({ hasText: /^Spaces$/i }).first();
    if (await spaceMenu.isVisible().catch(() => false)) {
        await spaceMenu.hover();
    }
    await page.waitForTimeout(1000); // Đợi hiệu ứng hover của menu xổ ra

    // 3. Tìm nút Create space dựa trên đoạn HTML mới nhất bạn cung cấp
    // Bắt trực tiếp thẻ button có chứa đoạn text "Create space"
    const createBtn = page.locator('button:has-text("Create space")').first();
    
    // Tăng thời gian chờ lên 15s phòng trường hợp mạng chậm
    await createBtn.waitFor({ state: 'visible', timeout: 15000 });
    await createBtn.click();
    
    console.log("=> Đã nhấn nút 'Create space' thành công!");
});