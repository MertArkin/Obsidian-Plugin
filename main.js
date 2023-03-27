const { MarkdownRenderer, Plugin, MarkdownView } = require("obsidian");
//access
//const { spawn } = require("child_process");

//Maybe you can get rid of all the settings ? still works but check
const DEFAULT_SETTINGS = {
  mySetting: "default",
};

//How to setup view class and then open the same leaf the right side with reading mode
//but the left is still the active one !

module.exports = class CodeEmbed extends Plugin {
  static containerClass = "code-embed";
  //static titleClasses = ["code-embed-title", ""];
  //static errorClass = "code-embed-error";

  async onload() {
    await this.loadSettings();
    console.log("CodeEmbed plugin loaded");

    //hotreload added
    //PROBABLY ADD MORE ICONS OR PANEL ICONS TO TRIGGER { superedit, cmd , vs code,  }
    //yani ne yapmak isteyebilin already bir folderda olan, kolay embedleyebildigin,
    //ve embed'i goruntuleyebildigin + manuel copy superedit in this app yapabildigin,
    //2 farkli programda acabildigin ↓ (bunu dusundurdu)
    //ama geneda mentionlayabilmem icin hepsini parselaycam ve bilecem nerde biter each part
    //
    /* Maybe everything that seems like to start like a function could be
       parsed? and mentioned later in the markdown file ? (HARD) */

    //faster click to Ctrl + Shift + i to open dev console
    //
    //nasil calisir

    //Url gelecek biten extensiona gore file olusturacak vault ve icine koyacak webden
    //cekilen datayi sonra normal embed gibi caliscak?
    this.addRibbonIcon("dice", "superEdit", () => {
      this.app.plugins
        .disablePlugin(this.manifest.id)
        .then(() => this.app.plugins.enablePlugin(this.manifest.id));
      console.log("yes");
    });

    this.registerMarkdownPostProcessor(async (doc, ctx) => {
      //console.log("Processing markdown");

      const activeLeaf = this.app.workspace.activeLeaf;
      if (!activeLeaf) return;
      //console.log(activeLeaf);

      const currentFile = activeLeaf.view.file;
      if (!currentFile) return;
      //console.log(currentFile);

      const currentDir = currentFile.parent.path; //make dynamix move it under post process ?
      if (!currentDir) return; //true returns all parents except file
      console.log(currentDir);

      /* find all internal links using its class selector */
      for (let elem of doc.querySelectorAll(".internal-embed")) {
        //console.log("Found internal-embed element");
        /* the alt attribute is the file name */
        const fname = elem.getAttribute("alt");
        console.log(fname); //url or file name

        const filename = decodeURIComponent(fname.split("/").pop());
        console.log(filename); //decoded

        //create with path and file name ?
        const newFilePath =
          currentDir + "/" + filename.split(" ").join("_").toLowerCase(); //path + file

        const suffix = fname.split(".").pop(); // only extension
        //check these supports later !
        if (
          !suffix.match(
            /(c)|(cpp)|(js)|(json)|(hs)|(py)|(java)|(ts)|(go)|(php)|(css)|(html)|(sql)|(cs)|(r)/
          )
        ) {
          continue;
        }
        //await works here wait for the app probs to load or cache ?
        const fileExists = await this.app.vault.adapter.exists(newFilePath);
        console.log(fileExists);

        //http check: when file exist is it https continue;
        if (fileExists) {
          console.log(`File ${newFilePath} already exists`);
          //get file link from file name (with obsidian api)
          const flink = this.app.metadataCache.getFirstLinkpathDest(
            filename.split(" ").join("_").toLowerCase(), //whatever one word you type it will match the statement on left
            ""
          );
          console.log("File link: ", flink);

          // read file content from cache not cachedRead
          const fcontent = await this.app.vault.read(flink); //when url is broken this errors
          //console.log(`File content:\n${fcontent}`); //*** */
          // decorate file content with file suffix (suffix gives the layout i tried)*/
          const syntax = "```" + suffix + "\n" + fcontent + "\n```";
          //console.log(`Decorated content: ${syntax}`);

          // just clear the inner HTML
          elem.innerHTML = "";
          elem.style.pointerEvents = "none"; // disable pointer events (works, but gets rid of copy button too)
          //maybe use this then create 3 buttons for run in copy, run in cmd, open in vs code

          // create container element for code block
          const container = elem.createDiv({
            cls: [CodeEmbed.containerClass],
          });
          //container.style.zoom = "140%";
          container.style.fontSize = "1.1em"; /* it is also nice */

          //render highlighted code to code block (renders inside the container
          //where the code is with ``` tags)

          //create new leaf on right same file source mode functionality ?
          MarkdownRenderer.renderMarkdown(
            syntax,
            container,
            ctx.sourcePath,
            this
          );
        }
        //http check: when file exist
        else if (fname.startsWith("http")) {
          const flink = this.app.metadataCache.getFirstLinkpathDest(
            filename.split(" ").join("_").toLowerCase(), //whatever one word you type it will match the statement on left
            ""
          );
          console.log("File link: ", flink);

          const fileExists = await this.app.vault.adapter.exists(newFilePath);
          console.log(fileExists);
          //we get the url but cant get rid of click to create
          //instead bence create a new note in the current folder as the active one
          //with thew url and paste the fetch in there then it can be embedded same way
          fetch(fname)
            .then((res) => res.text())
            .then((data) => {
              // just clear the inner HTML
              const syntax = "```" + suffix + "\n" + data + "\n```";

              elem.innerHTML = "";
              elem.style.pointerEvents = "none"; // disable pointer events (works, but gets rid of copy button too)

              const container = elem.createDiv({
                cls: [CodeEmbed.containerClass],
              });
              container.style.fontSize = "1.1em"; /* it is also nice */

              //create new leaf on right same file source mode functionality ?
              MarkdownRenderer.renderMarkdown(
                syntax,
                container,
                ctx.sourcePath,
                this
              );

              this.app.vault.create(newFilePath, data);
              console.log(`File ${newFilePath} created`);
            });
        }
      }
    });

    //cant use button beacuse we disabled click events WHAT ELSE ?
    //const button = document.createElement("button");
    //container.appendChild(button);

    /*
          container.style.paddingTop = "5px"; // add padding to top of container
          const slider = document.createElement("input");
          slider.type = "range";
          slider.min = "0";
          slider.max = "150";
          container.appendChild(slider);
          */
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }

  //look here !
  async onunload() {
    //this.unregisterPostProcessor();
  }
};

