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
    let sixtyfps = require("sixtyfps");
    let ui_setup = require("./ui/setup/initialconfig.60");
    let setupWindow = ui_setup.SetupWindow();
    setupWindow.openFileDialog.setHandler(() => {
        try {
            if (!isLinux) {
                setupWindow.gameScanPath = execSync(uglyAssWindowsOpenFileDialogCommand, {'shell':'powershell.exe'});
            } else {
                setupWindow.gameScanPath = execSync(beautifulLinuxFileDialogCommand, {'cwd':process.env.HOME});
            }
        } catch (error) {
            // it's not a directory.
        }
    });
    setupWindow.writeOutConfig.setHandler(() => {
        fs.mkdirSync(appConfigDir);
        const gameScanPath = setupWindow.gameScanPath.trim();
        if (gameScanPath != "") {
            scanAndAddGames(gameScanPath);
        }
        appTheme = setupWindow.appTheme;
        writeOutConfig();
    });
    setupWindow.finish.setHandler(() => {
        
        exit(0); // todo: just go back to original program
    });
    setupWindow.run();
}

function scanAndAddGames(gameScanDir) {
    var files = fs.readdirSync(gameScanDir);
    console.log(gameScanDir);
    console.log(files);
    files.forEach(file => {
        try {
            var gameFolder = fs.readdirSync(gameScanDir + "/" + file.toString());
            if (gameFolder.includes("start.sh")) { 
                var startScript = gameScanDir + "/" + file.toString() + "/start.sh"
                gameList.push({gameStartScript: startScript, gameName: file.toString().replace(/\./g, " ")});
            }
        } catch (error) {
            console.log(error);
        }
    });
    console.log(gameList);
}

module.exports = {appTheme, scanAndAddGames, writeOutConfig, getConfigPart, isLinux, gameList};