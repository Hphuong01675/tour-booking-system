package org.example.selenium.pages.auth;

import org.example.selenium.base.BasePage;
import org.example.selenium.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.time.Duration;

public class LoginPage extends BasePage {
    private final String loginUrl = System.getProperty("login.url", TestConfig.baseUrl() + "/login");

    private final By usernameInput = By.cssSelector(System.getProperty("login.username.selector", "#login-email"));
    private final By passwordInput = By.cssSelector(System.getProperty("login.password.selector", "#login-password"));
    private final By loginButton = By.cssSelector(System.getProperty("login.submit.selector", "button[type='submit']"));
    private final By errorMessage = By.xpath("//*[contains(.,'Email hoac mat khau khong dung') or contains(.,'Email hoặc mật khẩu không đúng') or contains(.,'dang nhap qua nhieu lan') or contains(.,'đăng nhập quá nhiều lần')]");
    private final By emailRequiredMessage = By.xpath("//*[contains(.,'Email la bat buoc') or contains(.,'Email là bắt buộc')]");
    private final By passwordRequiredMessage = By.xpath("//*[contains(.,'Mat khau la bat buoc') or contains(.,'Mật khẩu là bắt buộc')]");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(loginUrl);
    }

    public void login(String username, String password) {
        type(usernameInput, username);
        type(passwordInput, password);
        click(loginButton);
    }

    public void submitEmptyForm() {
        click(loginButton);
    }

    public void waitUntilLoginPageIsClosed() {
        wait.until(ExpectedConditions.not(ExpectedConditions.urlContains("/login")));
    }

    public String getCurrentUrl() {
        return driver.getCurrentUrl();
    }

    public boolean isStillOnLoginPage() {
        return getCurrentUrl().contains("/login");
    }

    public boolean hasVisibleErrorMessage() {
        try {
            WebElement message = new org.openqa.selenium.support.ui.WebDriverWait(driver, Duration.ofSeconds(3))
                    .until(ExpectedConditions.visibilityOfElementLocated(errorMessage));
            return message.isDisplayed() && !message.getText().isBlank();
        } catch (RuntimeException e) {
            return false;
        }
    }

    public boolean isUsernameRequired() {
        return hasValidationMessage(usernameInput) || isMessageVisible(emailRequiredMessage);
    }

    public boolean isPasswordRequired() {
        return hasValidationMessage(passwordInput) || isMessageVisible(passwordRequiredMessage);
    }

    private boolean hasValidationMessage(By locator) {
        WebElement element = waitForVisible(locator);
        String validationMessage = element.getAttribute("validationMessage");
        return validationMessage != null && !validationMessage.isBlank();
    }

    private boolean isMessageVisible(By locator) {
        try {
            WebElement message = new org.openqa.selenium.support.ui.WebDriverWait(driver, Duration.ofSeconds(2))
                    .until(ExpectedConditions.visibilityOfElementLocated(locator));
            return message.isDisplayed() && !message.getText().isBlank();
        } catch (RuntimeException e) {
            return false;
        }
    }

    public String getErrorMessage() {
        return waitForVisible(errorMessage).getText();
    }
}
