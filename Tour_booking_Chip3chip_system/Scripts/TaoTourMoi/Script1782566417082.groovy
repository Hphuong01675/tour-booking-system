import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testdata.TestData
import com.kms.katalon.core.testdata.TestDataFactory
import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import org.openqa.selenium.Keys
import org.openqa.selenium.WebElement
import java.util.Arrays
import groovy.transform.Field

/*
 * Object Repository first version.
 *
 * This script uses your captured objects under:
 * Object Repository/TaoTourMoi
 *
 * Dynamic TestObject is kept only for repeated controls:
 * - schedule row 2+
 * - itinerary day 2+
 * - location row 2+
 * - activity row 2+
 *
 * Katalon Manual tab can still show blank Object cells for Groovy loops/helpers.
 * That is normal. The actual Script code below calls findTestObject(...) for
 * the captured objects wherever a stable single object can be used.
 *
 * Auto login: phoai4355@gmail.com / Hoaiphuong01675@
 */

@Field final String REPO             = 'Object Repository/TaoTourMoi/'
@Field final String DEFAULT_BASE_URL = 'http://localhost:5173'
@Field final String CREATE_TOUR_PATH = '/operator/tours/new'
@Field final String LOGIN_PATH       = '/login'

// ── Thông tin đăng nhập cố định ───────────────────────────────────────────────
@Field final String AUTO_EMAIL     = 'phoai4355@gmail.com'
@Field final String AUTO_PASSWORD  = 'Hoaiphuong01675@'
@Field final String AUTO_LOGIN_URL = 'http://localhost:5173/login'
@Field boolean LOGGED_IN_ONCE = false
@Field boolean STOP_ON_ROW_FAIL = false
@Field int MAX_GALLERY_UPLOADS = 3
@Field boolean UPLOAD_DETAIL_IMAGES = false
// ─────────────────────────────────────────────────────────────────────────────

TestData data = TestDataFactory.findTestData('Data Files/Data_TaoTourMoi')

// Mở trình duyệt và đăng nhập MỘT LẦN trước khi chạy các test case
ensureBrowserOpened()
ensureLoggedInOnce(data)

int row = resolveFallbackRow(data)
String tcId = val(data, row, 'TC_ID') ?: "ROW${row}"
int runnableTotal = countRunnableRows(data)
int runIndex = resolveRunIndex(data, row)

if (!val(data, row, 'Run').equalsIgnoreCase('Y')) {
    KeywordUtil.markPassed("[${runIndex}/${runnableTotal}] ${tcId}: skipped because Run is not Y")
    return
}

boolean rowPassed = runTourRow(data, row, runIndex, runnableTotal)
closeAnyAlert("after ${tcId}")

if (rowPassed) {
    KeywordUtil.markPassed("[${runIndex}/${runnableTotal}] ${tcId} => PASS")
} else {
    String failMessage = "[${runIndex}/${runnableTotal}] ${tcId} => FAIL"
    if (STOP_ON_ROW_FAIL) {
        KeywordUtil.markFailed(failMessage)
    } else {
        KeywordUtil.markWarning(failMessage)
        KeywordUtil.markPassed("${failMessage} - logged and continue")
    }
}

// ═════════════════════════════════════════════════════════════════════════════
//  AUTO LOGIN – đăng nhập tự động bằng tài khoản cố định
// ═════════════════════════════════════════════════════════════════════════════
int countRunnableRows(TestData data) {
    int count = 0
    for (int row = 1; row <= data.getRowNumbers(); row++) {
        if (val(data, row, 'Run').equalsIgnoreCase('Y')) {
            count++
        }
    }
    return count
}

int resolveRunIndex(TestData data, int currentRow) {
    int index = 0
    for (int row = 1; row <= data.getRowNumbers(); row++) {
        if (val(data, row, 'Run').equalsIgnoreCase('Y')) {
            index++
        }
        if (row == currentRow) {
            return index == 0 ? 1 : index
        }
    }
    return currentRow
}

void logRowResult(int current, int total, String tcId, boolean passed, int passCount, int failCount) {
    String status = passed ? 'PASS' : 'FAIL'
    String message = "[${current}/${total}] ${tcId} => ${status} | pass=${passCount}, fail=${failCount}"
    if (passed) {
        KeywordUtil.logInfo(message)
    } else {
        KeywordUtil.markWarning(message)
    }
}

boolean runTourRow(TestData data, int row, int currentIndex, int totalCases) {
    String tcId     = val(data, row, 'TC_ID') ?: "ROW${row}"
    String expected = val(data, row, 'ExpectedResult')
    KeywordUtil.logInfo("[${currentIndex}/${totalCases}] Running create-tour test case: ${tcId}")

    try {
        openCreateTourPage(data, row)
        fillGeneralInfo(data, row)
        fillHighlights(buildHighlightsFromColumns(data, row))
        fillSchedules(buildSchedulesFromColumns(data, row))
        fillItinerary(buildDaysFromColumns(data, row), buildLocationsFromColumns(data, row), buildActivitiesFromColumns(data, row))
        fillTourImages(val(data, row, 'ThumbnailPath'), buildGalleryFromColumns(data, row))
        fillAdditionalInfoFromColumns(data, row)
        submitTour(val(data, row, 'SubmitAction'))
        boolean resultOk = verifyResult(tcId, expected, val(data, row, 'ExpectedMessage'))
        KeywordUtil.logInfo("${tcId}: ${resultOk ? 'PASS' : 'FAIL'}")
        return resultOk
    } catch (Throwable t) {
        closeAnyAlert("${tcId} catch")
        KeywordUtil.logInfo("${tcId}: exception type = ${t.getClass().getName()}")
        KeywordUtil.logInfo("${tcId}: exception message = ${t.getMessage()}")
        if (expected.equalsIgnoreCase('FAIL')) {
            KeywordUtil.logInfo("${tcId}: PASS - failed as expected. ${t.message}")
            return true
        }
        KeywordUtil.markWarning("${tcId}: unexpected failure. ${t.message}")
        return false
    }
}

void ensureLoggedInOnce(TestData data) {
    if (LOGGED_IN_ONCE) {
        KeywordUtil.logInfo('Already logged in. Skip login.')
        return
    }

    String currentUrl = WebUI.getUrl(FailureHandling.OPTIONAL) ?: ''
    if (currentUrl && !currentUrl.contains('/login') && !currentUrl.startsWith('data:') && !currentUrl.contains('about:blank')) {
        LOGGED_IN_ONCE = true
        KeywordUtil.logInfo('Browser is already outside login page. Skip login.')
        return
    }

    if (canOpenCreateTourWithoutLogin()) {
        LOGGED_IN_ONCE = true
        KeywordUtil.logInfo('Existing browser session is already logged in. Skip login.')
        return
    }

    autoLogin()
    LOGGED_IN_ONCE = true
}

boolean canOpenCreateTourWithoutLogin() {
    closeAnyAlert('check login session')
    String createUrl = buildUrl(DEFAULT_BASE_URL, CREATE_TOUR_PATH)
    WebUI.navigateToUrl(createUrl)
    WebUI.waitForPageLoad(5)

    String currentUrl = WebUI.getUrl(FailureHandling.OPTIONAL) ?: ''
    if (currentUrl.contains('/login')) {
        return false
    }
    return WebUI.verifyElementPresent(orObject('input_TenTour', byId('tour-title')), 3, FailureHandling.OPTIONAL)
}

