package org.example.selenium.pages.guide;

import org.example.selenium.base.BasePage;
import org.example.selenium.config.TestConfig;
import org.openqa.selenium.Alert;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class GuideProfilePage extends BasePage {
    private final By fullNameInput = By.id("fullName");
    private final By emailInput = By.id("email");
    private final By phoneInput = By.id("phone");
    private final By roleInput = By.xpath("//input[@disabled and @value='Hướng dẫn viên chuyên nghiệp']");
    private final By updateButton = By.xpath("//button[contains(.,'Cập nhật thông tin')]");

    public GuideProfilePage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.baseUrl() + "/guide/profile");
    }

    public boolean isFullNameDisabled() {
        return !waitForVisible(fullNameInput).isEnabled();
    }

    public boolean isEmailDisabled() {
        return !waitForVisible(emailInput).isEnabled();
    }

    public boolean isRoleDisabled() {
        return !waitForVisible(roleInput).isEnabled();
    }

    public String submitInvalidPhone(String phoneNumber) {
        type(phoneInput, phoneNumber);
        click(updateButton);
        Alert alert = wait.until(ExpectedConditions.alertIsPresent());
        String message = alert.getText();
        alert.accept();
        return message;
    }
}
