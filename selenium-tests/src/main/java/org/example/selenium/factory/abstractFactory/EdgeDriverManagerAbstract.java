package org.example.selenium.factory.abstractFactory;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.example.selenium.config.TestConfig;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
public class EdgeDriverManagerAbstract extends DriverManagerAbstract {
    @Override
    public WebDriver createDriver() {
        WebDriverManager.edgedriver().setup();
        EdgeOptions options = new EdgeOptions();
        options.addArguments("--start-maximized");
        if (TestConfig.headless()) {
            options.addArguments("--headless=new");
            options.addArguments("--window-size=1920,1080");
        }

        return new EdgeDriver(options);
    }
}