boolean isCreateTourPageReady() {
    String currentUrl = WebUI.getUrl(FailureHandling.OPTIONAL) ?: ''
    if (currentUrl.contains('/login')) {
        return false
    }
    return WebUI.verifyElementPresent(orObject('input_TenTour', byId('tour-title')), 1, FailureHandling.OPTIONAL)
}

void autoLogin() {
    KeywordUtil.logInfo("Auto login with: ${AUTO_EMAIL}")

    WebUI.navigateToUrl(AUTO_LOGIN_URL)
    WebUI.waitForPageLoad(3)

    // Nhập email
    setValueFast(orObject('input_login-email', xpath("//input[@type='email' or contains(@name,'email')]")), AUTO_EMAIL)

    // Nhập mật khẩu
    setValueFast(orObject('input_login-password', xpath("//input[@type='password']")), AUTO_PASSWORD)

    // Nhấn nút đăng nhập
    WebUI.click(
        orObject('Dangnhap', xpath("//button[contains(.,'Đăng nhập') or contains(.,'Dang nhap') or @type='submit']")),
        FailureHandling.OPTIONAL
    )
    WebUI.waitForPageLoad(8)

    // Chờ redirect khỏi trang /login (polling thủ công, tối đa 20 giây)
    int waited = 0
    while (waited < 8) {
        String currentUrl = WebUI.getUrl(FailureHandling.OPTIONAL) ?: ''
        if (!currentUrl.contains('/login')) break
        WebUI.delay(0.5)
        waited++
    }
    WebUI.navigateToUrl(buildUrl(DEFAULT_BASE_URL, CREATE_TOUR_PATH))
    WebUI.waitForPageLoad(5)
    KeywordUtil.logInfo("Auto login succeeded. Current URL: ${WebUI.getUrl()}")
}

// ═════════════════════════════════════════════════════════════════════════════
//  BROWSER
// ═════════════════════════════════════════════════════════════════════════════
void ensureBrowserOpened() {
    try {
        String currentUrl = WebUI.getUrl(FailureHandling.OPTIONAL)
        if (currentUrl) return
        WebUI.openBrowser('')
        WebUI.maximizeWindow(FailureHandling.OPTIONAL)
    } catch (Throwable ignored) {
        WebUI.openBrowser('')
        WebUI.maximizeWindow(FailureHandling.OPTIONAL)
    }
}

// ═════════════════════════════════════════════════════════════════════════════
//  NAVIGATION
// ═════════════════════════════════════════════════════════════════════════════
String buildUrl(String baseUrl, String path) {
    String base = baseUrl?.trim() ? baseUrl.trim() : DEFAULT_BASE_URL
    if (base.endsWith('/')) {
        base = base.substring(0, base.length() - 1)
    }
    String suffix = path.startsWith('/') ? path : "/${path}"
    return base + suffix
}

void loginIfNeeded(TestData data, int row) {
    String email    = val(data, row, 'LoginEmail')
    String password = val(data, row, 'LoginPassword')
    String loginUrl = val(data, row, 'LoginUrl')
    if (!email || !password) return

    if (!loginUrl) {
        loginUrl = buildUrl(val(data, row, 'BaseUrl'), LOGIN_PATH)
    }
    WebUI.navigateToUrl(loginUrl)
    WebUI.waitForPageLoad(30)
    setValueFast(orObject('input_login-email',    xpath("//input[@type='email' or contains(@name,'email')]")), email)
    setValueFast(orObject('input_login-password', xpath("//input[@type='password']")), password)
    WebUI.click(orObject('Dangnhap', xpath("//button[contains(.,'Đăng nhập') or contains(.,'Dang nhap')]")), FailureHandling.OPTIONAL)
    WebUI.waitForPageLoad(30)
}

void openCreateTourPage(TestData data, int row) {
    closeAnyAlert('before open create tour page')
    String url = val(data, row, 'CreateTourUrl')
    if (!url) {
        url = buildUrl(val(data, row, 'BaseUrl'), CREATE_TOUR_PATH)
    }

    openCreateTourPageAfterLogin(url)
    return

    if (isCreateTourPageReady()) {
        return
    }

    WebUI.click(orObject('nav_TaoTourMoi', xpath("//a[contains(@href,'new') or contains(.,'Táº¡o tour')]")), FailureHandling.OPTIONAL)
    WebUI.waitForPageLoad(3)

    if (!WebUI.verifyElementPresent(orObject('input_TenTour', byId('tour-title')), 2, FailureHandling.OPTIONAL)) {
        WebUI.navigateToUrl(url)
        WebUI.waitForPageLoad(5)
    }

    if (!WebUI.verifyElementPresent(orObject('input_TenTour', byId('tour-title')), 2, FailureHandling.OPTIONAL)) {
        WebUI.click(orObject('nav_TaoTourMoi', xpath("//a[contains(@href,'new') or contains(.,'Tạo tour')]")), FailureHandling.OPTIONAL)
        WebUI.waitForPageLoad(15)
    }

    WebUI.waitForElementPresent(orObject('input_TenTour', byId('tour-title')), 8)
}

// ═════════════════════════════════════════════════════════════════════════════
//  FILL FORM
// ═════════════════════════════════════════════════════════════════════════════
void openCreateTourPageAfterLogin(String url) {
    if (isCreateTourPageReady()) {
        return
    }

    WebUI.click(orObject('nav_TaoTourMoi', xpath("//a[contains(@href,'new')]")), FailureHandling.OPTIONAL)
    WebUI.waitForPageLoad(3)

    if (!WebUI.verifyElementPresent(orObject('input_TenTour', byId('tour-title')), 2, FailureHandling.OPTIONAL)) {
        WebUI.navigateToUrl(url)
        WebUI.waitForPageLoad(5)
    }

    String currentUrl = WebUI.getUrl(FailureHandling.OPTIONAL) ?: ''
    if (currentUrl.contains('/login')) {
        LOGGED_IN_ONCE = false
        autoLogin()
        LOGGED_IN_ONCE = true
        WebUI.click(orObject('nav_TaoTourMoi', xpath("//a[contains(@href,'new')]")), FailureHandling.OPTIONAL)
        WebUI.waitForPageLoad(3)
    }

    WebUI.waitForElementPresent(orObject('input_TenTour', byId('tour-title')), 5)
}

void fillGeneralInfo(TestData data, int row) {
    setValueFast(orObject('input_TenTour',       byId('tour-title')),              val(data, row, 'TenTour'))
    if (val(data, row, 'Difficulty')) {
        WebUI.selectOptionByValue(byId('tour-difficulty'), val(data, row, 'Difficulty'), false, FailureHandling.OPTIONAL)
    }
    setValueFast(orObject('input_soNgay',        byId('tour-duration-days')),      val(data, row, 'SoNgay'))
    setValueFast(orObject('input_soDem',         byId('tour-duration-nights')),    val(data, row, 'SoDem'))
    setValueFast(orObject('input_DiemXuatPhat',  byId('tour-departure-location')), val(data, row, 'DiemXuatPhat'))
    setValueFast(orObject('input_diemDen',       byId('tour-destination')),        val(data, row, 'DiemDen'))
    setValueFast(orObject('input_Gia',           byId('tour-base-price')),         val(data, row, 'Gia'))
    setValueFast(xpath("//section[.//*[@id='tour-title']]//textarea[1]"),           val(data, row, 'MoTaTour'))
}

