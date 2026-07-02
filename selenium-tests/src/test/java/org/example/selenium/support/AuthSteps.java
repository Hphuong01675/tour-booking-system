package org.example.selenium.support;

import org.example.selenium.pages.auth.LoginPage;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.testng.Reporter;

import java.util.Map;

public final class AuthSteps {
    private static final String ROLE_ACCOUNTS = "src/test/resources/test-data/role-accounts.csv";

    private AuthSteps() {
    }

    public static void loginAs(WebDriver driver, String roleId) {
        Map<String, String> account = TestDataReader.readCsvRow(ROLE_ACCOUNTS, roleId);
        Reporter.log("Login as " + roleId + " (" + account.get("username") + ")", true);
        login(driver, account);
    }

    private static void login(WebDriver driver, Map<String, String> account) {
        String currentUrl = driver.getCurrentUrl();
        if (currentUrl != null
                && currentUrl.startsWith("http://localhost:5173")
                && !currentUrl.contains("/login")) {
            Reporter.log("Browser is already authenticated, skip login", true);
            return;
        }

        LoginPage loginPage = new LoginPage(driver);
        loginPage.open();
        loginPage.login(account.get("username"), account.get("password"));
        try {
            loginPage.waitUntilLoginPageIsClosed();
        } catch (TimeoutException firstAttemptFailed) {
            Reporter.log("Login did not leave /login on first attempt, retrying once", true);
            loginPage.open();
            loginPage.login(account.get("username"), account.get("password"));
            loginPage.waitUntilLoginPageIsClosed();
        }
    }
}
