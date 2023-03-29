const {
  MarkdownRenderer,
  Plugin,
  MarkdownView,
  PluginSettingTab,
  Setting,
} = require("obsidian");
//Maybe you can get rid of all the settings ?
const DEFAULT_SETTINGS = {
  mySetting: "default",
  dateFormat: "YYYY-MM-DD",
};

class SettingsWindow extends PluginSettingTab {
  /* extends https://marcus.se.net/obsidian-plugin-docs/reference/typescript/classes/SettingTab */
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    var container = this.containerEl;
    container.empty();
    new Setting(container)
      .setName("Hi I am setting")
      .setDesc("This should be a descritpiton loremm ipsum bvla /...")
      .addText((text) =>
        text
          .setPlaceholder("MMMM dd, yyyy")
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value) => {
            //on change how to use
            this.plugin.settings.dateFormat = value;
            await this.plugin.saveSettings();
          })
      );
    console.log("hi"); //prints everytime user goes on settings tab (saves and loads data)
  }
}

module.exports = class CodeEmbed extends Plugin {
  //give any css class name
  static containerClass = "code-embed";
  //static titleClasses = ["code-embed-title", ""];
  //static errorClass = "code-embed-error";

  async test() {
    //const currentView = this.app.workspace.getActiveViewOfType(MarkdownView);
    //https://discord.com/channels/686053708261228577/1060148949878571089/1085786486856744990
    this.app.workspace.onLayoutReady(async () => {
      const activeLeaff = this.app.workspace.activeLeaf;
      const state = activeLeaff.getViewState();
      state.state.mode = "source";
      this.app.workspace.activeLeaf.setViewState(state);
      console.log(activeLeaff);

      const newLeaf = await this.app.workspace.duplicateLeaf(
        activeLeaff,
        "split",
        "vertical"
      );
      console.log(newLeaf); //automatically becomes activeleaf and also both source so user chooses what side ?
      //this.app.workspace.setActiveLeaf(newLeaf);
      //console.log("setting active\n");
      //console.log(this.app.workspace.activeLeaf); //old one will stay as old always call again or dynamically check
      //const state1 = this.app.workspace.activeLeaf.getViewState();
      //state1.state.mode = "source";
      state.state.mode = "source";
      this.app.workspace.activeLeaf.setViewState(state);
    });
    /*activeLeaff.setViewState({
      type: "preview",
    });
    */
  }

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SettingsWindow(this.app, this));
    console.log("CodeEmbed plugin loaded");

    this.addRibbonIcon("dice", "superEdit", () => {
      this.app.plugins
        .disablePlugin(this.manifest.id)
        .then(() => this.app.plugins.enablePlugin(this.manifest.id));
      this.test();
    });

    /* MOVE THIS BLOCK OUT OF registerMarkdownPostProcessor to run it once ? - why ? - */
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf) return;
    //console.log(activeLeaf);
    const currentFile = activeLeaf.view.file;
    if (!currentFile) return;
    //console.log(currentFile);
    const currentDir = currentFile.parent.path; //make dynamix move it under post process ? NO RUNS TWICE
    if (!currentDir) return; //true returns all parents except file
    //console.log(currentDir); //returns where current file is (which folder)
    /* IT WILL INITIALIZE AT THE START (enable event of plugin) */
    this.registerMarkdownPostProcessor(async (doc, ctx) => {
      //console.log("Processing markdown");
      /* find all internal links using its class selector */
      for (let elem of doc.querySelectorAll(".internal-embed")) {
        //console.log("Found internal-embed element");
        /* the alt attribute is the file name inside embed tags */
        const fname = elem.getAttribute("alt");
        //console.log(fname); //url or file name
        const filename = decodeURIComponent(fname.split("/").pop());
        //console.log(filename); //decoded
        //This all works
        //console.log(fname);
        //console.log(filename);
        // const a = this.app.metadataCache.getFirstLinkpathDest(filename, "");
        // const b = this.app.vault.getAbstractFileByPath(a.path);
        // console.log(a);
        // console.log(b.path);
        const suffix = fname.split(".").pop(); // only extension
        //create with path and file name ? use the codes above to search in all vault not current folders
        const newFilePath =
          currentDir + "/" + filename.split(" ").join("_").toLowerCase(); //path + file
        const fileExists = await this.app.vault.adapter.exists(newFilePath);
        /*
        if (
          !suffix.match(
            /(c)|(cpp)|(js)|(json)|(hs)|(py)|(java)|(ts)|(go)|(php)|(css)|(html)|(sql)|(cs)|(r)/
          )
        ) {
          console.log("it matches");
          continue;
        }
        */
        //check these supports later !
        //varolan dosya'larda sikinti yaratir (varsa bu yyoksa bunlar sonra bu) seklinde yaz programi
        // const flink = this.app.metadataCache.getFirstLinkpathDest(
        //   filename.split(" ").join("_").toLowerCase(), //whatever one word you type it will match the statement on left
        //   ""
        // ); // .parent.path all the path until file, .path all the path including file
        // console.log("File link: ", flink.path);

        //await works here wait for the app probs to load or cache ?
        //console.log("File exists: " + fileExists);
        //http check: when file exist is it https continue;

        // if (!fileExists) {
        //   console.log("file doesnt exist.. creating one");
        // }
        // if (fileExists) {
        //http check: when file exist
        //it can fetch and display no need for file but we will give user option to create a file with it boolean
        if (fname.startsWith("http")) {
          if (!fileExists) {
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
              });
            //this.app.vault.create(newFilePath, data);
            //console.log(`File ${newFilePath} created`);
          } else {
            //if exists user wants to save !
            const flink = this.app.metadataCache.getFirstLinkpathDest(
              filename.split(" ").join("_").toLowerCase(), //whatever one word you type it will match the statement on left
              ""
            );
            //console.log("File link: ", flink);
            console.log("file starts with http");
            const fileExists = await this.app.vault.adapter.exists(newFilePath);
            console.log(fileExists);
            //FINISH THIS LATER ALSO RENDER (methodla renderi)
          }
        } else {
          //this gets the file which is there already (local codes)
          console.log("normal file already exists");
          //console.log(`File ${newFilePath} already exists`);
          //get file link from file name (with obsidian api)
          const flink = this.app.metadataCache.getFirstLinkpathDest(
            filename.split(" ").join("_").toLowerCase(), //whatever one word you type it will match the statement on left
            ""
          ); //dont use split support with spaces
          //console.log("File link: ", flink);
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
      }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onunload() {
    //console.log("UNREGISTERING..."); //(try to register some stuff here)
  }
};
