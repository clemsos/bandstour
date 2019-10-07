
import time
import sys
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0

options = Options()
options.add_argument( "--headless" )
# options.add_argument( "--screenshot test.jpg http://google.com/" )
driver = webdriver.Firefox( firefox_options=options )
driver.implicitly_wait(30)
driver.get('http://localhost:3000/topograms/TLPJw7ZpzxK8pogRL')

#element = WebDriverWait(driver,30).until(EC.presence_of_element_located((By.ID, "svg")))
time.sleep(15)
driver.save_screenshot('test2.png')
print driver.title
print driver.current_url
driver.quit()
sys.exit()