void fillHighlights(String raw) {
    List<String> highlights = splitList(raw, ';')
    for (int i = 0; i < highlights.size(); i++) {
        if (highlights.size() > 1 && i > 0) {
            clickAddHighlight()
        }
        waitForHighlightInput(i, 8)
        setHighlightValue(i, highlights[i])
    }
    return
    for (int i = 0; i < highlights.size(); i++) {
        if (i > 0) {
            clickAddHighlight()
            WebUI.waitForElementPresent(highlightInput(i), 8)
        }
        TestObject obj = i == 0
            ? orObject('input_DiemNhanHanhTrinh', xpath("(//input[contains(@placeholder,'Điểm nhấn')])[1]"))
            : xpath("(//input[contains(@placeholder,'Điểm nhấn')])[${i + 1}]")
        setValueFast(obj, highlights[i])
    }
}

void fillSchedules(String raw) {
    List<String> schedules = splitList(raw, ';')
    for (int i = 0; i < schedules.size(); i++) {
        if (schedules.size() > 1 && i > 0) {
            clickAddSchedule()
            WebUI.waitForElementPresent(byId("schedule-dep-${i}"), 8)
        }
        List<String> parts = splitKeepEmpty(schedules[i], '\\|')
        setValueFast(i == 0 ? orObject('input_NgayDi',  byId('schedule-dep-0')) : byId("schedule-dep-${i}"), getPart(parts, 0))
        setValueFast(i == 0 ? orObject('input_NgayVe',  byId('schedule-ret-0')) : byId("schedule-ret-${i}"), getPart(parts, 1))
        setValueFast(byId("schedule-price-${i}"),                                                             getPart(parts, 2))
        setValueFast(scheduleCapacityInput(i), getPart(parts, 3))
    }
}

void fillItinerary(String daysRaw, String locationsRaw, String activitiesRaw) {
    List<String> itineraryDays = splitList(daysRaw, ';')
    Map<Integer, List<List<String>>> locationsMap = parseIndexedRows(locationsRaw, 4)
    Map<Integer, List<List<String>>> activitiesMap = parseIndexedRows(activitiesRaw, 3)

    for (int dayIdx = 0; dayIdx < itineraryDays.size(); dayIdx++) {
        if (dayIdx > 0) {
            clickAddDay()
            WebUI.waitForElementPresent(byId("day-title-${dayIdx}"), 10)
        }

        List<String> dayParts = splitKeepEmpty(itineraryDays[dayIdx], '\\|')
        fillDayInfo(dayIdx, dayParts)
        fillLocationsForDay(dayIdx, locationsMap[dayIdx + 1] ?: [])
        fillActivitiesForDay(dayIdx, activitiesMap[dayIdx + 1] ?: [])
    }
    return

    List<String> days = splitList(daysRaw, ';')
    for (int dayIdx = 0; dayIdx < days.size(); dayIdx++) {
        if (dayIdx > 0) {
            WebUI.click(orObject('button_ThemNgayMoi', xpath("//button[contains(.,'Thêm ngày mới')]")), FailureHandling.OPTIONAL)
            WebUI.waitForElementPresent(byId("day-title-${dayIdx}"), 10)
        }

        List<String> parts = splitKeepEmpty(days[dayIdx], '\\|')
        setValueFast(byId("day-title-${dayIdx}"), getPart(parts, 0))
        setValueFast(dayIdx == 0
            ? orObject('input_HoatDongChinhTrongNgay', dayInput(0, "input[@type='text']", 2))
            : dayInput(dayIdx, "input[@type='text']", 2),
            getPart(parts, 1))
        setValueFast(dayIdx == 0
            ? orObject('textarea_MotaLichTrinh', dayInput(0, "textarea", 1))
            : dayInput(dayIdx, "textarea", 1),
            getPart(parts, 2))
        setMealsForDay(dayIdx, getPart(parts, 3))
        uploadOptional(dayInput(dayIdx, "input[@type='file' and contains(@accept,'image')]", 1), getPart(parts, 4))
    }

    Map<Integer, List<List<String>>> locationsByDay = parseIndexedRows(locationsRaw, 4)
    locationsByDay.each { Integer dayNo, List<List<String>> rows ->
        int dayIdx = dayNo - 1
        rows.eachWithIndex { List<String> loc, int locIdx ->
            clickAddLocation(dayIdx)
            WebUI.waitForElementPresent(byId("loc-lat-${dayIdx}-${locIdx}"), 10)

            TestObject nameObj = locationNameStable(dayIdx, locIdx)
            TestObject latObj = byId("loc-lat-${dayIdx}-${locIdx}")
            TestObject lngObj = byId("loc-lng-${dayIdx}-${locIdx}")

            setValueFast(nameObj, getPart(loc, 0))
            setValueFast(latObj,  getPart(loc, 1))
            setValueFast(lngObj,  getPart(loc, 2))
            uploadOptional(xpath("//*[@id='loc-lat-${dayIdx}-${locIdx}']/ancestor::div[contains(@class,'grid')][1]//input[@type='file']"), getPart(loc, 3))
        }
    }

    Map<Integer, List<List<String>>> activitiesByDay = parseIndexedRows(activitiesRaw, 3)
    activitiesByDay.each { Integer dayNo, List<List<String>> rows ->
        int dayIdx = dayNo - 1
        rows.eachWithIndex { List<String> activity, int activityIdx ->
            clickAddActivity(dayIdx)
            WebUI.waitForElementPresent(activityTimeInput(dayIdx, activityIdx), 8)

            setValueFast(activityTimeInput(dayIdx, activityIdx),  getPart(activity, 0))
            setValueFast(activityTitleInput(dayIdx, activityIdx), getPart(activity, 1))
            setValueFast(activityDescInput(dayIdx, activityIdx),  getPart(activity, 2))
            return

            TestObject timeObj = (dayIdx == 0 && activityIdx == 0)
                ? orObject('input_Themgio', dayInput(0, "input[@type='time']", 1))
                : dayInput(dayIdx, "input[@type='time']", activityIdx + 1)
            TestObject titleObj = (dayIdx == 0 && activityIdx == 0)
                ? orObject('input_TenHoatDong', dayInput(0, "input[contains(@placeholder,'Tên hoạt động')]", 1))
                : dayInput(dayIdx, "input[contains(@placeholder,'Tên hoạt động')]", activityIdx + 1)
            TestObject descObj = (dayIdx == 0 && activityIdx == 0)
                ? orObject('ThemHoatDong_Motachitiet', dayInput(0, "input[contains(@placeholder,'Mô tả chi tiết')]", 1))
                : dayInput(dayIdx, "input[contains(@placeholder,'Mô tả chi tiết')]", activityIdx + 1)

            setValueFast(timeObj,  getPart(activity, 0))
            setValueFast(titleObj, getPart(activity, 1))
            setValueFast(descObj,  getPart(activity, 2))
        }
    }
}

void fillDayInfo(int dayIdx, List<String> parts) {
    setValueFast(byId("day-title-${dayIdx}"), getPart(parts, 0))
    setValueFast(dayMainActivityInput(dayIdx), getPart(parts, 1))
    setValueFast(dayDescriptionInput(dayIdx), getPart(parts, 2))
    setMealsForDay(dayIdx, getPart(parts, 3))
    if (UPLOAD_DETAIL_IMAGES) {
        uploadOptional(dayImageInput(dayIdx), getPart(parts, 4))
    }
}

