const path = require("path");
const fs = require('fs');
const gameDir = "/home/maxwell/Games/johncena141/";
const terminalRunCommand = "foot %command%";
const { exec } = require("child_process");

let sixtyfps = require("sixtyfps");
let uiMain = require("./ui/main.60");
let appConfig = require("./appconfig.js");

var gameList = appConfig.gameList;

let mainWindow = new uiMain.MainWindow();

var files = fs.readdirSync(gameDir);

var finalGameList = [];

gameList.forEach(game => {
    finalGameList.push({text: game.gameName});
});

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