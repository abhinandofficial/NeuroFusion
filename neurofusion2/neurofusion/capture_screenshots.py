import os
import shutil
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.abspath("screenshots")
ARTIFACT_DIR = r"C:\Users\abhin\.gemini\antigravity\brain\1a32b785-9928-4f7a-beb6-b8079d78323d"
ARTIFACT_IMG_DIR = os.path.join(ARTIFACT_DIR, "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
os.makedirs(ARTIFACT_IMG_DIR, exist_ok=True)

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=EDGE_PATH,
            headless=True,
            args=["--use-gl=angle", "--use-angle=d3d11", "--enable-webgl"]
        )

        # ----------------- DESKTOP (1440x900) -----------------
        context = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1.5)
        page = context.new_page()

        print("Navigating to http://localhost:5173/ ...")
        page.goto("http://localhost:5173/", wait_until="networkidle")
        time.sleep(3) # Let 3D canvas and shaders initialize

        # 1. Desktop Hero with 3D Brain
        hero_path = os.path.join(SCREENSHOTS_DIR, "desktop_01_hero.png")
        page.screenshot(path=hero_path)
        print(f"Captured: {hero_path}")

        # 2. Scroll to Demo and select a Sample Patient
        demo_el = page.locator("#demo")
        demo_el.scroll_into_view_if_needed()
        time.sleep(1)

        # Click the CN sample patient button
        sample_btns = page.locator("button:has-text('041_S_0125')")
        if sample_btns.count() > 0:
            print("Clicking Sample Patient 041_S_0125...")
            sample_btns.first.click()
            time.sleep(3) # Wait for prediction and slices

        demo_3plane_path = os.path.join(SCREENSHOTS_DIR, "desktop_02_demo_3plane.png")
        page.screenshot(path=demo_3plane_path)
        print(f"Captured: {demo_3plane_path}")

        # 3. Switch MRI viewer to Quad View or 3D Brain
        quad_btn = page.locator("button:has-text('Quad View')")
        if quad_btn.count() > 0:
            print("Clicking Quad View...")
            quad_btn.first.click()
            time.sleep(2)
            quad_path = os.path.join(SCREENSHOTS_DIR, "desktop_03_demo_quad_3d.png")
            page.screenshot(path=quad_path)
            print(f"Captured: {quad_path}")

        brain_3d_btn = page.locator("button:has-text('3D Brain')")
        if brain_3d_btn.count() > 0:
            print("Clicking dedicated 3D Brain view...")
            brain_3d_btn.first.click()
            time.sleep(2)
            brain_3d_path = os.path.join(SCREENSHOTS_DIR, "desktop_03b_demo_dedicated_3d.png")
            page.screenshot(path=brain_3d_path)
            print(f"Captured: {brain_3d_path}")

        # 4. Results & Ablation Section
        results_el = page.locator("#results")
        results_el.scroll_into_view_if_needed()
        time.sleep(1.5)
        results_path = os.path.join(SCREENSHOTS_DIR, "desktop_04_results.png")
        page.screenshot(path=results_path)
        print(f"Captured: {results_path}")

        # 5. Architecture Section
        arch_el = page.locator("#architecture")
        arch_el.scroll_into_view_if_needed()
        time.sleep(1.5)
        arch_path = os.path.join(SCREENSHOTS_DIR, "desktop_05_architecture.png")
        page.screenshot(path=arch_path)
        print(f"Captured: {arch_path}")

        # 6. Journey & Clinical Sections
        journey_el = page.locator("#journey")
        journey_el.scroll_into_view_if_needed()
        time.sleep(1.5)
        journey_path = os.path.join(SCREENSHOTS_DIR, "desktop_06_journey.png")
        page.screenshot(path=journey_path)
        print(f"Captured: {journey_path}")

        context.close()

        # ----------------- MOBILE (390x844) -----------------
        mobile_context = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            device_scale_factor=2
        )
        mobile_page = mobile_context.new_page()
        mobile_page.goto("http://localhost:5173/", wait_until="networkidle")
        time.sleep(3)

        mobile_hero_path = os.path.join(SCREENSHOTS_DIR, "mobile_01_hero.png")
        mobile_page.screenshot(path=mobile_hero_path)
        print(f"Captured: {mobile_hero_path}")

        # Click sample patient on mobile
        sample_btns_mob = mobile_page.locator("button:has-text('041_S_0125')")
        if sample_btns_mob.count() > 0:
            sample_btns_mob.first.click()
            time.sleep(3)

        mobile_demo_el = mobile_page.locator("#demo")
        mobile_demo_el.scroll_into_view_if_needed()
        time.sleep(1.5)
        mobile_demo_path = os.path.join(SCREENSHOTS_DIR, "mobile_02_demo.png")
        mobile_page.screenshot(path=mobile_demo_path)
        print(f"Captured: {mobile_demo_path}")

        mobile_context.close()
        browser.close()

    # Copy all screenshots to artifact directory for markdown embedding
    for f in os.listdir(SCREENSHOTS_DIR):
        if f.endswith(".png"):
            src = os.path.join(SCREENSHOTS_DIR, f)
            dst = os.path.join(ARTIFACT_IMG_DIR, f)
            shutil.copy2(src, dst)
            print(f"Copied to artifact dir: {dst}")

if __name__ == "__main__":
    run()
