const path = require("path");
const fs = require('fs');
const terminalRunCommand = "foot %command%";
const { exec } = require("child_process");

let slint = require("slint-ui");
let uiMain = require("./ui/main.slint");
let appConfig = require("./appconfig.js");

var gameList = appConfig.gameList;

let mainWindow = new uiMain.MainWindow();

var finalGameList = [];

function updateGuiGameList() {
    gameList.forEach(game => {
        finalGameList.push({text: game.gameName});
    });
}
updateGuiGameList();
mainWindow.playButtonClicked.setHandler(
    function() {
        if (mainWindow.selectedGame != -1) {
            try {
            if (mainWindow.willRunInTerminal) {
                exec(terminalRunCommand.replace("%command%", gameList[mainWindow.selectedGame].startScript));
            } else {
                console.log(gameList[mainWindow.selectedGame].gameStartScript);
                exec(gameList[mainWindow.selectedGame].gameStartScript);
            }
        } catch (error) {
            console.log(error);
        }
        }
    }
);

mainWindow.gameList = finalGameList;
mainWindow.run();