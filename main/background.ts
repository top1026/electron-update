import { exec, spawn } from "child_process";
import { app, ipcMain } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

const isProd: boolean = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home.html");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();

autoUpdater.on("checking-for-update", () => {
  log.info("업데이트 확인 중...");
});
autoUpdater.on("update-available", (info) => {
  log.info("업데이트가 가능합니다.");
});
autoUpdater.on("update-not-available", (info) => {
  log.info("현재 최신버전입니다.");
});
autoUpdater.on("error", (err) => {
  log.info("에러가 발생하였습니다. 에러내용 : " + err);
});
autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "다운로드 속도: " + progressObj.bytesPerSecond;
  log_message = log_message + " - 현재 " + progressObj.percent + "%";
  log_message =
    log_message +
    " (" +
    progressObj.transferred +
    "/" +
    progressObj.total +
    ")";
  log.info(log_message);
});
autoUpdater.on("update-downloaded", (info) => {
  log.info("업데이트가 완료되었습니다.");
});

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("getConfig", (ev, arg) => {
  console.log("IPC Man Recieved");
  const cmd = `aws secretsmanager get-secret-value --secret-id ${arg} --query SecretString --output text > $HOME/.kube/${arg}`;
  console.log(cmd);

  const pp = spawn("bash");
  pp.stdin.write(cmd);
  pp.stdin.end();
  // const pp = spawn("ls", ["-lh", "/usr"]);

  pp.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  pp.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  pp.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });

  exec(cmd, (err, stdout, stderr) => {
    console.log(stdout);
    // dialog.showMessageBox(null);
    // ev.sender.send("bar", "Res!");
  });
});

ipcMain.on("execForward", (ev, arg) => {
  console.log("IPC Man Recieved");
  const cmd = `kubectl port-forward --kubeconfig=$HOME/.kube/${arg} --address 0.0.0.0 svc/mongodb-mongos --namespace mongodb 27017`;
  // const cmd = `kubectl port-forward --address 0.0.0.0 svc/mongodb-mongos --namespace mongodb 27017`;
  console.log(cmd);

  const pp = spawn("bash");
  pp.stdin.write(cmd);
  pp.stdin.end();
  // const pp = spawn("ls", ["-lh", "/usr"]);

  pp.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);

    ev.sender.send("log", `${data}`);
  });

  pp.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  pp.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
});

ipcMain.on("exec", (ev, arg) => {
  console.log("IPC Man Recieved");
  // const cmd = `kubectl port-forward --kubeconfig=$HOME/.kube/${arg} --address 0.0.0.0 svc/mongodb-mongos --namespace mongodb 27017`;
  // const cmd = `kubectl port-forward --address 0.0.0.0 svc/mongodb-mongos --namespace mongodb 27017`;
  // console.log(cmd);

  const pp = spawn("bash");
  pp.stdin.write(arg);
  pp.stdin.end();
  // const pp = spawn("ls", ["-lh", "/usr"]);

  pp.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);

    // ev.sender.send("log", `${data}`);
  });

  pp.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  pp.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
});

ipcMain.on("kill", (ev, arg) => {
  console.log("IPC Man Recieved");
  // const cmd = `kubectl port-forward --kubeconfig=$HOME/.kube/${arg} --address 0.0.0.0 svc/mongodb-mongos --namespace mongodb 27017`;
  // const cmd = `kubectl port-forward --address 0.0.0.0 svc/mongodb-mongos --namespace mongodb 27017`;
  // console.log(cmd);
  const cmd = `netstat -vanp tcp | grep 27017 | grep LISTEN | awk '{print $9}'`;
  const pp = spawn("bash");
  pp.stdin.write(cmd);
  pp.stdin.end();
  // const pp = spawn("ls", ["-lh", "/usr"]);

  pp.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    if (data) {
      console.log("kill");
      const kill = spawn("bash");
      kill.stdin.write(`kill -9 ${data}`);
      kill.stdin.end();
      ev.sender.send("resState", "");
    }

    // ev.sender.send("log", `${data}`);
  });

  pp.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  pp.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
});

ipcMain.on("reqState", (ev, arg) => {
  console.log("reqState");
  const cmd = `netstat -vanp tcp | grep 27017 | grep LISTEN | awk '{print $9}'`;
  const pp = spawn("bash");
  pp.stdin.write(cmd);
  pp.stdin.end();

  pp.stdout.on("data", (data) => {
    console.log("data", `${data}`);
    ev.sender.send("resState", `${data}`);
  });

  pp.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  pp.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
});

ipcMain.on("reqGetKubeConfig", (ev, arg) => {
  const cmd = `ls $HOME/.kube/ | grep k8s`;
  const pp = spawn("bash");
  pp.stdin.write(cmd);
  pp.stdin.end();

  pp.stdout.on("data", (data) => {
    console.log("data", `${data}`);
    ev.sender.send("resGetKubeConfig", `${data}`.split("\n"));
  });

  pp.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  pp.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
});
