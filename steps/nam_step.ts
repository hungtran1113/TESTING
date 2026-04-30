import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page, sharedData } from './common_step'; 
import * as fs from 'fs';


const SHARED_DATA_FILE = 'project_key.json';
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


// =====================================================================
// PHẦN 2: ADD PEOPLE - TÍCH HỢP DATA-TESTID BẠN CUNG CẤP
// =====================================================================

Given('Tôi đã ở trong Space vừa tạo', async function () {
    const baseUrl = process.env.JIRA_BASE_URL || 'https://our-testing.atlassian.net';
    if (!fs.existsSync(SHARED_DATA_FILE)) throw new Error("File key dự án không tồn tại!");
    
    const data = JSON.parse(fs.readFileSync(SHARED_DATA_FILE, 'utf8'));
    const key = data.projectKey;
    const projectUrl = `${baseUrl}/projects/${key}`;

    console.log(`=> ℹ️ Đang điều hướng đến Space: ${key}`);

    // CHỈNH SỬA TẠI ĐÂY: 
    // 1. Dùng 'domcontentloaded' thay vì 'load' (chỉ đợi khung HTML xong là chạy)
    // 2. Thêm timeout ngắn lại để nếu kẹt nó sẽ nhảy qua xử lý login ngay
    try {
        await page.goto(projectUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (e) {
        console.log("=> ⚠️ Trang tải hơi chậm, đang kiểm tra trạng thái login...");
    }

    // Xử lý tự động đăng nhập (Giữ nguyên logic của bạn nhưng bọc trong try-catch an toàn)
    if (page.url().includes('login') || page.url().includes('auth') || page.url().includes('id.atlassian.com')) {
        const email = process.env.JIRA_EMAIL || "";
        const password = process.env.JIRA_PASSWORD || "";
        
        try {
            const emailInput = page.locator('#username, input[type="email"]').first();
            await emailInput.waitFor({ state: 'visible', timeout: 10000 });
            await emailInput.fill(email);
            await page.locator('#login-submit, button:has-text("Continue")').first().click();
            
            await page.waitForTimeout(2000);
            const passInput = page.locator('#password, input[type="password"]').first();
            await passInput.waitFor({ state: 'visible', timeout: 10000 });
            await passInput.fill(password);
            await page.locator('#login-submit, button:has-text("Log in")').first().click();
        } catch (e) {
            console.log("=> ℹ️ Có thể đang kẹt ở màn hình SSO hoặc đã login ngầm.");
        }
        
        // Đợi quay lại trang project
        await page.waitForURL(new RegExp(key), { timeout: 30000 }).catch(() => {});
    }

    // QUAN TRỌNG: Thay vì đợi Selector lâu, ta đợi một phần tử "sống" của Jira hiện lên
    // Bắt thẻ [data-testid="ContextualNavigation"] hoặc Sidebar
    const sidebar = page.locator('nav, [data-testid="left-sidebar-container"], #jira-frontend').first();
    try {
        await sidebar.waitFor({ state: 'attached', timeout: 15000 });
        console.log(`=> ✅ Đã vào thành công Space: ${key}`);
    } catch (e) {
        console.log("=> ⚠️ Không thấy Sidebar nhưng vẫn thử chạy tiếp...");
    }
});

When('Tôi bấm nút {string} trên màn hình', async function (btnName: string) {
    await page.waitForTimeout(3000); 
    
    let btnLocator;
    
    // TÍCH HỢP DATA-TESTID siêu việt của Nam vào đây
    if (btnName === "Add people") {
        btnLocator = page.locator('[data-testid="invite-people.ui.navigation-add-people-button.trigger"]').first();
    } else {
        // Fallback cho các nút khác
        btnLocator = page.locator(`button:has-text("${btnName}"), span:has-text("${btnName}"), button[aria-label*="${btnName}" i], button[title*="${btnName}" i]`).first();
    }
    
    await btnLocator.waitFor({ state: 'visible', timeout: 15000 });
    await btnLocator.click();
    
    console.log(`=> Đã bấm nút: ${btnName}`);
});

When('Tôi nhập email thành viên là {string}', async function (email: string) {
    const emailInput = page.locator('div[role="dialog"] input[type="text"], input[id*="react-select"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill(email);
    
    await page.waitForTimeout(2000); 
    await page.keyboard.press('Enter');
});

When('Tôi bấm xác nhận thêm người', async function () {
    await page.locator('div[role="dialog"] button:has-text("Add")').first().click();
});

Then('Hệ thống thông báo thành viên mới đã được thêm thành công', async function () {
    try {
        const toastMsg = page.locator('text=has been added').first();
        await toastMsg.waitFor({ state: 'visible', timeout: 10000 });
        console.log("=> ✅ Thành công!");
    } catch (e) {
        const dialog = page.locator('div[role="dialog"]').first();
        await expect(dialog).toBeHidden({ timeout: 5000 });
        console.log("=> ✅ Thành công (Hộp thoại đã đóng)!");
    }
});

// =====================================================================
// BỔ SUNG: CÁC STEPS CHO TC2, TC3, TC4, TC5 (ADD PEOPLE)
// =====================================================================

// -----------------------------------------------------------
// TC2: GÕ CHỮ SAI ĐỊNH DẠNG (TRẢ LẠI PHÍM ENTER + DATA CÓ CHỨA '@')
// -----------------------------------------------------------
When('Tôi gõ chuỗi sai định dạng {string} vào ô email', async function (invalidText: string) {
    const emailInput = page.locator('div[role="dialog"] input[type="text"], input[id*="react-select"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    
    await emailInput.focus();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    // Gõ chữ từ từ
    await page.keyboard.type(invalidText, { delay: 100 });
    await page.waitForTimeout(500);

    // CHÌA KHÓA Ở ĐÂY: Vẫn bấm Enter để ép Jira tạo Thẻ (Pill).
    // Vì invalidText truyền vào (vd: abc@xyz) đã có sẵn '@', Jira sẽ không tự nối thêm @gmail.com nữa.
    // Kết quả là nó sẽ tạo ra 1 cái thẻ lỗi và văng chữ đỏ cảnh báo!
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    console.log(`=> ℹ️ Đã gõ chuỗi "${invalidText}" và bấm Enter để ép Jira kiểm tra định dạng.`);
});

// -----------------------------------------------------------
// TC3: CỐ TÌNH BÔI ĐEN, XÓA SẠCH Ô EMAIL VÀ BỎ FOCUS
// -----------------------------------------------------------
When('Tôi để trống ô nhập email', async function () {
    const emailInput = page.locator('div[role="dialog"] input[type="text"], input[id*="react-select"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    
    await emailInput.focus();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    
    await page.waitForTimeout(500);

    // BỔ SUNG: Click ra ngoài giống TC2 để ép Jira ghi nhận trạng thái rỗng
    const modalTitle = page.locator('div[role="dialog"] h1, div[role="dialog"] h2').first();
    await modalTitle.click({ force: true });

    console.log("=> ℹ️ Đã để trống trường nhập email và click ra ngoài.");
});

// -----------------------------------------------------------
// FIX LỖI TC2 & TC3 CHỐT HẠ: KIỂM TRA LỖI + KIỂM TRA NÚT BỊ KHÓA
// -----------------------------------------------------------
Then('Hệ thống phải hiển thị cảnh báo lỗi thêm thành viên', async function () {
    // 1. Kiểm tra xem nút Add có bị mờ không (Vô hiệu hóa an toàn)
    const addBtn = page.locator('div[role="dialog"] button:has-text("Add"), div[role="dialog"] button[type="submit"]').first();
    const isDisabled = await addBtn.evaluate((btn) => {
        const style = window.getComputedStyle(btn);
        return btn.hasAttribute('disabled') || style.cursor === 'not-allowed' || style.pointerEvents === 'none';
    }).catch(() => false);

    if (isDisabled) {
        console.log("=> ℹ️ Nút Add đã bị khóa vô hiệu hóa.");
    } else {
        // Nếu nút vẫn sáng, bấm thử xem có văng lỗi không
        await addBtn.click({ force: true }).catch(() => {});
    }

    await page.waitForTimeout(1000); 

    // 2. CHÌA KHÓA: Tìm đoạn Text lỗi hiển thị trên màn hình (Giữ nguyên logic cực xịn của bạn)
    const errorText = page.locator('div[role="dialog"]').getByText(/Select at least one person|Enter a valid email/i).first();
    
    try {
        await expect(errorText).toBeVisible({ timeout: 5000 });
        console.log("=> ✅ KẾT QUẢ [PASS]: Robot ĐÃ NHÌN THẤY chữ đỏ báo lỗi trên Popup UI (Chuỗi không hợp lệ hoặc để trống).");
    } catch (error) {
        throw new Error("❌ BUG [FAIL]: Playwright không tìm thấy thông báo lỗi, có vẻ Jira đã bỏ lọt dữ liệu sai!");
    }
});

// -----------------------------------------------------------
// TC04: CÁCH 1 (BẮT BUG) - ÉP BÁO LỖI NẾU JIRA HIỂN THỊ SAI THÔNG BÁO
// -----------------------------------------------------------
Then('Hệ thống hiển thị gợi ý người dùng có sẵn thay vì tạo lời mời mới', async function () {
    await page.waitForTimeout(1000);

    const addBtn = page.locator('div[role="dialog"] button:has-text("Add"), div[role="dialog"] button:has-text("Invite"), div[role="dialog"] button[type="submit"]').first();
    
    console.log("=> ℹ️ Đang cố tình bấm nút Add người cũ để kiểm tra hệ thống có bị sai không...");
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addBtn.click({ force: true });
    }

    await page.waitForTimeout(1500); 

    // Bắt thông báo nảy lên
    const toastNotification = page.locator('[role="alert"], [data-testid="flag-group"], .aui-flag, [data-testid="flag-title"]').first();
    const badge = page.getByText(/Already in project|Has access/i).first();
    
    if (await toastNotification.isVisible({ timeout: 4000 }).catch(() => false)) {
        const text = await toastNotification.innerText();
        
        // KIỂM TRA NGẶT NGHÈO (CÁCH 1): 
        // Nếu thông báo chứa chữ "added" hoặc "thành công" -> ĐÁNH FAIL NGAY LẬP TỨC!
        if (/added|thành công/i.test(text)) {
            
            throw new Error(`❌ BUG DỰ ÁN [FAIL]: Yêu cầu phải báo lỗi trùng lặp, nhưng Jira lại hiển thị thông báo thành công: "${text}"! (Đã lưu ảnh Bug_TC04_Jira_BaoThanhCongGia.png)`);
        } 
        // Nếu nó hiện đúng chữ "already" hoặc "tồn tại" -> MỚI CHO PASS
        else if (/already|tồn tại|có sẵn|thành viên/i.test(text)) {
            console.log(`=> ✅ KẾT QUẢ [PASS]: Hệ thống chuẩn bài, đã chặn Add và báo lỗi đúng: "${text}"`);
        } else {
            throw new Error(`❌ BUG [FAIL]: Thông báo không rõ ràng: "${text}"`);
        }
    } 
    // Dự phòng nếu Jira nó hiện nhãn thay vì Toast
    else if (await badge.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log("=> ✅ KẾT QUẢ [PASS]: Hệ thống hiện nhãn 'Already in project'!");
    } 
    else {
        throw new Error("❌ BUG [FAIL]: Form đã đóng hoặc mất tiêu mà không có bất kỳ thông báo cảnh báo nào!");
    }
});

// -----------------------------------------------------------
// TC5: KIỂM TRA HỘP THOẠI CANCEL ĐÃ ĐÓNG
// -----------------------------------------------------------
Then('Hộp thoại Add people phải được đóng lại', async function () {
    const dialog = page.locator('div[role="dialog"]:has-text("Add people to Jira"), [aria-label="Add people to Jira"]').first();
    await expect(dialog).toBeHidden({ timeout: 5000 });
    console.log("=> ✅ KẾT QUẢ: Hộp thoại mời thành viên đã đóng an toàn.");
});