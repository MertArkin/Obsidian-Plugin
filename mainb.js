const {
  Plugin,
  ItemView,
  MarkdownView,
  PluginSettingTab,
  Setting,
  WorkspaceLeaf,
} = require("obsidian");

const VIEW_TYPE_EXAMPLE = "link-view";

const DEFAULT_SETTINGS = {
  dateFormat: "YYYY-MM-DD",
};

//IMPORT OTHER CLASSES FROM OTHER FILES ???
class ExampleView extends ItemView {
  constructor(leaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return "~ Link View ~";
  }

  async onOpen() {
    const currentView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (currentView == null) {
      return;
    } else {
      const viewData = currentView.getViewData();
      //console.log(viewData); //does get data !
    }
    const currentFile = currentView.file;
    if (currentFile == null) {
      return;
    }
    const cursor = currentView.editor.getCursor();
    const line = currentView.editor.getLine(cursor.line);

    const regex = /(https?:\/\/[^\s]+)/;
    const matches = line.match(regex);
    if (matches == null) {
      console.log("hotkey pressed on a blank space"); //use if else here !
      return;
    }
    const url = matches[1];
    console.log(url);

    this.div = document.createElement("div");
    this.button = document.createElement("button");
    this.button.addClass("copycurrenturl");
    this.button.setText("Test");
    this.div.setAttr("id", "div1");

    this.div.appendChild(this.button);

    this.frame = document.createElement("iframe");
    //both below works
    //console.log(this.getViewType());
    //console.log(this.getDisplayText());
    const container = this.containerEl.children[1];
    container.empty();

    container.createEl("h4", { text: this.getDisplayText() });
    this.frame.setAttr("style", "height: 100%; width:100%");
    this.frame.setAttr("tabindex", "0");
    this.frame.setAttr("src", url);

    this.containerEl.children[1].appendChild(this.div);
    this.containerEl.children[1].appendChild(this.frame);

    /*
    both works
    this.button.onClickEvent(() => {
      console.log("buttonclickedonly");
    });

    this.button.addEventListener("click", () => {
      console.log("buttonclickedonly");
    });
    */
  }

  async onClose() {
    // Nothing to clean up.
  }
}

//settings class
//https://marcus.se.net/obsidian-plugin-docs/user-interface/settings ***
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
      .addText(
        (text) =>
          text
            .setPlaceholder("MMMM dd, yyyy")
            .setValue(this.plugin.settings.dateFormat)
        //on change how to use
        /*
          .onChange(async (value) => {
            this.plugin.settings.dateFormat = value;
            await this.plugin.saveSettings();
          })
          */
      );
    console.log("hi"); //prints everytime click (load and save data !)
  }
}

//MAIN MODULE
// bak chatgpt answer https://chat.openai.com/chat/8350c26f-f623-48fd-bc86-14d40a682197
module.exports = class ExamplePlugin extends Plugin {
  //load most stuff on async onload ?
  async onload() {
    //load the settings panel
    await this.loadSettings();
    //https://marcus.se.net/obsidian-plugin-docs/reference/typescript/classes/PluginSettingTab
    this.addSettingTab(new SettingsWindow(this.app, this));

    //loads and *reloads* the plugin mapped to ribbon icon
    this.addRibbonIcon("dice", "reset plugin", () => {
      this.app.plugins
        .disablePlugin(this.manifest.id)
        .then(() => this.app.plugins.enablePlugin(this.manifest.id));
      console.log("yes");
      // new Notice("Hello World");
      //https://marcus.se.net/obsidian-plugin-docs/reference/manifest + dir
      new Notice("reset plugin - " + this.manifest.name);
      //console.log(this.manifest.dir);
    });

    this.addRibbonIcon("gear", "launch VScode", () => {
      new Notice("Launching vscode");
      //launches vs code but more customization could be added to open current selected text or note ?
      //https://github.com/NomarCub/obsidian-open-vscode
      //https://www.google.com/search?q=window+open+js
      window.open("vscode://"); //opens whatever is last opened | no path or param specified bak buna !
    });

    //var n = 0;
    //this below does closes all of them - change it the current ?
    //nice every time in opens, closes, and when closes clears tabs [nice]
    this.addRibbonIcon("link", "Clear links", () => {
      if (this.app.workspace.rightSplit.collapsed == true) {
        this.app.workspace.rightSplit.expand();
      } else if (this.app.workspace.rightSplit.collapsed == false) {
        this.app.workspace.rightSplit.collapse();
      }
      this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE).forEach((leaf) => {
        if (leaf.view instanceof ExampleView) {
          // Access your view instance.
          this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);
          //this.app.workspace.rightSplit.collapse();
        }
      });
    });

    this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new ExampleView(leaf));

    //registermarkdownpostprocessor
    /*
    this.registerMarkdownPostProcessor((el, ctx) => {
      const codeblocks = el.querySelectorAll("a");
      for (let index = 0; index < codeblocks.length; index++) {
        const codeblock = codeblocks.item(index);
        const url = codeblock.href;
        console.log(url);
        if (url.startsWith("http")) {
          codeblock.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("clicked " + url);
          });
        }
      }
    });
    */

    //add a hotkey of opening only links - change it in settings later
    this.addCommand({
      id: "display-links",
      name: "Display links in obsidian window",
      hotkeys: [
        {
          modifiers: ["Ctrl", "Shift"],
          key: "C",
          action: "pressed",
        },
      ],
      callback: () => {
        this.activateView();
      },
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);
  }

  async activateView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);
    console.log(leaves.length); //0 is start then goes 1,2,3 for each open leaf

    //comment this to unstack tabs as hotkey pressed
    //uncomment and use 0 instead of leaves.length in revealLeaf method
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);

    await this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_EXAMPLE,
      active: true,
    });

    /*await - bak belki kullanin ama nerde tam nasil kullanilir*/
    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0]
    );
    //n += 1; //ileri tracklar ama daha once acik olani gostermez,
    //cokta buyuk problem degil cunku user isterse 2 tane ayni page 1 tane
    //da farkli, acsin tek tek sonra manuel yerlerini degistirir
  }
};
