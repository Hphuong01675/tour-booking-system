package org.example.selenium.pages.admin;

import org.example.selenium.base.BasePage;
import org.example.selenium.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class AdminUserPage extends BasePage {
    private final By searchInput = By.cssSelector("input[placeholder*='Tìm kiếm nhân viên']");

    public AdminUserPage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.baseUrl() + "/admin/users");
    }

    public void searchEmployee(String keyword) {
        type(searchInput, keyword);
    }

    public boolean hasEmail(String email) {
        return isVisible(By.xpath("//table//td[normalize-space()='" + email + "']"));
    }
}
