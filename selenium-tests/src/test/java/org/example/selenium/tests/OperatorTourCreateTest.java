package org.example.selenium.tests;

import org.example.selenium.base.BaseTest;
import org.example.selenium.pages.operator.OperatorTourCreatePage;
import org.example.selenium.support.AuthSteps;
import org.testng.Assert;
import org.testng.Reporter;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class OperatorTourCreateTest extends BaseTest {
    private OperatorTourCreatePage createPage;

    @BeforeMethod(alwaysRun = true)
    public void setupTest() {
        AuthSteps.loginAs(getDriver(), "operator");
        createPage = new OperatorTourCreatePage(getDriver());
        createPage.open();
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_003_required_fields_are_marked_on_create_tour_form() {
        Reporter.log("Verifying required input markers (*)", true);
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

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_title_required() {
        Reporter.log("Submitting form with empty title", true);
        createPage.enterTitle("");
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Vui lòng điền tên tour du lịch.");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_duration_days_invalid() {
        Reporter.log("Submitting form with empty duration days", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("");
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Số ngày du lịch không hợp lệ.");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_departure_location_required() {
        Reporter.log("Submitting form with empty departure location", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDepartureLocation("");
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Vui lòng nhập điểm xuất phát.");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_destination_required() {
        Reporter.log("Submitting form with empty destination", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDepartureLocation("Hà Nội");
        createPage.enterDestination("");
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Vui lòng nhập điểm đến.");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_base_price_required() {
        Reporter.log("Submitting form with empty base price", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDepartureLocation("Hà Nội");
        createPage.enterDestination("Hà Giang");
        createPage.enterBasePrice("");
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Vui lòng nhập giá cơ bản.");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_base_price_negative() {
        Reporter.log("Submitting form with negative base price", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDepartureLocation("Hà Nội");
        createPage.enterDestination("Hà Giang");
        createPage.enterBasePrice("-50000");
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Giá cơ bản không hợp lệ (phải là số không âm).");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_days_nights_mismatch() {
        Reporter.log("Submitting form with days/nights mismatch (difference > 1)", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDurationNights("5"); // Diff is 2
        createPage.enterDepartureLocation("Hà Nội");
        createPage.enterDestination("Hà Giang");
        createPage.enterBasePrice("1500000");
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Số ngày và số đêm không hợp lệ (chỉ được lệch nhau tối đa 1 đơn vị).");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_thumbnail_required_on_submit() {
        Reporter.log("Submitting for approval without thumbnail", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDurationNights("2");
        createPage.enterDepartureLocation("Hà Nội");
        createPage.enterDestination("Hà Giang");
        createPage.enterBasePrice("1500000");
        createPage.clickSubmitForApproval();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Vui lòng tải lên ảnh đại diện của tour (thumbnail) khi gửi duyệt.");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_schedule_price_required() {
        Reporter.log("Submitting form with empty schedule price", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDurationNights("2");
        createPage.enterDepartureLocation("Hà Nội");
        createPage.enterDestination("Hà Giang");
        createPage.enterBasePrice("1500000");
        
        // Schedule price is empty by default, so just trigger submit
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Vui lòng nhập giá cho lịch khởi hành thứ 1.");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_schedule_date_reverse() {
        Reporter.log("Submitting form with end date before start date", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDurationNights("2");
        createPage.enterDepartureLocation("Hà Nội");
        createPage.enterDestination("Hà Giang");
        createPage.enterBasePrice("1500000");
        createPage.enterSchedulePrice(0, "1600000");
        createPage.enterScheduleDates(0, "2026-08-10", "2026-08-05"); // Reverse
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Ngày kết thúc không được trước ngày khởi hành ở lịch khởi hành thứ 1.");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_schedule_duration_mismatch() {
        Reporter.log("Submitting form with schedule duration mismatch with config", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDurationNights("2");
        createPage.enterDepartureLocation("Hà Nội");
        createPage.enterDestination("Hà Giang");
        createPage.enterBasePrice("1500000");
        createPage.enterSchedulePrice(0, "1600000");
        createPage.enterScheduleDates(0, "2026-08-01", "2026-08-02"); // 1 night diff instead of 2 nights
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Ngày đi và ngày về ở lịch khởi hành thứ 1 không khớp với cấu hình số ngày đêm của tour (3 ngày, 2 đêm).");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_itinerary_day_title_required() {
        Reporter.log("Submitting form with empty itinerary day title", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDurationNights("2");
        createPage.enterDepartureLocation("Hà Nội");
        createPage.enterDestination("Hà Giang");
        createPage.enterBasePrice("1500000");
        createPage.enterSchedulePrice(0, "1600000");
        createPage.enterScheduleDates(0, "2026-08-01", "2026-08-03"); // Correct
        
        createPage.enterItineraryDayTitle(0, ""); // Empty title
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Vui lòng nhập tiêu đề cho ngày thứ 1.");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_itinerary_location_latitude_required() {
        Reporter.log("Submitting form with empty latitude for itinerary location", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDurationNights("2");
        createPage.enterDepartureLocation("Hà Nội");
        createPage.enterDestination("Hà Giang");
        createPage.enterBasePrice("1500000");
        createPage.enterSchedulePrice(0, "1600000");
        createPage.enterScheduleDates(0, "2026-08-01", "2026-08-03");
        createPage.enterItineraryDayTitle(0, "Ngày 1: Hà Nội - Hà Giang");
        
        createPage.clickAddLocationToDay(0);
        createPage.enterLocationCoordinates(0, 0, "", "104.98"); // Empty lat
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Vui lòng nhập vĩ độ cho địa điểm thứ 1 của ngày 1.");
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_itinerary_location_longitude_required() {
        Reporter.log("Submitting form with empty longitude for itinerary location", true);
        createPage.enterTitle("Tour Hà Giang");
        createPage.enterDurationDays("3");
        createPage.enterDurationNights("2");
        createPage.enterDepartureLocation("Hà Nội");
        createPage.enterDestination("Hà Giang");
        createPage.enterBasePrice("1500000");
        createPage.enterSchedulePrice(0, "1600000");
        createPage.enterScheduleDates(0, "2026-08-01", "2026-08-03");
        createPage.enterItineraryDayTitle(0, "Ngày 1: Hà Nội - Hà Giang");
        
        createPage.clickAddLocationToDay(0);
        createPage.enterLocationCoordinates(0, 0, "22.8", ""); // Empty lng
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), "Vui lòng nhập kinh độ cho địa điểm thứ 1 của ngày 1.");
    }
}

