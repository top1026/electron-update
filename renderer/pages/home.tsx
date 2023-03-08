import dayjs from "dayjs";
import { ipcRenderer } from "electron";
import Head from "next/head";
import React, { useEffect, useState } from "react";

const LIST = [
  { label: "egypt", target: "k8s.egypt.cfg" },
  { label: "clever", target: "k8s.clever.cfg" },
  { label: "cd2-eg-field", target: "k8s.cd2-eg-field.cfg" },
];

const Cmd = () => {
  const [text, setText] = useState("");

  return (
    <div>
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
      />
      <button
        onClick={() => {
          ipcRenderer.send("exec", text);
          setText("");
        }}
      >
        exec
      </button>
    </div>
  );
};

function Home() {
  const [logs, setLogs] = useState<string[]>([]);
  const [pid, setPid] = useState("");
  const [configs, setConfigs] = useState<string[]>([]);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    console.log("mount!");
    ipcRenderer.on("log", (ev, data) => {
      setLogs((old) => {
        return [`[${dayjs().format("YYYY.MM.DD HH:mm:ss")}] ${data}`, ...old];
      });
    });

    ipcRenderer.on("resGetKubeConfig", (ev, data) => {
      setConfigs(data);
    });

    return () => {
      ipcRenderer.off("log", () => {
        return;
      });
      ipcRenderer.off("resGetKubeConfig", () => {
        return;
      });
    };
  }, []);

  useEffect(() => {
    console.log("send!!!!!!!!");

    let timerId = setInterval(() => {
      ipcRenderer.send("reqState");
    }, 10000);

    ipcRenderer.on("resState", (ev, data) => {
      console.log(data);
      setPid(data);
    });

    return () => {
      clearInterval(timerId);
      ipcRenderer.off("resState", () => {
        return;
      });
    };
  }, []);
  console.log(logs);
  console.log(process.env.NEXT_PUBLIC_CF_AUTH_URL);

  return (
    <React.Fragment>
      <Head>
        <title>Home - Nextron (with-typescript-emotion)</title>
      </Head>
      <div>
        {LIST.map((el, index) => {
          return (
            <div key={index}>
              <button
                onClick={() => {
                  ipcRenderer.send("getConfig", el.target);
                }}
              >
                {el.label}
              </button>

              <button
                onClick={() => {
                  setCurrent(el.target);
                  ipcRenderer.send("execForward", el.target);
                }}
              >
                forward
              </button>
            </div>
          );
        })}
      </div>
      <div>{process.env.NEXT_PUBLIC_CF_AUTH_URL}</div>
      {/* <Cmd /> */}

      {pid}
      <button
        onClick={() => {
          ipcRenderer.send("kill");
        }}
      >
        kill
      </button>

      <button
        onClick={() => {
          ipcRenderer.send("reqGetKubeConfig");
        }}
      >
        config
      </button>

      {configs.join(", ")}

      {current}

      <div style={{ height: 200, overflow: "auto" }}>
        {logs.map((el, index) => {
          return <div key={index}>{el}</div>;
        })}
      </div>
    </React.Fragment>
  );
}

export default Home;