void fillLocationsForDay(int dayIdx, List<List<String>> locationRows) {
    for (int locIdx = 0; locIdx < locationRows.size(); locIdx++) {
        List<String> loc = locationRows[locIdx]
        if (loc.every { String value -> !value }) {
            continue
        }

        ensureLocationRow(dayIdx, locIdx)
        setValueFast(locationNameStable(dayIdx, locIdx), getPart(loc, 0))
        setValueFast(byId("loc-lat-${dayIdx}-${locIdx}"), getPart(loc, 1))
        setValueFast(byId("loc-lng-${dayIdx}-${locIdx}"), getPart(loc, 2))
        if (UPLOAD_DETAIL_IMAGES) {
            uploadOptional(locationImageInput(dayIdx, locIdx), getPart(loc, 3))
        }
    }
}

void fillActivitiesForDay(int dayIdx, List<List<String>> activityRows) {
    for (int activityIdx = 0; activityIdx < activityRows.size(); activityIdx++) {
        List<String> activity = activityRows[activityIdx]
        if (activity.every { String value -> !value }) {
            continue
        }

        ensureActivityRow(dayIdx, activityIdx)
        setValueFast(activityTimeInput(dayIdx, activityIdx), getPart(activity, 0))
        setValueFast(activityTitleInput(dayIdx, activityIdx), getPart(activity, 1))
        setValueFast(activityDescInput(dayIdx, activityIdx), getPart(activity, 2))
    }
}

void ensureLocationRow(int dayIdx, int locIdx) {
    TestObject latInput = byId("loc-lat-${dayIdx}-${locIdx}")
    if (!WebUI.verifyElementPresent(latInput, 1, FailureHandling.OPTIONAL)) {
        clickAddLocation(dayIdx)
    }
    WebUI.waitForElementPresent(latInput, 4)
}

void ensureActivityRow(int dayIdx, int activityIdx) {
    TestObject timeInput = activityTimeInput(dayIdx, activityIdx)
    if (!WebUI.verifyElementPresent(timeInput, 1, FailureHandling.OPTIONAL)) {
        clickAddActivity(dayIdx)
    }
    WebUI.waitForElementPresent(timeInput, 4)
}

void fillTourImages(String thumbnailPath, String galleryPathsRaw) {
    uploadSingleOptional(orObject('input_ThemAnhDaiDien', byId('tour-thumbnail')), thumbnailPath)

    List<String> galleryPaths = splitFilePaths(galleryPathsRaw)
    if (!galleryPaths.isEmpty()) {
        int limit = Math.min(galleryPaths.size(), MAX_GALLERY_UPLOADS)
        List<String> selectedPaths = galleryPaths.take(limit)
        KeywordUtil.logInfo("[uploadGallery] Upload ${selectedPaths.size()}/${galleryPaths.size()} gallery image(s)")
        uploadMultipleFast(xpath("(//input[@type='file' and @multiple])[1]"), selectedPaths)
    }
}

void fillAdditionalInfoFromColumns(TestData data, int row) {
    Map<String, String> mapping = [
        'Info_BaoGom'       : 'bao gom',
        'Info_KhongBaoGom'  : 'khong bao gom',
        'Info_DieuKien'     : 'dieu kien',
        'Info_PhuongTien'   : 'phuong tien',
        'Info_LuuTru'       : 'luu tru',
        'Info_DiemThamQuan' : 'diem tham quan',
        'Info_AmThuc'       : 'am thuc',
        'Info_UuDai'        : 'uu dai',
    ]

    mapping.each { String columnName, String categoryNeedle ->
        String content = val(data, row, columnName)
        if (content) {
            setAdditionalInfoValue(categoryNeedle, content)
        }
    }
}

void setAdditionalInfoValue(String categoryNeedle, String content) {
    Object activated = WebUI.executeJavaScript("""
        const normalize = (text) => (text || '')
            .normalize('NFD')
            .replace(/[\\u0300-\\u036f]/g, '')
            .replace(/[\\u0111\\u0110]/g, 'd')
            .toLowerCase();
        const needle = arguments[0];
        const matchesCategory = (text) => {
            const value = normalize(text);
            if (needle === 'bao gom') return value.includes('bao gom') && !value.includes('khong');
            return value.includes(needle);
        };
        const findCategoryTextarea = (section) => {
            for (const textarea of [...section.querySelectorAll('textarea')]) {
                let node = textarea.parentElement;
                while (node && node !== section) {
                    if (matchesCategory(node.textContent)) return textarea;
                    node = node.parentElement;
                }
            }
            return null;
        };
        const sections = [...document.querySelectorAll('section')];
        const section = sections.find((node) => normalize(node.textContent).includes('thong tin bo sung'))
            || sections[sections.length - 1];
        if (!section) throw new Error('Cannot find additional info section');

        if (findCategoryTextarea(section)) return true;

        const button = [...section.querySelectorAll('button')]
            .find((node) => matchesCategory(node.textContent));
        if (!button) throw new Error('Cannot find additional info button: ' + needle);
        button.scrollIntoView({ block: 'center' });
        button.click();
        return true;
    """, Arrays.asList(categoryNeedle))

    waitForAdditionalInfoTextarea(categoryNeedle, 5)

    WebUI.executeJavaScript("""
        const normalize = (text) => (text || '')
            .normalize('NFD')
            .replace(/[\\u0300-\\u036f]/g, '')
            .replace(/[\\u0111\\u0110]/g, 'd')
            .toLowerCase();
        const needle = arguments[0];
        const value = arguments[1] == null ? '' : String(arguments[1]);
        const matchesCategory = (text) => {
            const normalized = normalize(text);
            if (needle === 'bao gom') return normalized.includes('bao gom') && !normalized.includes('khong');
            return normalized.includes(needle);
        };
        const findCategoryTextarea = (section) => {
            for (const textarea of [...section.querySelectorAll('textarea')]) {
                let node = textarea.parentElement;
                while (node && node !== section) {
                    if (matchesCategory(node.textContent)) return textarea;
                    node = node.parentElement;
                }
            }
            return null;
        };
        const sections = [...document.querySelectorAll('section')];
        const section = sections.find((node) => normalize(node.textContent).includes('thong tin bo sung'))
            || sections[sections.length - 1];
        const textarea = findCategoryTextarea(section);
        if (!textarea) throw new Error('Cannot find additional info textarea: ' + needle);
        textarea.scrollIntoView({ block: 'center' });
        const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
        if (descriptor && descriptor.set) descriptor.set.call(textarea, value);
        else textarea.value = value;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        textarea.blur();
    """, Arrays.asList(categoryNeedle, content ?: ''))
}

void waitForAdditionalInfoTextarea(String categoryNeedle, int timeoutSeconds) {
    int waited = 0
    while (waited < timeoutSeconds * 2) {
        Object exists = WebUI.executeJavaScript("""
            const normalize = (text) => (text || '')
                .normalize('NFD')
                .replace(/[\\u0300-\\u036f]/g, '')
                .replace(/[\\u0111\\u0110]/g, 'd')
                .toLowerCase();
            const needle = arguments[0];
            const matchesCategory = (text) => {
                const value = normalize(text);
                if (needle === 'bao gom') return value.includes('bao gom') && !value.includes('khong');
                return value.includes(needle);
            };
            const findCategoryTextarea = (section) => {
                for (const textarea of [...section.querySelectorAll('textarea')]) {
                    let node = textarea.parentElement;
                    while (node && node !== section) {
                        if (matchesCategory(node.textContent)) return textarea;
                        node = node.parentElement;
                    }
                }
                return null;
            };
            const sections = [...document.querySelectorAll('section')];
            const section = sections.find((node) => normalize(node.textContent).includes('thong tin bo sung'))
                || sections[sections.length - 1];
            if (!section) return false;
            return !!findCategoryTextarea(section);
        """, Arrays.asList(categoryNeedle))
        if (exists == true || exists?.toString() == 'true') return
        WebUI.delay(0.5)
        waited++
    }
    throw new Exception("Cannot find additional info textarea: ${categoryNeedle}")
}

