import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

ARTIFACTS_DIR = Path(r"C:\Users\abhin\.gemini\antigravity\brain\1a32b785-9928-4f7a-beb6-b8079d78323d\screenshots")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, channel="msedge")
        
        # 1. Desktop Viewport (1512x1000)
        page = await browser.new_page(viewport={'width': 1512, 'height': 1000})
        await page.goto('http://localhost:5173', wait_until='networkidle')
        await asyncio.sleep(1.5)
        
        # Hero section & stat cards
        hero = page.locator('#hero')
        await hero.screenshot(path=str(ARTIFACTS_DIR / "desktop_01_hero_stats_clean.png"))
        
        # Results & Ablation section
        results = page.locator('#results')
        await results.scroll_into_view_if_needed()
        await asyncio.sleep(1.0)
        await results.screenshot(path=str(ARTIFACTS_DIR / "desktop_02_results_stats_clean.png"))

        # Research Journey section
        journey = page.locator('#journey')
        await journey.scroll_into_view_if_needed()
        await asyncio.sleep(1.0)
        await journey.screenshot(path=str(ARTIFACTS_DIR / "desktop_03_journey_clean.png"))

        # Demo section
        demo = page.locator('#demo')
        await demo.scroll_into_view_if_needed()
        await asyncio.sleep(1.0)
        await demo.screenshot(path=str(ARTIFACTS_DIR / "desktop_04_demo_clean.png"))

        # 2. Tablet Viewport (768x1024)
        page_tablet = await browser.new_page(viewport={'width': 768, 'height': 1024})
        await page_tablet.goto('http://localhost:5173', wait_until='networkidle')
        await asyncio.sleep(1.0)
        await page_tablet.locator('#hero').screenshot(path=str(ARTIFACTS_DIR / "tablet_01_hero_stats_clean.png"))
        await page_tablet.locator('#results').scroll_into_view_if_needed()
        await asyncio.sleep(1.0)
        await page_tablet.locator('#results').screenshot(path=str(ARTIFACTS_DIR / "tablet_02_results_stats_clean.png"))

        # 3. Mobile Viewport (390x844)
        page_mobile = await browser.new_page(viewport={'width': 390, 'height': 844})
        await page_mobile.goto('http://localhost:5173', wait_until='networkidle')
        await asyncio.sleep(1.0)
        await page_mobile.locator('#hero').screenshot(path=str(ARTIFACTS_DIR / "mobile_01_hero_stats_clean.png"))
        await page_mobile.locator('#results').scroll_into_view_if_needed()
        await asyncio.sleep(1.0)
        await page_mobile.locator('#results').screenshot(path=str(ARTIFACTS_DIR / "mobile_02_results_stats_clean.png"))

        await browser.close()
        print("[NeuroFusion] All verification screenshots captured successfully.")

if __name__ == "__main__":
    asyncio.run(capture())
