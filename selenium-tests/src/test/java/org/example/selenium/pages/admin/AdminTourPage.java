package org.example.selenium.pages.admin;

import org.example.selenium.base.BasePage;
import org.example.selenium.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

import java.util.List;

public class AdminTourPage extends BasePage {
    private final By searchInput = By.cssSelector("input[placeholder='Tìm kiếm tour...']");
    private final By difficultySelect = By.cssSelector("main select");
    private final By tableRows = By.cssSelector("tbody tr");

    public AdminTourPage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.baseUrl() + "/admin/tours");
    }

    public void searchTour(String keyword) {
        type(searchInput, keyword);
    }

    public void filterOpenTours() {
        click(By.xpath("//button[contains(.,'Đang mở')]"));
    }

    public void filterDifficultyHard() {
        selectByVisibleText(difficultySelect, "Hard");
    }

    public boolean hasTourName(String tourName) {
        return isVisible(By.xpath("//table//p[normalize-space()='" + tourName + "']"));
    }

    public List<String> visibleRows() {
        return textsOf(tableRows);
    }
}