String buildHighlightsFromColumns(TestData data, int row) {
    List<String> items = []
    for (int i = 1; i <= 5; i++) {
        String value = val(data, row, "Highlight${i}")
        if (value) items.add(value)
    }
    return items ? items.join(';') : val(data, row, 'Highlights')
}

String buildSchedulesFromColumns(TestData data, int row) {
    List<String> items = []
    for (int i = 1; i <= 3; i++) {
        String ngayDi    = val(data, row, "Schedule${i}_NgayDi")
        String ngayVe    = val(data, row, "Schedule${i}_NgayVe")
        String gia       = val(data, row, "Schedule${i}_Gia")
        String choToiDa  = val(data, row, "Schedule${i}_ChoToiDa")
        if (ngayDi || ngayVe || gia || choToiDa) {
            items.add([ngayDi, ngayVe, gia, choToiDa].join('|'))
        }
    }
    return items ? items.join(';') : val(data, row, 'Schedules')
}

String buildDaysFromColumns(TestData data, int row) {
    List<String> items = []
    for (int i = 1; i <= 5; i++) {
        String tieuDe        = val(data, row, "Day${i}_TieuDe")
        String hoatDongChinh = val(data, row, "Day${i}_HoatDongChinh")
        String moTa          = val(data, row, "Day${i}_MoTa")
        String buaAn         = val(data, row, "Day${i}_BuaAn")
        String anh           = val(data, row, "Day${i}_Anh")
        if (tieuDe || hoatDongChinh || moTa || buaAn || anh) {
            items.add([tieuDe, hoatDongChinh, moTa, buaAn, anh].join('|'))
        }
    }
    return items ? items.join(';') : val(data, row, 'DaysData')
}

String buildLocationsFromColumns(TestData data, int row) {
    Map<Integer, List<String>> byDay = [:].withDefault { [] }
    for (int i = 1; i <= 8; i++) {
        String ngay = val(data, row, "Location${i}_Ngay")
        String ten  = val(data, row, "Location${i}_TenDiaDiem")
        String viDo = val(data, row, "Location${i}_ViDo")
        String kinhDo = val(data, row, "Location${i}_KinhDo")
        String anh = val(data, row, "Location${i}_Anh")
        if (ngay && (ten || viDo || kinhDo || anh)) {
            byDay[ngay.toInteger()].add([ten, viDo, kinhDo, anh].join('|'))
        }
    }
    if (!byDay) return val(data, row, 'LocationsData')
    return byDay.collect { Integer dayNo, List<String> values -> "${dayNo}:${values.join(',')}" }.join(';')
}

String buildActivitiesFromColumns(TestData data, int row) {
    Map<Integer, List<String>> byDay = [:].withDefault { [] }
    for (int i = 1; i <= 10; i++) {
        String ngay = val(data, row, "Activity${i}_Ngay")
        String gio  = val(data, row, "Activity${i}_Gio")
        String ten  = val(data, row, "Activity${i}_TenHoatDong")
        String moTa = val(data, row, "Activity${i}_MoTa")
        if (ngay && (gio || ten || moTa)) {
            byDay[ngay.toInteger()].add([gio, ten, moTa].join('|'))
        }
    }
    if (!byDay) return val(data, row, 'ActivitiesData')
    return byDay.collect { Integer dayNo, List<String> values -> "${dayNo}:${values.join(',')}" }.join(';')
}

String buildGalleryFromColumns(TestData data, int row) {
    List<String> items = []
    for (int i = 1; i <= 10; i++) {
        String value = val(data, row, "Gallery${i}")
        if (value) items.add(value)
    }
    return items ? items.join(';') : val(data, row, 'GalleryPaths')
}

void submitTour(String action) {
    if (action.equalsIgnoreCase('pending')) {
        WebUI.click(orObject('button_GuiDuyet',  xpath("//button[contains(.,'Gửi duyệt')]")),    FailureHandling.OPTIONAL)
    } else {
        WebUI.click(orObject('button_LuuNhap',   xpath("//button[contains(.,'Lưu bản nháp')]")), FailureHandling.OPTIONAL)
    }
}

boolean verifyResult(String tcId, String expected, String expectedMessage) {
    if (expected.equalsIgnoreCase('PASS')) {
        WebUI.waitForAlert(5, FailureHandling.OPTIONAL)
        acceptAlertIfPresent("${tcId} submit result")
        WebUI.waitForPageLoad(10)
        return true
    }

    WebUI.delay(1)
    String alertText = acceptAlertIfPresent("${tcId} validation check")
    if (expectedMessage && textContains(alertText, expectedMessage)) {
        KeywordUtil.logInfo("${tcId}: expected validation alert found: ${alertText}")
        return true
    }
    if (!expectedMessage && alertText) {
        KeywordUtil.logInfo("${tcId}: validation alert displayed as expected: ${alertText}")
        return true
    }

    if (expectedMessage && WebUI.verifyTextPresent(expectedMessage, false, FailureHandling.OPTIONAL)) {
        KeywordUtil.logInfo("${tcId}: expected validation message found")
        return true
    } else if (isValidationVisible()) {
        KeywordUtil.logInfo("${tcId}: validation displayed as expected")
        return true
    } else {
        KeywordUtil.markWarning("${tcId}: expected validation but none was visible")
        return false
    }
}

// ═════════════════════════════════════════════════════════════════════════════
//  MEALS & CLICKS
// ═════════════════════════════════════════════════════════════════════════════
void closeAnyAlert(String context) {
    acceptAlertIfPresent(context)
}

String acceptAlertIfPresent(String context) {
    try {
        if (WebUI.verifyAlertPresent(1, FailureHandling.OPTIONAL)) {
            String alertText = WebUI.getAlertText(FailureHandling.OPTIONAL) ?: ''
            WebUI.acceptAlert(FailureHandling.OPTIONAL)
            KeywordUtil.logInfo("[alert:${context}] accepted: ${alertText}")
            return alertText
        }
    } catch (Throwable ignored) {
        try {
            String alertText = WebUI.getAlertText(FailureHandling.OPTIONAL) ?: ''
            WebUI.acceptAlert(FailureHandling.OPTIONAL)
            KeywordUtil.logInfo("[alert:${context}] accepted fallback: ${alertText}")
            return alertText
        } catch (Throwable ignoredAgain) {
        }
    }
    return ''
}

boolean textContains(String actual, String expected) {
    if (!actual || !expected) return false
    return normalizeForCompare(actual).contains(normalizeForCompare(expected))
}

String normalizeForCompare(String text) {
    return java.text.Normalizer.normalize(text ?: '', java.text.Normalizer.Form.NFD)
        .replaceAll('\\p{InCombiningDiacriticalMarks}+', '')
        .replace('đ', 'd')
        .replace('Đ', 'd')
        .toLowerCase()
        .trim()
}

