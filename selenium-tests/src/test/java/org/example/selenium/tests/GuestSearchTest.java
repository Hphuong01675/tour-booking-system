package org.example.selenium.tests;

import org.example.selenium.base.BaseTest;
import org.example.selenium.pages.publicsite.HomePage;
import org.testng.Assert;
import org.testng.Reporter;
import org.testng.annotations.Test;

public class GuestSearchTest extends BaseTest {
    private static final String SEARCH_KEYWORD = "Iceland";
    private static final String EXPECTED_TOUR_ID = "91000000-0000-0000-0000-000000000001";
    private static final String EXPECTED_TOUR_TITLE = "Test Pagination - Iceland Winter Ring";

    @Test(groups = {"smoke"})
    public void test_GUE_004_search_tour_on_home_page() {
        HomePage homePage = new HomePage(getDriver());

        Reporter.log("Step 1: Open home page", true);
        homePage.open();

        Reporter.log("Step 2: Search tour by destination keyword", true);
        homePage.searchDestination(SEARCH_KEYWORD);

        Reporter.log("Step 3: Verify matching tour is displayed", true);
        Assert.assertTrue(homePage.isFeaturedToursVisible());
        Assert.assertTrue(homePage.hasTourTitle(EXPECTED_TOUR_TITLE));
        Assert.assertTrue(homePage.hasTourDetailLink(EXPECTED_TOUR_ID));
    }
}
