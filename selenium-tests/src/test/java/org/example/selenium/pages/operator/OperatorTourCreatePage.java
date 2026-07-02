package org.example.selenium.pages.operator;

import org.example.selenium.base.BasePage;
import org.example.selenium.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class OperatorTourCreatePage extends BasePage {
    public OperatorTourCreatePage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.baseUrl() + "/operator/tours/new");
    }

    public boolean hasRequiredMarkerFor(String labelText) {
        return isVisible(By.xpath("//*[contains(normalize-space(),'" + labelText + "') and contains(normalize-space(),'*')]"));
    }
}
