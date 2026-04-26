import { Given, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();

// Cho phép mỗi bước chạy tối đa 60 giây
setDefaultTimeout(60 * 1000);

// Export các biến này ra để các file của Hiệp, Hiếu, Nam có thể sử dụng (import)
export let browser: Browser;
export let context: BrowserContext;
export let page: Page;
export let sharedData = { projectKey: "" }; // Biến dùng chung để lưu mã Project Key

Before(async function () {
    browser = await chromium.launch({ headless: false }); // Mở trình duyệt để thấy kết quả
    
    let storageState: any = 'state.json';
    if (!fs.existsSync('state.json')) {
        console.warn("CẢNH BÁO: Không tìm thấy file state.json. Vui lòng chạy lệnh đăng nhập trước.");
    } else {
        const content = fs.readFileSync('state.json', 'utf-8');
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                const cleanedCookies = parsed.map((c: any) => {
                    const ss = c.sameSite ? c.sameSite.toLowerCase() : '';
                    if (ss === 'no_restriction') c.sameSite = 'None';
                    else if (ss === 'strict') c.sameSite = 'Strict';
                    else if (ss === 'lax') c.sameSite = 'Lax';
                    else c.sameSite = 'Lax';
                    return c;
                });
                const wrappedState = { cookies: cleanedCookies, origins: [] };
                fs.writeFileSync('state.json_wrapped.json', JSON.stringify(wrappedState, null, 2));
                storageState = 'state.json_wrapped.json';
            }
        } catch (e) {
            console.error("Lỗi đọc file state.json:", e);
        }
    }

    context = await browser.newContext({ storageState });
    page = await context.newPage();
});

Given('Tôi đã nạp Cookies vào trình duyệt', async function () {
    console.log("Đã nạp Cookies thành công.");
});

// Hàm tự động lấy URL cho Project mới nhất, dùng chung cho cả nhóm
export function getDynamicProjectUrl(subPath: string = "") {
    const baseUrl = process.env.JIRA_BASE_URL || 'https://our-testing.atlassian.net';
    let currentKey = "TP23810310"; 

    if (sharedData.projectKey !== "") {
        currentKey = sharedData.projectKey;
    } else if (fs.existsSync('project_key.json')) {
        const data = JSON.parse(fs.readFileSync('project_key.json', 'utf-8'));
        currentKey = data.projectKey;
    }

    if (subPath.startsWith("/browse/")) {
        return `${baseUrl}/browse/${currentKey}-1`;
    }
    return `${baseUrl}/jira/software/projects/${currentKey}${subPath}`;
}

After(async function () {
    console.log("\n⏳ Kịch bản hoàn tất! Đang giữ nguyên màn hình 30s để xem kết quả...");
    await page.waitForTimeout(30000); 
    if (browser) {
        await browser.close();
    }
});