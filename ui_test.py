import asyncio
from playwright.async_api import async_playwright
import os

async def run_test(browser_type, device_config, name):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(**device_config)
        page = await context.new_page()
        
        # ローカルファイルを読み込み
        path = f"file://{os.getcwd()}/index.html"
        await page.goto(path)
        await page.wait_for_timeout(2000) # Leafletの描画待ち
        
        # 1. 初期表示キャプチャ
        await page.screenshot(path=f"screenshot_{name}_init.png")
        
        # 2. スポット詳細の表示テスト
        try:
            # 最初のスポットカードをクリック
            first_spot = page.locator(".group").first
            await first_spot.scroll_into_view_if_needed()
            await first_spot.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path=f"screenshot_{name}_detail.png")
        except Exception as e:
            print(f"Error in {name}: {e}")
            
        await browser.close()

async def main():
    pc_config = {"viewport": {"width": 1280, "height": 800}}
    mobile_config = {
        "viewport": {"width": 390, "height": 844},
        "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "is_mobile": True,
        "has_touch": True
    }
    
    print("Testing PC...")
    await run_test("chromium", pc_config, "pc")
    print("Testing Mobile...")
    await run_test("chromium", mobile_config, "mobile")

if __name__ == "__main__":
    asyncio.run(main())
