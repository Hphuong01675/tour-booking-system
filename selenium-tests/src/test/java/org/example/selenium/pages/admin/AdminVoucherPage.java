package org.example.selenium.pages.admin;

import org.example.selenium.base.BasePage;
import org.example.selenium.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

import java.util.List;

public class AdminVoucherPage extends BasePage {
    private final By searchInput = By.cssSelector("input[placeholder='Tìm kiếm voucher...']");
    private final By statusSelect = By.cssSelector("main select");
    private final By tableRows = By.cssSelector("tbody tr");

    public AdminVoucherPage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.baseUrl() + "/admin/vouchers");
    }

    public void searchVoucher(String keyword) {
        type(searchInput, keyword);
    }

    public void filterStatusPaused() {
        selectByVisibleText(statusSelect, "Tạm dừng");
    }

    public List<String> visibleRows() {
        return textsOf(tableRows);
    }
}
