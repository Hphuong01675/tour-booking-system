package org.example.selenium.pages.publicsite;

import org.example.selenium.base.BasePage;
import org.example.selenium.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class HomePage extends BasePage {
    private final By destinationInput = By.cssSelector("input[placeholder='Bạn muốn đi đâu?']");
    private final By searchButton = By.xpath("//button[contains(.,'Tìm kiếm')]");
    private final By featuredToursHeading = By.xpath("//h2[contains(.,'Tour Đặc Sắc')]");

    public HomePage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.baseUrl() + "/");
    }

    public void searchDestination(String keyword) {
        type(destinationInput, keyword);
        click(searchButton);
    }

    public boolean isFeaturedToursVisible() {
        return isVisible(featuredToursHeading);
    }

    public boolean hasTourTitle(String tourTitle) {
        return isVisible(By.xpath("//h3[normalize-space()='" + tourTitle + "']"));
    }

    public boolean hasTourDetailLink(String tourId) {
        return isVisible(By.cssSelector("a[href='/tours/" + tourId + "']"));
    }
}
