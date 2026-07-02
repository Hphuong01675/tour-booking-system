package org.example.selenium.tests;

import org.example.selenium.base.BaseTest;
import org.example.selenium.pages.publicsite.TourDetailPage;
import org.testng.Assert;
import org.testng.Reporter;
import org.testng.annotations.Test;

public class GuestTourTest extends BaseTest {
    private static final String TOUR_ID = "91000000-0000-0000-0000-000000000001";
    private static final String TOUR_TITLE = "Test Pagination - Iceland Winter Ring";
    private static final String TOUR_CODE = "ADM-PAGE-001";

    @Test(groups = {"smoke"})
    public void test_GUE_003_view_tour_detail_as_guest() {
        TourDetailPage tourDetailPage = new TourDetailPage(getDriver());

        Reporter.log("Step 1: Open public tour detail page", true);
        tourDetailPage.open(TOUR_ID);

        Reporter.log("Step 2: Verify core tour information is displayed", true);
        Assert.assertEquals(tourDetailPage.getTourTitle(), TOUR_TITLE);
        Assert.assertTrue(tourDetailPage.getTourCodeText().contains(TOUR_CODE));
        Assert.assertTrue(tourDetailPage.isDestinationSectionVisible());
        Assert.assertTrue(tourDetailPage.isBookingButtonVisible());
    }
}