//console.log(`File name: ${fname}`);

/* suffix for file name 
        const suffix = fname.split(".").pop();
        //console.log(`File suffix: ${suffix}`);

        const flink = this.app.metadataCache.getFirstLinkpathDest(fname, "");
        const vaultPath = this.app.vault.adapter.getBasePath();

        const fullPath = vaultPath + "\\" + flink.path.replaceAll("/", "\\");
        */
//console.log(`"${fullPath}"`);
//console.log(`"${fullPath.replace(fname, "")}"`);

//Also run cmd for quick git push ?
// Windows-specific command to open a new command prompt window

/*
        //PUT IN IF SO IT RUNS WHEN X IS CLICKED ?
        const commandPrompt = spawn(
          "cmd.exe",
          [
            "/c",
            "start",
            "cmd.exe",
            "/K",
            `python "${fname}"`,
            //"cd C:\\Users\\Mert Arkin\\Desktop\\GENEL PROJECTS and INFO\\CODES",
            //"dir",
          ],
          {
            shell: true,
            cwd: fullPath.replace(fname, ""),
          }
        );
        */

/*
        //keep track of errors on console
        commandPrompt.stdout.on("data", (data) => {
          console.log(`stdout: ${data}`);
        });

        commandPrompt.stderr.on("data", (data) => {
          console.error(`stderr: ${data}`);
        });

        commandPrompt.on("close", (code) => {
          console.log(`child process exited with code ${code}`);
        });
        */
// Once the new window is opened, run the 'dir' command
