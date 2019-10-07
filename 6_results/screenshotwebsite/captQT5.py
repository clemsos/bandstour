import sys
from PyQt5.QtCore import *
from PyQt5.QtWidgets import (QApplication, QWidget, QPushButton, QAction, QLineEdit, QMessageBox, QMainWindow, QGridLayout)
from PyQt5.QtWebKitWidgets import QWebView


class App(QMainWindow):
    def __init__(self, parent=None):
        super().__init__(parent)

        centralWidget   = QWidget()
        self.setCentralWidget(centralWidget)

        self.searchbox = QLineEdit("", self)
        self.go = QPushButton('Go', self)
        self.go.clicked.connect(self.gourl)
        self.webview = Browser()

        self.grid = QGridLayout(centralWidget)
        self.grid.addWidget(self.webview, 0, 0, 1, 4)
        self.grid.addWidget(self.searchbox, 1, 0)
        self.grid.addWidget(self.go, 1, 1)

    def gourl(self):
        url = self.searchbox.text()
        self.webview.load(QUrl(url))


class Browser(QWebView):   #(QWebView):
    windowList = []
    def createWindow(self, QWebEnginePage_WebWindowType):
        App.setCentralWidget(Browser())
        #new_window.show()
        self.windowList.append(App())
        return Browser()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    box = App()
    box.setWindowTitle('Browser')
    box.resize(600, 500)
    box.show()
    sys.exit(app.exec_())
