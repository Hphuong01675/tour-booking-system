package org.example.selenium.factory.abstractFactory;

import org.example.selenium.constants.BrowserType;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.edge.EdgeDriver;
public final class DriverManagerFactoryAbstract {
    private DriverManagerFactoryAbstract() {
    }

    public static DriverManagerAbstract getManager(BrowserType browserType) {
        return switch (browserType) {
            case CHROME -> new ChromeDriverManagerAbstract();
            case EDGE -> new EdgeDriverManagerAbstract();
        };
    }
}
