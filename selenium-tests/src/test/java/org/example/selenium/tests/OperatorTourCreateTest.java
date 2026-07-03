package org.example.selenium.tests;

import org.example.selenium.base.BaseTest;
import org.example.selenium.pages.operator.OperatorTourCreatePage;
import org.example.selenium.support.AuthSteps;
import org.example.selenium.support.TestDataReader;
import org.testng.Assert;
import org.testng.Reporter;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.Map;

public class OperatorTourCreateTest extends BaseTest {
    private static final String TEST_DATA_FILE = "src/test/resources/test-data/operator-tour-create-validation.csv";
    private OperatorTourCreatePage createPage;

    @BeforeMethod(alwaysRun = true)
    public void setupTest() {
        AuthSteps.loginAs(getDriver(), "operator");
        createPage = new OperatorTourCreatePage(getDriver());
        createPage.open();
    }

    private void fillForm(Map<String, String> data) {
        createPage.enterTitle(data.get("title"));
        createPage.enterDurationDays(data.get("durationDays"));
        createPage.enterDurationNights(data.get("durationNights"));
        createPage.enterDepartureLocation(data.get("departureLocation"));
        createPage.enterDestination(data.get("destination"));
        createPage.enterBasePrice(data.get("basePrice"));

        createPage.enterSchedulePrice(0, data.get("schedulePrice"));
        createPage.enterScheduleDates(0, data.get("scheduleDepDate"), data.get("scheduleRetDate"));

        createPage.enterItineraryDayTitle(0, data.get("dayTitle"));

        String lat = data.get("locLat");
        String lng = data.get("locLng");
        if (!lat.isEmpty() || !lng.isEmpty()) {
            createPage.clickAddLocationToDay(0);
            createPage.enterLocationCoordinates(0, 0, lat, lng);
        }
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
        Reporter.log("Submitting form with empty title from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_title_required");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_duration_days_invalid() {
        Reporter.log("Submitting form with empty duration days from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_duration_days_invalid");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_departure_location_required() {
        Reporter.log("Submitting form with empty departure location from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_departure_location_required");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_destination_required() {
        Reporter.log("Submitting form with empty destination from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_destination_required");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_base_price_required() {
        Reporter.log("Submitting form with empty base price from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_base_price_required");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_base_price_negative() {
        Reporter.log("Submitting form with negative base price from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_base_price_negative");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_days_nights_mismatch() {
        Reporter.log("Submitting form with days/nights mismatch from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_days_nights_mismatch");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_thumbnail_required_on_submit() {
        Reporter.log("Submitting for approval without thumbnail from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_thumbnail_required_on_submit");
        fillForm(data);
        createPage.clickSubmitForApproval();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_schedule_price_required() {
        Reporter.log("Submitting form with empty schedule price from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_schedule_price_required");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_schedule_date_reverse() {
        Reporter.log("Submitting form with end date before start date from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_schedule_date_reverse");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_schedule_duration_mismatch() {
        Reporter.log("Submitting form with schedule duration mismatch from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_schedule_duration_mismatch");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_itinerary_day_title_required() {
        Reporter.log("Submitting form with empty itinerary day title from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_itinerary_day_title_required");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_itinerary_location_latitude_required() {
        Reporter.log("Submitting form with empty latitude from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_itinerary_location_latitude_required");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }

    @Test(groups = {"negative", "regression"})
    public void test_OPE_validation_itinerary_location_longitude_required() {
        Reporter.log("Submitting form with empty longitude from CSV", true);
        Map<String, String> data = TestDataReader.readCsvRow(TEST_DATA_FILE, "validation_itinerary_location_longitude_required");
        fillForm(data);
        createPage.clickSaveDraft();

        Assert.assertTrue(createPage.isErrorToastVisible(), "Error toast should be visible");
        Assert.assertEquals(createPage.getErrorMessage(), data.get("expectedError"));
    }
}

