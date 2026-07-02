package org.example.selenium.factory.abstractFactory;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.example.selenium.config.TestConfig;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;

public class ChromeDriverManagerAbstract extends DriverManagerAbstract {
    @Override
    public WebDriver createDriver(){
        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--start-maximized");
        if (TestConfig.headless()) {
            options.addArguments("--headless=new");
            options.addArguments("--window-size=1920,1080");
        }

        return new ChromeDriver(options);
    }
}
