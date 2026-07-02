package org.example.selenium.tests;

import org.example.selenium.base.BaseTest;
import org.example.selenium.pages.guide.GuideProfilePage;
import org.example.selenium.support.AuthSteps;
import org.testng.Assert;
import org.testng.Reporter;
import org.testng.annotations.Test;

public class GuideProfileTest extends BaseTest {
    @Test(groups = {"regression"})
    public void test_GUI_001_profile_identity_fields_are_disabled() {
        AuthSteps.loginAs(getDriver(), "guide");
        GuideProfilePage profilePage = new GuideProfilePage(getDriver());

        profilePage.open();

        Assert.assertTrue(profilePage.isFullNameDisabled());
        Assert.assertTrue(profilePage.isRoleDisabled());
        Assert.assertTrue(profilePage.isEmailDisabled());
    }

    @Test(groups = {"negative"})
    public void test_GUI_004_update_phone_with_too_short_number_shows_validation_error() {
        AuthSteps.loginAs(getDriver(), "guide");
        GuideProfilePage profilePage = new GuideProfilePage(getDriver());

        profilePage.open();

        String validationMessage = profilePage.submitInvalidPhone("0567899");
        Reporter.log("Validation message: " + validationMessage, true);
        Assert.assertTrue(
                validationMessage.contains("Số điện thoại")
                        || validationMessage.contains("không hợp lệ")
                        || validationMessage.contains("thất bại")
                        || validationMessage.contains("lỗi")
        );
    }
}
