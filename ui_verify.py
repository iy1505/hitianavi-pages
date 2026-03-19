import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        # システムのブラウザを自動で見つけるか、エラーならスキップ
        try:
            browser = await p.chromium.launch(headless=True)
        except:
            # もしブラウザがない場合はインストールを試みる（依存関係なしで）
            os.system("playwright install chromium")
            browser = await p.chromium.launch(headless=True)
            
        # PC検証
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page.goto(f"file://{os.getcwd()}/index.html")
        await page.wait_for_timeout(3000)
        await page.screenshot(path="verify_pc.png")
        print("PC Screenshot saved.")

        # スマホ検証 (iPhone 13)
        mobile_page = await browser.new_page(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            is_mobile=True,
            has_touch=True
        )
        await mobile_page.goto(f"file://{os.getcwd()}/index.html")
        await mobile_page.wait_for_timeout(3000)
        await mobile_page.screenshot(path="verify_mobile.png")
        print("Mobile Screenshot saved.")
        
        await browser.close()

asyncio.run(main())
