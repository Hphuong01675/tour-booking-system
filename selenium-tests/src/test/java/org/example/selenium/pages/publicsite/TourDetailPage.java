package org.example.selenium.pages.publicsite;

import org.example.selenium.base.BasePage;
import org.example.selenium.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class TourDetailPage extends BasePage {
    private final By tourHeading = By.cssSelector("main h1");
    private final By tourCode = By.xpath("//p[contains(.,'Mã tour:')]");
    private final By destinationLabel = By.xpath("//*[contains(.,'Điểm đến')]");
    private final By bookingButton = By.xpath("//button[contains(.,'Đặt Tour Ngay')]");

    public TourDetailPage(WebDriver driver) {
        super(driver);
    }

    public void open(String tourId) {
        driver.get(TestConfig.baseUrl() + "/tours/" + tourId);
    }

    public String getTourTitle() {
        return textOf(tourHeading);
    }

    public String getTourCodeText() {
        return textOf(tourCode);
    }

    public boolean isDestinationSectionVisible() {
        return isVisible(destinationLabel);
    }

    public boolean isBookingButtonVisible() {
        return isVisible(bookingButton);
    }
}
