package org.example.selenium.tests;

import org.example.selenium.base.BaseTest;
import org.example.selenium.pages.admin.AdminTourPage;
import org.example.selenium.support.AuthSteps;
import org.testng.Assert;
import org.testng.Reporter;
import org.testng.annotations.Test;

import java.util.List;

public class AdminTourTest extends BaseTest {
    @Test(groups = {"regression"})
    public void test_ADM_007_search_tour_by_name() {
        AuthSteps.loginAs(getDriver(), "admin");
        AdminTourPage tourPage = new AdminTourPage(getDriver());

        Reporter.log("Step 1: Open admin tour management", true);
        tourPage.open();

        Reporter.log("Step 2: Search tour by name", true);
        tourPage.searchTour("Da Lat");

        Reporter.log("Step 3: Verify matching tour is displayed", true);
        Assert.assertTrue(tourPage.hasTourName("Test Pagination - Da Lat Cloud Hunt"));
    }

    @Test(groups = {"regression"})
    public void test_ADM_008_filter_tours_by_open_status() {
        AuthSteps.loginAs(getDriver(), "admin");
        AdminTourPage tourPage = new AdminTourPage(getDriver());

        tourPage.open();
        tourPage.filterOpenTours();

        List<String> rows = tourPage.visibleRows();
        Assert.assertFalse(rows.isEmpty(), "Open status filter should return at least one tour.");
        Assert.assertTrue(rows.stream().allMatch(row -> row.contains("Đang mở")));
    }

    @Test(groups = {"regression"})
    public void test_ADM_009_filter_tours_by_hard_difficulty() {
        AuthSteps.loginAs(getDriver(), "admin");
        AdminTourPage tourPage = new AdminTourPage(getDriver());

        tourPage.open();
        tourPage.filterDifficultyHard();

        List<String> rows = tourPage.visibleRows();
        Assert.assertFalse(rows.isEmpty(), "Hard difficulty filter should return at least one tour.");
        Assert.assertTrue(rows.stream().allMatch(row -> row.toLowerCase().contains("hard")));
    }
}
