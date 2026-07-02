package org.example.selenium.tests;

import org.example.selenium.base.BaseTest;
import org.example.selenium.pages.admin.AdminUserPage;
import org.example.selenium.support.AuthSteps;
import org.testng.Assert;
import org.testng.Reporter;
import org.testng.annotations.Test;

public class AdminUserTest extends BaseTest {
    @Test(groups = {"regression"})
    public void test_ADM_014_search_user_by_email() {
        AuthSteps.loginAs(getDriver(), "admin");
        AdminUserPage userPage = new AdminUserPage(getDriver());

        Reporter.log("Step 1: Open admin user management", true);
        userPage.open();

        Reporter.log("Step 2: Search employee by email", true);
        userPage.searchEmployee("operator5@gmail.com");

        Reporter.log("Step 3: Verify matching user is displayed", true);
        Assert.assertTrue(userPage.hasEmail("operator5@gmail.com"));
    }
}
