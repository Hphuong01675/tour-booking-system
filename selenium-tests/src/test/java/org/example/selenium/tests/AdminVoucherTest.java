package org.example.selenium.tests;

import org.example.selenium.base.BaseTest;
import org.example.selenium.pages.admin.AdminVoucherPage;
import org.example.selenium.support.AuthSteps;
import org.testng.Assert;
import org.testng.annotations.Test;

import java.util.List;

public class AdminVoucherTest extends BaseTest {
    @Test(groups = {"regression"})
    public void test_ADM_001_search_and_filter_voucher_by_status() {
        AuthSteps.loginAs(getDriver(), "admin");
        AdminVoucherPage voucherPage = new AdminVoucherPage(getDriver());

        voucherPage.open();
        voucherPage.searchVoucher("V50");
        voucherPage.filterStatusPaused();

        List<String> rows = voucherPage.visibleRows();
        Assert.assertFalse(rows.isEmpty(), "Voucher search/filter should return at least one row.");
        Assert.assertTrue(rows.stream().anyMatch(row -> row.contains("V50") && row.contains("Tạm dừng")));
    }
}
