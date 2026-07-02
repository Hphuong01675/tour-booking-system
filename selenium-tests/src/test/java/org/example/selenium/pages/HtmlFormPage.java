package org.example.selenium.pages;

import org.example.selenium.base.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.Select;

public class HtmlFormPage extends BasePage {
    private final By usernameInput = By.name("username");
    private final By passwordInput = By.name("password");
    private final By commentsTextarea = By.name("comments");
    private final By submitButton = By.cssSelector("input[type='submit']");

    public HtmlFormPage(WebDriver driver) {
        super(driver);
    }
    public void open(){
        driver.get("https://testpages.eviltester.com/pages/forms/html-form/");
    }
    public void enterUsername(String username){
        type(usernameInput,username);
    }
    public void enterPassword(String password){
        type(passwordInput,password);
    }
    public void enterComments(String comments){
        type(commentsTextarea,comments);
    }
    public void selectCheckboxByValue(String value){
        By checkbox = By.cssSelector("input[type='checkbox'][value = '" + value +"']");
        if(!driver.findElement(checkbox).isSelected()){
            click(checkbox);
        }
    }
    public boolean isCheckBoxSelected(String value){
        By checkbox = By.cssSelector("input[type='checkbox'][value = '" + value +"']");
        return driver.findElement(checkbox).isSelected();
    }
    public void selectRadioByValue(String value){
        By radio = By.cssSelector("input[type='radio'][value= '" + value +"']");
        click(radio);
    }
    public boolean isRadioSelected(String value) {
        By radio = By.cssSelector("input[type='radio'][value='" + value + "']");
        return driver.findElement(radio).isSelected();
    }
    public void selectDropdownByValue(String value) {
        Select dropdown = new Select(driver.findElement(By.name("dropdown")));
        dropdown.selectByValue(value);
    }

    public String getSelectedDropdownValue() {
        Select dropdown = new Select(driver.findElement(By.name("dropdown")));
        return dropdown.getFirstSelectedOption().getAttribute("value");
    }

    public void submit() {
        click(submitButton);
    }
}
