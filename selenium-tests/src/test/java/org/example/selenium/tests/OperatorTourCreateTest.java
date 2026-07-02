package org.example.selenium.tests;

import org.example.selenium.base.BaseTest;
import org.example.selenium.pages.operator.OperatorTourCreatePage;
import org.example.selenium.support.AuthSteps;
import org.testng.Assert;
import org.testng.annotations.Test;

public class OperatorTourCreateTest extends BaseTest {
    @Test(groups = {"negative"})
    public void test_OPE_003_required_fields_are_marked_on_create_tour_form() {
        AuthSteps.loginAs(getDriver(), "operator");
        OperatorTourCreatePage createPage = new OperatorTourCreatePage(getDriver());

        createPage.open();

        Assert.assertTrue(createPage.hasRequiredMarkerFor("Tên tour du lịch"));
        Assert.assertTrue(createPage.hasRequiredMarkerFor("Cấp độ Tour"));
        Assert.assertTrue(createPage.hasRequiredMarkerFor("Số ngày"));
        Assert.assertTrue(createPage.hasRequiredMarkerFor("Số đêm"));
        Assert.assertTrue(createPage.hasRequiredMarkerFor("Điểm xuất phát"));
        Assert.assertTrue(createPage.hasRequiredMarkerFor("Điểm đến"));
        Assert.assertTrue(createPage.hasRequiredMarkerFor("Giá cơ bản"));
        Assert.assertTrue(createPage.hasRequiredMarkerFor("Ngày đi"));
        Assert.assertTrue(createPage.hasRequiredMarkerFor("Ngày về"));
        Assert.assertTrue(createPage.hasRequiredMarkerFor("Chỗ tối đa"));
        Assert.assertTrue(createPage.hasRequiredMarkerFor("Ảnh đại diện"));
    }
}