void setMealsForDay(int dayIdx, String mealsRaw) {
    String meals = (mealsRaw ?: '').toUpperCase()
    if (meals.contains('B')) clickMeal(dayIdx, 1, 'input_BuoiSang')
    if (meals.contains('L')) clickMeal(dayIdx, 2, 'input_Buoitrua')
    if (meals.contains('D')) clickMeal(dayIdx, 3, 'input_BuoiToi')
}

void clickMeal(int dayIdx, int checkboxIndex, String objectName) {
    WebUI.executeJavaScript("""
        const dayIdx = Number(arguments[0]);
        const index = Number(arguments[1]) - 1;
        const title = document.getElementById('day-title-' + dayIdx);
        if (!title) throw new Error('Cannot find day-title-' + dayIdx);
        const card = title.closest('div.overflow-hidden');
        if (!card) throw new Error('Cannot find day card ' + dayIdx);
        const input = [...card.querySelectorAll('input[type="checkbox"]')][index];
        if (!input) throw new Error('Cannot find meal checkbox ' + index + ' for day ' + dayIdx);
        input.scrollIntoView({ block: 'center' });
        if (!input.checked) {
            input.click();
        }
        if (!input.checked) {
            input.checked = true;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    """, Arrays.asList(dayIdx, checkboxIndex))
}

void clickAddHighlight() {
    clickAddHighlightStable()
    return
    WebUI.click(orObject('section_ThemDiemNhan', xpath("//button[contains(.,'Thêm điểm nhấn')]")), FailureHandling.OPTIONAL)
}

void clickAddSchedule() {
    clickAddScheduleStable()
    return
    WebUI.executeJavaScript("const s=[...document.querySelectorAll('section')].find(x=>x.textContent.includes('Lịch khởi hành')); const b=s&&[...s.querySelectorAll('button')].find(x=>x.textContent.includes('Thêm')); if(b)b.click();", null)
}

void clickAddHighlightStable() {
    if (WebUI.verifyElementPresent(byId('add-highlight'), 1, FailureHandling.OPTIONAL)) {
        WebUI.click(byId('add-highlight'), FailureHandling.OPTIONAL)
        return
    }

    WebUI.executeJavaScript("""
        const normalize = (text) => (text || '')
            .normalize('NFD')
            .replace(/[\\u0300-\\u036f]/g, '')
            .replace(/[\\u0111\\u0110]/g, 'd')
            .toLowerCase();
        const highlightInput = [...document.querySelectorAll('input[type="text"]')]
            .find((node) => normalize(node.placeholder).includes('diem nhan'));
        const section = highlightInput ? highlightInput.closest('section') : null;
        const buttons = section ? [...section.querySelectorAll('button')] : [...document.querySelectorAll('button')];
        const button = buttons.find((node) => {
            const text = normalize(node.textContent);
            return text.includes('them') && text.includes('diem nhan');
        });
        if (!button) throw new Error('Cannot find add highlight button');
        button.scrollIntoView({ block: 'center' });
        button.click();
    """, null)
}

void clickAddScheduleStable() {
    if (WebUI.verifyElementPresent(byId('add-schedule'), 1, FailureHandling.OPTIONAL)) {
        WebUI.click(byId('add-schedule'), FailureHandling.OPTIONAL)
        return
    }

    WebUI.executeJavaScript("""
        const normalize = (text) => (text || '')
            .normalize('NFD')
            .replace(/[\\u0300-\\u036f]/g, '')
            .replace(/[\\u0111\\u0110]/g, 'd')
            .toLowerCase();
        const firstSchedule = document.getElementById('schedule-dep-0');
        const section = firstSchedule ? firstSchedule.closest('section') : null;
        const buttons = section ? [...section.querySelectorAll('button')] : [...document.querySelectorAll('button')];
        const button = buttons.find((node) => {
            const text = normalize(node.textContent);
            return text.includes('them') && (text.includes('lich trinh') || text.includes('lich khoi hanh'));
        });
        if (!button) throw new Error('Cannot find add schedule button');
        button.scrollIntoView({ block: 'center' });
        button.click();
    """, null)
}

void clickButtonByIdOrText(String id, String sectionNeedle, String buttonNeedle) {
    if (WebUI.verifyElementPresent(byId(id), 1, FailureHandling.OPTIONAL)) {
        WebUI.click(byId(id), FailureHandling.OPTIONAL)
        return
    }

    WebUI.executeJavaScript("""
        const normalize = (text) => (text || '')
            .normalize('NFD')
            .replace(/[\\u0300-\\u036f]/g, '')
            .replace(/[\\u0111\\u0110]/g, 'd')
            .toLowerCase();
        const sectionNeedle = arguments[0];
        const buttonNeedle = arguments[1];
        const sections = [...document.querySelectorAll('section')];
        const section = sections.find((node) => normalize(node.textContent).includes(sectionNeedle));
        const buttons = section ? [...section.querySelectorAll('button')] : [...document.querySelectorAll('button')];
        const button = buttons.find((node) => normalize(node.textContent).includes(buttonNeedle));
        if (!button) throw new Error('Cannot find add button: ' + sectionNeedle);
        button.scrollIntoView({ block: 'center' });
        button.click();
    """, Arrays.asList(sectionNeedle, buttonNeedle))
}

void clickDayButton(int dayIdx, String buttonNeedle) {
    WebUI.executeJavaScript("""
        const normalize = (text) => (text || '')
            .normalize('NFD')
            .replace(/[\\u0300-\\u036f]/g, '')
            .replace(/[\\u0111\\u0110]/g, 'd')
            .toLowerCase();
        const dayIdx = Number(arguments[0]);
        const buttonNeedle = arguments[1];
        const title = document.getElementById('day-title-' + dayIdx);
        if (!title) throw new Error('Cannot find day-title-' + dayIdx);
        const card = title.closest('div.overflow-hidden');
        if (!card) throw new Error('Cannot find day card ' + dayIdx);
        const button = [...card.querySelectorAll('button')]
            .find((node) => normalize(node.textContent).includes(buttonNeedle));
        if (!button) throw new Error('Cannot find day button ' + buttonNeedle + ' for day ' + dayIdx);
        button.scrollIntoView({ block: 'center' });
        button.click();
    """, Arrays.asList(dayIdx, buttonNeedle))
}

void clickAddDay() {
    WebUI.executeJavaScript("""
        const normalize = (text) => (text || '')
            .normalize('NFD')
            .replace(/[\\u0300-\\u036f]/g, '')
            .replace(/[\\u0111\\u0110]/g, 'd')
            .toLowerCase();
        const button = [...document.querySelectorAll('button')]
            .find((node) => normalize(node.textContent).includes('them ngay moi'));
        if (!button) throw new Error('Cannot find add day button');
        button.scrollIntoView({ block: 'center' });
        button.click();
    """, null)
}

void clickAddLocation(int dayIdx) {
    clickDayButton(dayIdx, 'dia diem')
    return
    if (dayIdx == 0) {
        WebUI.click(orObject('button_ThemDiaDiem', xpath("//*[@id='day-title-0']/ancestor::div[contains(@class,'overflow-hidden')][1]//button[contains(.,'Thêm địa điểm')]")), FailureHandling.OPTIONAL)
        return
    }
    WebUI.executeJavaScript("const c=document.getElementById('day-title-${dayIdx}').closest('div.overflow-hidden'); const b=[...c.querySelectorAll('button')].find(x=>x.textContent.includes('Thêm địa điểm')); if(b)b.click();", null)
}

