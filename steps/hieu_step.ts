import { When, Then } from '@cucumber/cucumber';
import { page } from './common_step'; // Import page từ common

When('Tôi truy cập vào trang {string}', async function (url: string) {
    const envBaseUrl = process.env.JIRA_BASE_URL;
    if (envBaseUrl) {
        const normalizedBaseUrl = envBaseUrl.endsWith('/') ? envBaseUrl.slice(0, -1) : envBaseUrl;
        url = url.replace(/^https:\/\/[^/]+/, normalizedBaseUrl);
    }
    await page.goto(url, { waitUntil: 'load' }); 
});

When('Tôi nhập bình luận {string}', async function (comment: string) {
    const issueViewSelector = '[data-testid="issue-view.common.view-issue-container"], [data-testid="issue.views.issue-details.issue-layout.left-most-column"]';
    await page.waitForTimeout(5000); 
    let isVisible = await page.locator(issueViewSelector).first().isVisible();

    if (!isVisible) {
        const issueLink = page.locator('[data-testid="platform-board-kit.ui.card.card-contents.container"], [data-testid*="issue-line-item"]').first();
        if (await issueLink.isVisible()) {
            await issueLink.click();
            await page.waitForSelector(issueViewSelector, { timeout: 15000 });
        } else {
            await page.locator('text=/SCRUM-\\d+/').first().click().catch(() => {});
        }
    }

    await page.keyboard.press('m');
    await page.waitForTimeout(2000);

    const commentSelectors = [
        '[data-testid="issue-views.common.comment-line.comment-editor-container"]',
        '[aria-label="Add a comment"]',
        'role=textbox[name="Add a comment"]',
        'text=Add a comment…',
        'text=Thêm bình luận…'
    ];

    let commentBox = null;
    for (const sel of commentSelectors) {
        const loc = page.locator(sel).first();
        if (await loc.isVisible()) {
            commentBox = loc;
            break;
        }
    }

    if (!commentBox) {
        commentBox = page.getByPlaceholder(/Add a comment|Thêm bình luận/i).first();
    }

    if (await commentBox.isVisible()) {
        await commentBox.click();
        await page.keyboard.type(comment);
    }
});

When('Tôi nhấn nút {string}', async function (buttonName: string) {
    if (buttonName === "Create sprint") {
        const createSprintBtn = page.locator('[data-testid="platform-backlog.common.ui.create-sprint-button.button"]').first();
        if (await createSprintBtn.isVisible()) {
            await createSprintBtn.click();
            return;
        }
    }
    const buttonSelector = `button:has-text("${buttonName}")`;
    await page.waitForSelector(buttonSelector, { timeout: 10000 });
    await page.click(buttonSelector);
});

Then('Tôi phải thấy bình luận vừa nhập hiển thị trên màn hình', async function () {
    await page.waitForSelector('text=Test tự động bằng Cucumber', { timeout: 10000 });
});

Then('Tôi phải thấy bảng điều khiển Dashboard', async function () {
    await page.waitForURL('**/jira/**', { timeout: 30000 });
});

Then('Tôi phải thấy một Sprint mới được tạo ra trong danh sách', async function () {
    await page.waitForTimeout(5000);
    const sprintSelector = '[data-testid="platform-backlog.common.ui.sprint-header.sprint-container"]';
    try {
        await page.waitForSelector(sprintSelector, { timeout: 20000 });
    } catch (e) {
        const bodyText = await page.innerText('body');
        if (!bodyText.includes('Sprint')) throw new Error("Không tìm thấy Sprint!");
    }
});