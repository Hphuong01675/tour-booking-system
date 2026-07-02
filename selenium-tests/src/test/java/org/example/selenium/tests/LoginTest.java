package org.example.selenium.tests;

import org.example.selenium.base.BaseTest;
import org.example.selenium.config.TestConfig;
import org.example.selenium.pages.auth.LoginPage;
import org.example.selenium.support.TestDataReader;
import org.testng.Assert;
import org.testng.Reporter;
import org.testng.annotations.Test;

import java.util.Map;

public class LoginTest extends BaseTest {
    private static final String LOGIN_DATA = "src/test/resources/test-data/auth-login.csv";

    @Test(groups = {"smoke", "regression"})
    public void test_AUTH_001_login_successfully_with_valid_credentials() {
        Map<String, String> loginData = TestDataReader.readCsvRow(LOGIN_DATA, "valid_admin");
        String validUsername = System.getProperty("login.username", loginData.get("username"));
        String validPassword = System.getProperty("login.password", loginData.get("password"));
        LoginPage loginPage = new LoginPage(getDriver());

        Reporter.log("Step 1: Open login page", true);
        loginPage.open();

        Reporter.log("Step 2: Enter valid username and password", true);
        loginPage.login(validUsername, validPassword);

        Reporter.log("Step 3: Wait until application leaves login page", true);
        loginPage.waitUntilLoginPageIsClosed();

        Reporter.log("Step 4: Login succeeded, current URL = " + loginPage.getCurrentUrl(), true);
        pauseForPresentation();

        Reporter.log("Step 5: Verify current URL no longer contains /login", true);
        Assert.assertFalse(loginPage.getCurrentUrl().contains("/login"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_AUTH_002_login_fails_with_invalid_credentials() {
        Map<String, String> loginData = TestDataReader.readCsvRow(LOGIN_DATA, "invalid_credentials");
        LoginPage loginPage = new LoginPage(getDriver());

        Reporter.log("Step 1: Open login page", true);
        loginPage.open();

        Reporter.log("Step 2: Enter invalid username and password", true);
        loginPage.login(loginData.get("username"), loginData.get("password"));

        Reporter.log("Step 3: Verify user remains on login page or sees error", true);
        Assert.assertTrue(loginPage.isStillOnLoginPage());
        Assert.assertTrue(loginPage.hasVisibleErrorMessage());
    }

    @Test(groups = {"negative", "regression"})
    public void test_AUTH_003_login_requires_email_and_password() {
        LoginPage loginPage = new LoginPage(getDriver());

        Reporter.log("Step 1: Open login page", true);
        loginPage.open();

        Reporter.log("Step 2: Submit empty form", true);
        loginPage.submitEmptyForm();

        Reporter.log("Step 3: Verify email and password are required fields", true);
        Assert.assertTrue(loginPage.isStillOnLoginPage());
        Assert.assertTrue(loginPage.isUsernameRequired());
        Assert.assertTrue(loginPage.isPasswordRequired());
    }

    @Test(groups = {"negative", "regression"})
    public void test_AUTH_004_login_requires_password_when_email_is_filled() {
        Map<String, String> loginData = TestDataReader.readCsvRow(LOGIN_DATA, "missing_password");
        LoginPage loginPage = new LoginPage(getDriver());

        Reporter.log("Step 1: Open login page", true);
        loginPage.open();

        Reporter.log("Step 2: Enter email and leave password empty", true);
        loginPage.login(loginData.get("username"), loginData.get("password"));

        Reporter.log("Step 3: Verify password is required", true);
        Assert.assertTrue(loginPage.isStillOnLoginPage());
        Assert.assertTrue(loginPage.isPasswordRequired());
    }

    private void pauseForPresentation() {
        try {
            Reporter.log("Demo pause: keep browser open for " + TestConfig.demoPauseSeconds() + " seconds", true);
            Thread.sleep(TestConfig.demoPauseSeconds() * 1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