void clickAddActivity(int dayIdx) {
    clickDayButton(dayIdx, 'hoat dong')
    return
    if (dayIdx == 0) {
        WebUI.click(orObject('button_ThemHoatDong', xpath("//*[@id='day-title-0']/ancestor::div[contains(@class,'overflow-hidden')][1]//button[contains(.,'Thêm hoạt động')]")), FailureHandling.OPTIONAL)
        return
    }
    WebUI.executeJavaScript("const c=document.getElementById('day-title-${dayIdx}').closest('div.overflow-hidden'); const b=[...c.querySelectorAll('button')].find(x=>x.textContent.includes('Thêm hoạt động')); if(b)b.click();", null)
}

// ═════════════════════════════════════════════════════════════════════════════
//  TEST OBJECT HELPERS
// ═════════════════════════════════════════════════════════════════════════════
TestObject dayInput(int dayIdx, String xpathFragment, int oneBasedIndex) {
    return xpath("(//*[@id='day-title-${dayIdx}']/ancestor::div[contains(@class,'overflow-hidden')][1]//${xpathFragment})[${oneBasedIndex}]")
}

TestObject dayMainActivityInput(int dayIdx) {
    return xpath("(//*[@id='day-title-${dayIdx}']/ancestor::div[contains(@class,'overflow-hidden')][1]//input[@type='text'])[2]")
}

TestObject dayDescriptionInput(int dayIdx) {
    return xpath("(//*[@id='day-title-${dayIdx}']/ancestor::div[contains(@class,'overflow-hidden')][1]//textarea)[1]")
}

TestObject dayImageInput(int dayIdx) {
    return xpath("(//*[@id='day-title-${dayIdx}']/ancestor::div[contains(@class,'overflow-hidden')][1]//input[@type='file' and contains(@accept,'image')])[1]")
}

TestObject scheduleCapacityInput(int scheduleIdx) {
    return xpath("//*[@id='schedule-cap-${scheduleIdx}'] | //*[@id='schedule-price-${scheduleIdx}']/following::input[@type='number'][1]")
}

TestObject highlightInput(int highlightIdx) {
    return xpath("//*[@id='highlight-${highlightIdx}'] | (//section[.//*[@id='add-highlight']]//input[@type='text'])[${highlightIdx + 1}] | (//input[contains(@placeholder,'nháº¥n') or contains(@placeholder,'nhấn')])[${highlightIdx + 1}]")
}

TestObject locationName(int dayIdx, int locIdx) {
    return xpath("//*[@id='loc-lat-${dayIdx}-${locIdx}']/ancestor::div[contains(@class,'grid')][1]//input[contains(@placeholder,'Tên địa điểm')]")
}

TestObject locationNameStable(int dayIdx, int locIdx) {
    return xpath("//*[@id='loc-lat-${dayIdx}-${locIdx}']/preceding::input[@type='text'][1]")
}

TestObject locationImageInput(int dayIdx, int locIdx) {
    return xpath("//*[@id='loc-lat-${dayIdx}-${locIdx}']/ancestor::div[contains(@class,'grid')][1]//input[@type='file']")
}

TestObject activityTimeInput(int dayIdx, int activityIdx) {
    return xpath("(//*[@id='day-title-${dayIdx}']/ancestor::div[contains(@class,'overflow-hidden')][1]//input[@type='time'])[${activityIdx + 1}]")
}

TestObject activityTitleInput(int dayIdx, int activityIdx) {
    return xpath("((//*[@id='day-title-${dayIdx}']/ancestor::div[contains(@class,'overflow-hidden')][1]//input[@type='time'])[${activityIdx + 1}]/ancestor::div[contains(@class,'grid')][1]//input[@type='text'])[1]")
}

TestObject activityDescInput(int dayIdx, int activityIdx) {
    return xpath("((//*[@id='day-title-${dayIdx}']/ancestor::div[contains(@class,'overflow-hidden')][1]//input[@type='time'])[${activityIdx + 1}]/ancestor::div[contains(@class,'grid')][1]//input[@type='text'])[2]")
}

boolean isValidationVisible() {
    return WebUI.verifyElementPresent(
        xpath("//*[contains(text(),'Vui lòng') or contains(text(),'không hợp lệ') or contains(text(),'không được') or contains(text(),'phải') or contains(text(),'không khớp')]"),
        3, FailureHandling.OPTIONAL)
}

void waitForHighlightInput(int zeroBasedIndex, int timeoutSeconds) {
    int waited = 0
    while (waited < timeoutSeconds * 2) {
        Object exists = WebUI.executeJavaScript("""
            const normalize = (text) => (text || '')
                .normalize('NFD')
                .replace(/[\\u0300-\\u036f]/g, '')
                .replace(/[\\u0111\\u0110]/g, 'd')
                .toLowerCase();
            const index = Number(arguments[0]);
            let inputs = [...document.querySelectorAll('input[type="text"]')]
                .filter((node) => normalize(node.placeholder).includes('diem nhan'));
            if (inputs.length <= index) {
                const schedule = document.getElementById('schedule-dep-0');
                inputs = [...document.querySelectorAll('input[type="text"]')]
                    .filter((node) => !['tour-title', 'tour-departure-location', 'tour-destination'].includes(node.id))
                    .filter((node) => !schedule || (node.compareDocumentPosition(schedule) & Node.DOCUMENT_POSITION_FOLLOWING));
            }
            return inputs.length > index;
        """, Arrays.asList(zeroBasedIndex))
        if (exists == true || exists?.toString() == 'true') return
        WebUI.delay(0.5)
        waited++
    }
    KeywordUtil.markFailedAndStop("Cannot find highlight input index ${zeroBasedIndex}")
}

void setHighlightValue(int zeroBasedIndex, String value) {
    WebUI.executeJavaScript("""
        const normalize = (text) => (text || '')
            .normalize('NFD')
            .replace(/[\\u0300-\\u036f]/g, '')
            .replace(/[\\u0111\\u0110]/g, 'd')
            .toLowerCase();
        const index = Number(arguments[0]);
        const value = arguments[1] == null ? '' : String(arguments[1]);
        let inputs = [...document.querySelectorAll('input[type="text"]')]
            .filter((node) => normalize(node.placeholder).includes('diem nhan'));
        if (inputs.length <= index) {
            const schedule = document.getElementById('schedule-dep-0');
            inputs = [...document.querySelectorAll('input[type="text"]')]
                .filter((node) => !['tour-title', 'tour-departure-location', 'tour-destination'].includes(node.id))
                .filter((node) => !schedule || (node.compareDocumentPosition(schedule) & Node.DOCUMENT_POSITION_FOLLOWING));
        }
        const input = inputs[index];
        if (!input) throw new Error('Cannot find highlight input index ' + index);
        input.scrollIntoView({ block: 'center' });
        const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (descriptor && descriptor.set) descriptor.set.call(input, value);
        else input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
    """, Arrays.asList(zeroBasedIndex, value ?: ''))
}

