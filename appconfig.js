var fs = require("fs");
const { execSync } = require('child_process');
const { exit } = require("process");


const uglyAssWindowsOpenFileDialogCommand = "[System.Reflection.Assembly]::LoadWithPartialName(\"System.windows.forms\") | Out-Null; $OpenFileDialog = New-Object System.Windows.Forms.FolderBrowserDialog; $OpenFileDialog.ShowDialog() | Out-Null; echo $OpenFileDialog.SelectedPath";
const beautifulLinuxFileDialogCommand = fs.existsSync("/usr/bin/kdialog") ? "kdialog --getexistingdirectory" : "zenity --file-selection --directory";

const configDir = process.env.APPDATA || process.env.XDG_CONFIG_HOME || process.env.HOME + "/.config";
const appConfigDir = configDir + "/totemlauncher";
const configJson = appConfigDir + "/config.json";

console.log(`Config file: ${configJson}`);

const isFirstRun = !fs.existsSync(appConfigDir);
const isLinux = process.platform === "linux";

var gameList = isFirstRun ? [] : getConfigPart("gameList");
var appTheme = 1; // 1-light, 2-dark, 3-system

function getConfigPart(part) {
    var configObject = JSON.parse(fs.readFileSync(configJson));
    return configObject[part];
}

function writeOutConfig() {
    try {
        fs.writeFileSync(configJson, JSON.stringify({theme: appTheme, gameList: gameList}));
    } catch (error) {
        console.log(error);
    }
}

if (isFirstRun) {
    var currentFoundGames = [];
    var currentGameList = [];
    let slint = require("slint-ui");
    let ui_setup = require("./ui/setup/initialconfig.slint");
    let setupWindow = ui_setup.SetupWindow();
    setupWindow.addGames.setHandler((gameIndex) => {
        if (gameIndex == -1) {
            currentGameList.forEach(game => {
                gameList.push(game);
                console.log(`adding ${game.gameName} @ ${game.gameStartScript}`);
            });
            currentGameList = [];
            setupWindow.foundGameList = [];
        } else {
            gameList.push(currentGameList[gameIndex]);
            console.log(`adding ${currentGameList[gameIndex].gameName} @ ${currentGameList[gameIndex].gameStartScript}`);
        }
    });
    setupWindow.scanFolder.setHandler(() => {
        try {
            const gameScanPath = setupWindow.gameScanPath.trim();
            if (gameScanPath != "") {
                currentGameList = scanGames(gameScanPath);
                var guiGameList = [];
                currentGameList.forEach(game => {
                    if (!currentFoundGames.includes(game)) {
                        guiGameList.push({text: `${game.gameName} @ ${game.gameStartScript}`});
                    } else {
                        guiGameList.push({text: `(already added) ${game.gameName} @ ${game.gameStartScript}`});
                    }
                });
                setupWindow.foundGameList = guiGameList;
            }
        } catch (error) {
            console.log(error);
        }
    });
    setupWindow.openFileDialog.setHandler(() => {
        try {
            if (!isLinux) {
                setupWindow.gameScanPath = execSync(uglyAssWindowsOpenFileDialogCommand, {'shell':'powershell.exe'});
            } else {
                setupWindow.gameScanPath = execSync(beautifulLinuxFileDialogCommand, {'cwd':process.env.HOME});
            }
            setupWindow.scanFolder();
        } catch (error) {
            // it's probably not a directory.
        }
    });
    setupWindow.writeOutConfig.setHandler(() => {
        fs.mkdirSync(appConfigDir);
        
        appTheme = setupWindow.appTheme;
        writeOutConfig();
    });
    setupWindow.run();
}

function scanGames(gameScanDir) {
    var files = fs.readdirSync(gameScanDir);
    console.log(gameScanDir);
    console.log(files);
    var scanList = [];
    if (isLinux) {
        files.forEach(file => {
            try {
                var gameFolder = fs.readdirSync(gameScanDir + "/" + file.toString());
                if (gameFolder.includes("start.sh")) { 
                    var startScript = gameScanDir + "/" + file.toString() + "/start.sh"
                    scanList.push({gameStartScript: startScript, gameName: file.toString().replace(/\./g, " ")});
                }
            } catch (error) {
                console.log(error);
            }
        });
    } else {
        files.forEach(file => {
            try {
                var gameFolder = fs.readdirSync(gameScanDir + "\\" + file.toString()); 
                gameFolder.forEach(gameFile => {
                    var executables = [];
                    if (gameFile.endsWith(".exe")) {
                        if (!gameFile.startsWith("unins000") && !gameFile.startsWith("UnityCrashHandler") && !gameFile.startsWith("vcredist")) {
                            executables.push(gameFile);
                        }
                    }
                    if (executables.length == 1) {
                        scanList.push({gameStartScript: gameScanDir + "\\" + file.toString() + "\\" + executables[0], gameName: file.toString().replace(/\./g, " ")});
                    }
                });

                
            } catch (error) {
                console.log(error);
            }
        });
    }
    return(scanList);
}

module.exports = {appTheme, scanGames, writeOutConfig, getConfigPart, isLinux, gameList};