package org.example.selenium.pages;

import org.example.selenium.base.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class LoginPage extends BasePage {
    private final String loginUrl = System.getProperty(
            "login.url",
            "http://localhost:5173/login"
    );

    private final By usernameInput = By.cssSelector(System.getProperty("login.username.selector", "#login-email"));
    private final By passwordInput = By.cssSelector(System.getProperty("login.password.selector", "#login-password"));
    private final By loginButton = By.cssSelector(System.getProperty("login.submit.selector", "button[type='submit']"));
    private final By errorMessage = By.cssSelector(System.getProperty("login.error.selector", "[role='alert'], .error, .text-red-500"));

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

    public void waitUntilLoginPageIsClosed() {
        wait.until(ExpectedConditions.not(ExpectedConditions.urlContains("/login")));
    }

    public String getCurrentUrl() {
        return driver.getCurrentUrl();
    }

    public String getErrorMessage() {
        return waitForVisible(errorMessage).getText();
    }
}