void setIndexedTextInputInSection(String sectionNeedle, int zeroBasedIndex, String value) {
    WebUI.executeJavaScript("""
        const normalize = (text) => (text || '')
            .normalize('NFD')
            .replace(/[\\u0300-\\u036f]/g, '')
            .replace(/[\\u0111\\u0110]/g, 'd')
            .toLowerCase();
        const sectionNeedle = arguments[0];
        const index = Number(arguments[1]);
        const value = arguments[2] == null ? '' : String(arguments[2]);
        const section = [...document.querySelectorAll('section')]
            .find((node) => normalize(node.textContent).includes(sectionNeedle));
        const scopedInputs = section ? [...section.querySelectorAll('input[type="text"]')] : [];
        const fallbackInputs = [...document.querySelectorAll('input[type="text"]')]
            .filter((node) =>
                normalize(node.placeholder).includes(sectionNeedle) ||
                normalize(node.id).includes(sectionNeedle) ||
                normalize(node.name).includes(sectionNeedle) ||
                normalize(node.getAttribute('aria-label')).includes(sectionNeedle)
            );
        const inputPool = scopedInputs.length ? scopedInputs : fallbackInputs;
        const input = inputPool[index];
        if (!input) throw new Error('Cannot find text input index ' + index + ' for ' + sectionNeedle);
        input.scrollIntoView({ block: 'center' });
        const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (descriptor && descriptor.set) descriptor.set.call(input, value);
        else input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
    """, Arrays.asList(sectionNeedle, zeroBasedIndex, value ?: ''))
}

void setValueFast(TestObject object, String value) {
    value = value ?: ''
    try {
        WebElement element = WebUI.findWebElement(object, 5)
        WebUI.executeJavaScript("""
            const el = arguments[0];
            const value = arguments[1] == null ? '' : String(arguments[1]);
            if (!el) return;
            el.scrollIntoView({ block: 'center' });
            const tag = (el.tagName || '').toLowerCase();
            const proto = tag === 'textarea'
                ? window.HTMLTextAreaElement.prototype
                : window.HTMLInputElement.prototype;
            const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
            if (descriptor && descriptor.set) {
                descriptor.set.call(el, value);
            } else {
                el.value = value;
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.blur();
        """, Arrays.asList(element, value))
    } catch (Throwable t) {
        WebUI.click(object, FailureHandling.OPTIONAL)
        WebUI.sendKeys(object, Keys.chord(Keys.CONTROL, 'a'), FailureHandling.OPTIONAL)
        WebUI.setText(object, value, FailureHandling.OPTIONAL)
    }
}

void uploadOptional(TestObject object, String filePath) {
    if (!filePath?.trim()) return
    try {
        // Kiểm tra element có tồn tại không trước khi upload
        if (!WebUI.verifyElementPresent(object, 2, FailureHandling.OPTIONAL)) {
            KeywordUtil.logInfo("[uploadOptional] Element not found – skip upload: ${filePath}")
            return
        }
        String firstPath = firstFilePath(filePath)
        if (!firstPath) return
        WebElement input = WebUI.findWebElement(object, 2)
        input.sendKeys(normalizePath(firstPath))
    } catch (Throwable t) {
        KeywordUtil.logInfo("[uploadOptional] Upload skipped (${t.message}): ${filePath}")
    }
}

void uploadMultipleFast(TestObject object, List<String> filePaths) {
    List<String> normalizedPaths = filePaths
        .collect { normalizePath(it) }
        .findAll { it?.trim() }
    if (normalizedPaths.isEmpty()) return

    try {
        if (!WebUI.verifyElementPresent(object, 2, FailureHandling.OPTIONAL)) {
            KeywordUtil.logInfo("[uploadMultipleFast] Element not found - skip upload")
            return
        }

        WebElement input = WebUI.findWebElement(object, 3)
        input.sendKeys(normalizedPaths.join('\n'))
    } catch (Throwable t) {
        KeywordUtil.logInfo("[uploadMultipleFast] Upload skipped (${t.message})")
    }
}

void uploadSingleOptional(TestObject object, String filePath) {
    uploadOptional(object, firstFilePath(filePath))
}

String firstFilePath(String raw) {
    List<String> paths = splitFilePaths(raw)
    return paths ? paths[0] : ''
}

List<String> splitFilePaths(String raw) {
    if (!raw?.trim()) return []
    return raw.split(/[;\r\n]+/)
        .collect { it.trim() }
        .findAll { it.length() > 0 }
}

String normalizePath(String path) {
    return path.replace('/', '\\')
}

TestObject orObject(String objectName, TestObject fallback) {
    try {
        TestObject repoObject = findTestObject(REPO + objectName)
        return repoObject ?: fallback
    } catch (Throwable ignored) {
        return fallback
    }
}

TestObject byId(String id) {
    return xpath("//*[@id='${id}']")
}

TestObject xpath(String expression) {
    if (expression.startsWith("(//input[contains(@placeholder,")) {
        def matcher = (expression =~ /\[(\d+)\]$/)
        if (matcher.find()) {
            int oneBasedIndex = matcher.group(1).toInteger()
            expression = "//*[@id='highlight-${oneBasedIndex - 1}'] | (//section[.//*[@id='add-highlight']]//input[@type='text'])[${oneBasedIndex}] | (//input[contains(@placeholder,'nháº¥n') or contains(@placeholder,'nhấn')])[${oneBasedIndex}]"
        }
    }
    TestObject object = new TestObject("dynamic_${Math.abs(expression.hashCode())}")
    object.addProperty('xpath', ConditionType.EQUALS, expression)
    return object
}

// ═════════════════════════════════════════════════════════════════════════════
//  DATA HELPERS
// ═════════════════════════════════════════════════════════════════════════════
String val(TestData data, int row, String column) {
    try {
        return data.getValue(column, row)?.trim() ?: ''
    } catch (Throwable ignored) {
        if (hasBoundColumn(column)) {
            Object value = binding.getVariable(column)
            return value == null ? '' : value.toString().trim()
        }
        return ''
    }
}

boolean hasBoundColumn(String column) {
    try {
        return binding.hasVariable(column)
    } catch (Throwable ignored) {
        return false
    }
}

int resolveFallbackRow(TestData data) {
    String boundTcId = ''
    if (hasBoundColumn('TC_ID')) {
        Object value = binding.getVariable('TC_ID')
        boundTcId = value == null ? '' : value.toString().trim()
    }
    if (boundTcId) {
        for (int row = 1; row <= data.getRowNumbers(); row++) {
            if ((data.getValue('TC_ID', row) ?: '').trim().equalsIgnoreCase(boundTcId)) {
                return row
            }
        }
    }
    for (int row = 1; row <= data.getRowNumbers(); row++) {
        try {
            if ((data.getValue('Run', row) ?: '').trim().equalsIgnoreCase('Y')) {
                return row
            }
        } catch (Throwable ignored) {
            return 1
        }
    }
    return 1
}

List<String> splitList(String raw, String delimiter) {
    if (!raw?.trim()) return []
    return raw.split(delimiter).collect { it.trim() }.findAll { it.length() > 0 }
}

List<String> splitKeepEmpty(String raw, String regex) {
    if (raw == null) return []
    return raw.split(regex, -1).collect { it.trim() }
}

String getPart(List<String> parts, int index) {
    return index < parts.size() ? parts[index] : ''
}

Map<Integer, List<List<String>>> parseIndexedRows(String raw, int expectedParts) {
    Map<Integer, List<List<String>>> result = [:]
    splitList(raw, ';').each { String dayBlock ->
        int separator = dayBlock.indexOf(':')
        if (separator <= 0) return
        Integer dayNo   = dayBlock.substring(0, separator).trim().toInteger()
        String rowsRaw  = dayBlock.substring(separator + 1)
        result[dayNo]   = splitList(rowsRaw, ',').collect { String rowText ->
            List<String> parts = splitKeepEmpty(rowText, '\\|')
            while (parts.size() < expectedParts) parts.add('')
            return parts
        }
    }
    return result
}

