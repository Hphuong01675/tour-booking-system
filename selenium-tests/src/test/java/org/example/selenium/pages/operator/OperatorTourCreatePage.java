package org.example.selenium.pages.operator;

import org.example.selenium.base.BasePage;
import org.example.selenium.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import java.time.Duration;

public class OperatorTourCreatePage extends BasePage {
    public OperatorTourCreatePage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.baseUrl() + "/operator/tours/new");
    }

    public boolean hasRequiredMarkerFor(String labelText) {
        return isVisible(By.xpath("//*[contains(normalize-space(),'" + labelText + "') and contains(normalize-space(),'*')]"));
    }

    public void setInputValueJS(WebElement element, String value) {
        String script = "var element = arguments[0];\n" +
                "var value = arguments[1];\n" +
                "var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value') ? Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set : null;\n" +
                "if (!setter && Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')) {\n" +
                "  setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;\n" +
                "}\n" +
                "if (setter) {\n" +
                "  setter.call(element, value);\n" +
                "} else {\n" +
                "  element.value = value;\n" +
                "}\n" +
                "element.dispatchEvent(new Event('input', { bubbles: true }));\n" +
                "element.dispatchEvent(new Event('change', { bubbles: true }));";
        ((JavascriptExecutor) driver).executeScript(script, element, value);
    }

    public void clearInput(By locator) {
        WebElement element = waitForVisible(locator);
        try {
            element.clear();
        } catch (Exception e) {
            // ignore
        }
        setInputValueJS(element, "");
    }

    public void enterTitle(String title) {
        if (title.isEmpty()) {
            clearInput(By.id("tour-title"));
        } else {
            type(By.id("tour-title"), title);
        }
    }

    public void selectDifficulty(String value) {
        Select select = new Select(waitForVisible(By.id("tour-difficulty")));
        select.selectByValue(value);
    }

    public void enterDurationDays(String days) {
        if (days.isEmpty()) {
            clearInput(By.id("tour-duration-days"));
        } else {
            type(By.id("tour-duration-days"), days);
        }
    }

    public void enterDurationNights(String nights) {
        if (nights.isEmpty()) {
            clearInput(By.id("tour-duration-nights"));
        } else {
            type(By.id("tour-duration-nights"), nights);
        }
    }

    public void enterDepartureLocation(String loc) {
        if (loc.isEmpty()) {
            clearInput(By.id("tour-departure-location"));
        } else {
            type(By.id("tour-departure-location"), loc);
        }
    }

    public void enterDestination(String dest) {
        if (dest.isEmpty()) {
            clearInput(By.id("tour-destination"));
        } else {
            type(By.id("tour-destination"), dest);
        }
    }

    public void enterBasePrice(String price) {
        if (price.isEmpty()) {
            clearInput(By.id("tour-base-price"));
        } else {
            type(By.id("tour-base-price"), price);
        }
    }

    public void enterSchedulePrice(int index, String price) {
        By locator = By.id("schedule-price-" + index);
        if (price.isEmpty()) {
            clearInput(locator);
        } else {
            type(locator, price);
        }
    }

    public void setDateInputJS(By locator, String dateStr) {
        WebElement element = waitForVisible(locator);
        setInputValueJS(element, dateStr);
    }

    public void enterScheduleDates(int index, String depDate, String retDate) {
        By depLoc = By.id("schedule-dep-" + index);
        By retLoc = By.id("schedule-ret-" + index);
        
        if (depDate.isEmpty()) {
            clearInput(depLoc);
        } else {
            setDateInputJS(depLoc, depDate);
        }
        
        if (retDate.isEmpty()) {
            clearInput(retLoc);
        } else {
            setDateInputJS(retLoc, retDate);
        }
    }

    public void clickAddSchedule() {
        click(By.xpath("//button[contains(normalize-space(), 'Thêm lịch trình')]"));
    }

    public void clickAddDay() {
        click(By.xpath("//button[contains(normalize-space(), 'Thêm ngày mới')]"));
    }

    public void enterItineraryDayTitle(int index, String title) {
        By locator = By.id("day-title-" + index);
        if (title.isEmpty()) {
            clearInput(locator);
        } else {
            type(locator, title);
        }
    }

    public void clickAddLocationToDay(int dayIndex) {
        click(By.xpath("(//button[contains(normalize-space(), '+ Thêm địa điểm')])[" + (dayIndex + 1) + "]"));
    }

    public void enterLocationCoordinates(int dayIndex, int locIndex, String latitude, String longitude) {
        By latLoc = By.id("loc-lat-" + dayIndex + "-" + locIndex);
        By lngLoc = By.id("loc-lng-" + dayIndex + "-" + locIndex);

        if (latitude.isEmpty()) {
            clearInput(latLoc);
        } else {
            type(latLoc, latitude);
        }

        if (longitude.isEmpty()) {
            clearInput(lngLoc);
        } else {
            type(lngLoc, longitude);
        }
    }

    public void uploadThumbnail(String filePath) {
        WebElement uploadInput = driver.findElement(By.id("tour-thumbnail"));
        uploadInput.sendKeys(filePath);
    }

    public void clickJS(By locator) {
        WebElement element = wait.until(ExpectedConditions.presenceOfElementLocated(locator));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }

    public void clickSubmitForApproval() {
        clickJS(By.xpath("//button[contains(normalize-space(), 'Gửi duyệt')]"));
    }

    public void clickSaveDraft() {
        // We have two "Lưu bản nháp" buttons, click the first one (top bar)
        clickJS(By.xpath("(//button[contains(normalize-space(), 'Lưu bản nháp')])[1]"));
    }

    public boolean isErrorToastVisible() {
        try {
            return new org.openqa.selenium.support.ui.WebDriverWait(driver, Duration.ofSeconds(3))
                    .until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//*[contains(text(), 'Phát hiện lỗi')]")))
                    .isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getErrorMessage() {
        return textOf(By.xpath("//*[contains(text(), 'Phát hiện lỗi')]/following-sibling::p"));
    }

    public void closeErrorToast() {
        clickJS(By.xpath("//*[contains(text(), 'Phát hiện lỗi')]/../../button"));
    }
}

