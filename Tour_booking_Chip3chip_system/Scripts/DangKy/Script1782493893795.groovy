import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import org.openqa.selenium.WebElement

Object getAnyVar(List<String> names, Object defaultValue = '') {
    for (String name : names) {
        try {
            if (binding.hasVariable(name)) {
                Object value = binding.getVariable(name)
                if (value != null && value.toString().trim()) {
                    return value
                }
            }
        } catch (Throwable ignored) {
        }
    }
    return defaultValue
}

String asText(Object value) {
    return value == null ? '' : value.toString().trim()
}

String normalizeDob(Object rawDob) {
    if (rawDob == null) return ''

    if (rawDob instanceof Date) {
        return rawDob.format('yyyy-MM-dd')
    }

    if (rawDob instanceof Number) {
        Date excelEpoch = Date.parse('yyyy-MM-dd', '1899-12-30')
        Date parsed = excelEpoch + rawDob.toInteger()
        return parsed.format('yyyy-MM-dd')
    }

    String raw = rawDob.toString().trim()
    if (!raw) return ''

    if (raw ==~ /\d{4}-\d{2}-\d{2}.*/) {
        return raw.substring(0, 10)
    }

    if (raw ==~ /\d{1,2}\/\d{1,2}\/\d{2,4}.*/) {
        raw = raw.split(' ')[0]
        List<String> parts = raw.split('/').toList()

        int month = parts[0].toInteger()
        int day = parts[1].toInteger()
        int year = parts[2].toInteger()

        if (year < 100) {
            year = year >= 50 ? 1900 + year : 2000 + year
        }

        return LocalDate.of(year, month, day).format(DateTimeFormatter.ofPattern('yyyy-MM-dd'))
    }

    return raw
}

void setDateValue(TestObject object, String value) {
    WebElement element = WebUI.findWebElement(object, 10)

    WebUI.executeJavaScript("""
        const el = arguments[0];
        const value = arguments[1];

        el.removeAttribute('readonly');
        el.focus();

        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, value);

        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.blur();
    """, [element, value])

    WebUI.delay(0.3)
}

String waitOtpFromBackendLog(String email, String logPath, int timeoutSeconds) {
    File logFile = new File(logPath)
    long endAt = System.currentTimeMillis() + timeoutSeconds * 1000

    while (System.currentTimeMillis() < endAt) {
        if (logFile.exists()) {
            byte[] bytes = logFile.bytes
            String content = ''

            try {
                if (bytes.length >= 2 && bytes[0] == (byte)0xFF && bytes[1] == (byte)0xFE) {
                    content = new String(bytes, 'UTF-16LE')
                } else if (bytes.length >= 2 && bytes[0] == (byte)0xFE && bytes[1] == (byte)0xFF) {
                    content = new String(bytes, 'UTF-16BE')
                } else {
                    content = new String(bytes, 'UTF-8')
                }
            } catch (Throwable ignored) {
                content = logFile.text
            }

            content = content
                .replace('\u0000', '')
                .replaceAll(/\u001B\[[;\d]*m/, '')

            List<String> found = []

            content.eachLine { String line ->
                if (line.contains(email)) {
                    def matcher = line =~ /(\d{4})/
                    while (matcher.find()) {
                        found.add(matcher.group(1))
                    }
                }
            }

            if (!found.isEmpty()) {
                return found.last()
            }

            def fallback = content =~ /(?i)\[MAIL SERVICE\].*?(\d{4})/
            while (fallback.find()) {
                found.add(fallback.group(1))
            }

            if (!found.isEmpty()) {
                return found.last()
            }
        }

        WebUI.delay(1)
    }

    throw new Exception("Không tìm thấy OTP trong backend.log cho email: " + email + ". Log path: " + logPath)
}

String fullName = asText(getAnyVar(['FullName', 'var_FullName']))
Object dobRaw = getAnyVar(['DOB', 'var_DOB'])
String phone = asText(getAnyVar(['Phone', 'var_Phone']))
String email = asText(getAnyVar(['Email', 'var_Email']))
String address = asText(getAnyVar(['Address', 'var_Address']))
String password = asText(getAnyVar(['Password', 'var_Password']))
String confirmPassword = asText(getAnyVar(['var_ConfirmPassword', 'ConfirmPassword', 'var_Confirm_Password']))

if (!confirmPassword) {
    confirmPassword = password
}

WebUI.openBrowser('')
WebUI.navigateToUrl('http://localhost:5173/register')
WebUI.waitForPageLoad(10)

WebUI.setText(findTestObject('DangKy/input_person_fullName'), fullName)

String dobValue = normalizeDob(dobRaw)
println(">>> DOB Excel: ${dobRaw} => input date: ${dobValue}")
setDateValue(findTestObject('DangKy/input_dateOfBirth'), dobValue)

WebUI.setText(findTestObject('DangKy/input_call_phone'), phone)
WebUI.setText(findTestObject('DangKy/input_mail_email'), email)
WebUI.setText(findTestObject('DangKy/input_address'), address)
WebUI.setText(findTestObject('DangKy/input_lock_password'), password)
WebUI.setText(findTestObject('DangKy/input_lock_reset_confirmPassword'), confirmPassword)

WebUI.click(findTestObject('DangKy/input_Xc thc OTP_agreeTerms'))
WebUI.click(findTestObject('DangKy/button_Xc thc OTP'))

String logPath = 'D:\\HKII_25-26\\CCNM\\DUAN\\1\\tour-booking-system\\backend\\backend.log'
String otpCode = waitOtpFromBackendLog(email, logPath, 30)

println(">>> OTP lấy từ backend.log là: [${otpCode}]")
WebUI.takeScreenshot()

if (!otpCode || otpCode.length() != 4) {
    throw new Exception("OTP không hợp lệ: " + otpCode)
}

WebUI.waitForPageLoad(10)
WebUI.delay(1)

if (WebUI.verifyElementPresent(findTestObject('DangKy/input_OTP'), 3, com.kms.katalon.core.model.FailureHandling.OPTIONAL)) {
    WebUI.setText(findTestObject('DangKy/input_OTP'), otpCode)
} else {
    // Fallback nếu OTP là 4 ô input riêng
    WebUI.executeJavaScript("""
        const otp = arguments[0];
        const inputs = [...document.querySelectorAll('input')]
            .filter(el => el.offsetParent !== null)
            .filter(el => {
                const type = (el.getAttribute('type') || '').toLowerCase();
                const name = ((el.getAttribute('name') || '') + ' ' + (el.id || '') + ' ' + (el.className || '') + ' ' + (el.placeholder || '')).toLowerCase();
                return type === 'text' || type === 'tel' || type === 'number' || name.includes('otp');
            });

        if (inputs.length >= 4) {
            for (let i = 0; i < 4; i++) {
                inputs[i].focus();
                inputs[i].value = otp[i];
                inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
                inputs[i].dispatchEvent(new Event('change', { bubbles: true }));
            }
            return 'filled-4-inputs';
        }

        const one = inputs.find(el => {
            const max = el.getAttribute('maxlength');
            return max === '4' || (el.placeholder || '').toLowerCase().includes('otp') || (el.id || '').toLowerCase().includes('otp');
        });

        if (one) {
            one.focus();
            one.value = otp;
            one.dispatchEvent(new Event('input', { bubbles: true }));
            one.dispatchEvent(new Event('change', { bubbles: true }));
            return 'filled-one-input';
        }

        return 'not-found';
    """, [otpCode])
}

WebUI.delay(1)
WebUI.click(findTestObject('DangKy/NutXacNhan'))