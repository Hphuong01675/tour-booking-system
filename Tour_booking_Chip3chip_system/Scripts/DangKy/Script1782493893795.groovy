import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import groovy.json.JsonSlurper
import java.net.URLEncoder
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import com.kms.katalon.core.testobject.TestObject

String normalizeDob(Object rawDob) {
    if (rawDob == null) return ''

    String raw = rawDob.toString().trim()
    if (!raw) return ''

    // Nếu đã đúng dạng input date
    if (raw ==~ /\d{4}-\d{2}-\d{2}/) {
        return raw
    }

    // Nếu Excel/Katalon đưa về dạng M/d/yy hoặc M/d/yyyy
    if (raw ==~ /\d{1,2}\/\d{1,2}\/\d{2,4}/) {
        List<String> parts = raw.split('/').toList()
        int month = parts[0].toInteger()
        int day = parts[1].toInteger()
        int year = parts[2].toInteger()

        if (year < 100) {
            year = year >= 50 ? 1900 + year : 2000 + year
        }

        return LocalDate.of(year, month, day).format(DateTimeFormatter.ofPattern('yyyy-MM-dd'))
    }

    // Nếu Katalon đọc Excel Date thành dạng Date string
    try {
        Date parsed = Date.parse('EEE MMM dd HH:mm:ss zzz yyyy', raw)
        return parsed.format('yyyy-MM-dd')
    } catch (Throwable ignored) {
    }

    return raw
}

void setDateValue(TestObject object, String value) {
    WebUI.executeJavaScript("""
        const el = arguments[0];
        const value = arguments[1];
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.blur();
    """, Arrays.asList(WebUI.findWebElement(object, 10), value))
}

WebUI.openBrowser('')
WebUI.navigateToUrl('http://localhost:5173/register')
WebUI.waitForPageLoad(10)

WebUI.setText(findTestObject('DangKy/input_person_fullName'), var_FullName)

String dobValue = normalizeDob(var_DOB)
println(">>> DOB Excel: ${var_DOB} => input date: ${dobValue}")
setDateValue(findTestObject('DangKy/input_dateOfBirth'), dobValue)

WebUI.setText(findTestObject('DangKy/input_call_phone'), var_Phone)
WebUI.setText(findTestObject('DangKy/input_mail_email'), var_Email)
WebUI.setText(findTestObject('DangKy/input_address'), var_Address)
WebUI.setText(findTestObject('DangKy/input_lock_password'), var_Password)
WebUI.setText(findTestObject('DangKy/input_lock_reset_confirmPassword'), var_ConfirmPassword)

WebUI.click(findTestObject('DangKy/input_Xc thc OTP_agreeTerms'))
WebUI.click(findTestObject('DangKy/button_Xc thc OTP'))

WebUI.delay(2)

String apiUrl = 'http://localhost:5000/dev/get-otp?email=' + URLEncoder.encode(var_Email, 'UTF-8')
def conn = ((new URL(apiUrl).openConnection()) as HttpURLConnection)
conn.requestMethod = 'GET'

def json = new JsonSlurper().parse(conn.inputStream)
String otpCode = json.otp.toString()

println(">>> OTP lấy được từ API là: $otpCode")

WebUI.setText(findTestObject('DangKy/input_OTP'), otpCode)
WebUI.delay(1)
WebUI.click(findTestObject('DangKy/NutXacNhan'))