const childProcess = require("child_process");
const fs = require("fs");

const PROD_BRANCH = "master";
const REGEX_FEATURE_TICKETS = /(TICK-F-[0-9]*|WSU-[0-9]*|TCP-[0-9]*)/g;
const REGEX_DEFECT_TICKETS = /(TICK-D-[0-9]*|WSU-D-[0-9]*|TCP-D-[0-9]*)/g;
const TAG_VERSION_NAMING = "release_v";
const VERSION_FOLDER_PATH = "./version_logs";

module.exports = class NodeTAGit {
  saveHTMLLogs;
  prodBranchName;
  tagVersionNaming;
  regexFeatureTickets;
  regexDefectTickets;
  versionFolderPath;
  lastTagVersion;
  newVersionTag;

  constructor(
    prodBranchName = PROD_BRANCH,
    tagVersionNaming = TAG_VERSION_NAMING,
    regexFeatureTickets = REGEX_FEATURE_TICKETS,
    regexDefectTickets = REGEX_DEFECT_TICKETS,
    saveHTMLLogs,
    versionFolderPath = VERSION_FOLDER_PATH
  ) {
    this.prodBranchName = prodBranchName;
    this.tagVersionNaming = tagVersionNaming;
    this.regexFeatureTickets = regexFeatureTickets;
    this.regexDefectTickets = regexDefectTickets;
    this.saveHTMLLogs = saveHTMLLogs;
    this.versionFolderPath = versionFolderPath;
  }

  gitHash() {
    const command = "git rev-parse --short HEAD";
    console.log(command);
    const result = childProcess
      .execSync(command)
      .toString()
      .trim();
    console.log("result: ", result);
    return result;
  }

  getLatestVersionTag() {
    const command = `git describe --tags ${
      this.prodBranchName
    } --abbrev=0 --match "${this.tagVersionNaming}*"`;

    let result = null;

    console.log(command);

    try {
      result = childProcess
        .execSync(command)
        .toString()
        .trim();
    } catch (err) {}

    console.log("result: ", result);

    this.lastTagVersion = result;

    return result;
  }

  isReleasingSameVersion() {
    const currentHash = this.gitHash();
    const command = `git log -1 --format=%h ${this.lastTagVersion}`;

    console.log(command);

    const tagHash = childProcess
      .execSync(command)
      .toString()
      .trim();

    const result = currentHash === tagHash;

    console.log("currentHash === tagHash: ", result);
    return result;
  }

  getTagDate() {
    const command = `git log -1 --format=%ai ${this.lastTagVersion}`;

    console.log(command);

    const result = childProcess
      .execSync(command)
      .toString()
      .trim();

    console.log("result: ", result);
    return result;
  }

  getCommitsFromLastReleaseToNow(tagDate) {
    // const isoTagDate = new Date(tagDate).toISOString();
    // 1 min extra added to not get log from previous version
    const mins = new Date(tagDate).getMinutes() + 1;
    const extraMin = new Date(tagDate).setMinutes(mins);
    const isoTagDate = new Date(extraMin).toISOString();

    const command = `git --no-pager log --since="${isoTagDate}" --no-merges --oneline --pretty=format:"%h%m%an%m%ad%m%s" --date=iso8601 ${
      this.prodBranchName
    }`;

    console.log(command);

    const result = childProcess
      .execSync(command)
      .toString()
      .trim();

    console.log("result: ", result);
    this.log = result;

    return result;
  }

  pushNewTagVersion(newTag) {
    // const command = 'git tag ' + newTag + ' ' + this.prodBranchName + ';git push --follow-tags';
    const command = `git tag ${newTag} ${this.prodBranchName}`;

    console.log(command);

    const result = childProcess
      .execSync(command)
      .toString()
      .trim();

    console.log("result: ", result, " new version tag pushed");
  }

  getCurrentBranch() {
    const command = "git rev-parse --abbrev-ref HEAD";
    console.log(command);
    const result = childProcess
      .execSync(command)
      .toString()
      .trim();
    console.log("result: ", result);
    return result;
  }

  getNewTagVersion() {
    const isThereLog = this.log !== "";
    let isFeatureTicketPresent = false;
    let isDefectTicketPresent = false;
    let commitMessage;

    if (isThereLog) {
      const logByLine = this.log.split("\n");

      logByLine.forEach(item => {
        commitMessage = item.split(">")[3] || "";

        if (commitMessage.match(this.regexFeatureTickets)) {
          isFeatureTicketPresent = true;
        }

        if (commitMessage.match(this.regexDefectTickets)) {
          isDefectTicketPresent = true;
        }
      });
    }

    if (isThereLog) {
      let versionTag = this.lastTagVersion.split(".");
      let MAJOR = versionTag[0];
      let MINOR = parseInt(versionTag[1] || 0) + 1;
      let PATCH = versionTag[2] || 0;

      // it should check only isFeatureTicketPresent but for now
      // in case the ticket number was not present on feature branch and there's log we'll increase version anyway
      versionTag =
        isThereLog || isFeatureTicketPresent
          ? `${MAJOR}.${MINOR}.${PATCH}`.split(".")
          : versionTag;

      // should be uncommented out when the branch strategy is working properly
      // versionTag = isFeatureTicketPresent ? (versionTag[0] + '.' + (parseInt(versionTag[1] || 0) + 1) + '.' + (versionTag[2] || 0) ).split('.') : versionTag;

      if (isDefectTicketPresent && !isFeatureTicketPresent) {
        MAJOR = versionTag[0];
        MINOR = versionTag[1] || 0;
        PATCH = parseInt(versionTag[2] || 0) + 1;

        versionTag = `${MAJOR}.${MINOR}.${PATCH}`.split(".");
      } else if (isDefectTicketPresent && isFeatureTicketPresent) {
        MAJOR = versionTag[0];
        MINOR = versionTag[1] || 0;
        PATCH = "1";

        versionTag = `${MAJOR}.${MINOR}.${PATCH}`.split(".");
      }

      this.newVersionTag = versionTag.join(".");
    } else {
      this.newVersionTag = this.lastTagVersion;
    }

    return this.newVersionTag;
  }

  generateHTMLVersionLog() {
    const versionFile = `${this.versionFolderPath}${this.newVersionTag}.html`;

    const allFeatureTickets = (
      this.log.match(this.regexFeatureTickets) || []
    ).filter(item => item.length > 4);

    const allDefectsTickets = (
      this.log.match(this.regexDefectTickets) || []
    ).filter(item => item.length > 4);

    const tickets = allFeatureTickets.join(", ") + allDefectsTickets.join(", ");

    fs.writeFileSync(
      versionFile,
      `
        <html>
          <head>
          </head>
          <body>
            <h1>Version: ${this.newVersionTag}</h1>
            <h3>Ticket(s): ${tickets || "No tickets detected in log."}</h3>
            <pre>${this.log}</pre>
            <i>As of date ${new Date()}</i>
          </body>
        </html>
      `
    );

    const files = fs.readdirSync(this.versionFolderPath);

    const links = (files || [])
      .filter(item => item !== "index.html")
      .map(file => `<a href="${file}">${file}</a>`)
      .reverse();

    const indexHTML = `${this.versionFolderPath}index.html`;

    fs.writeFileSync(
      indexHTML,
      `
        <html>
          <body>
            <h1>Versions list:</h1>
            ${links.join("<br>")}
            <br><br>
            ${asOfDate}
          </body>
        </html>
      `
    );
  }

  run() {
    try {
      if (this.getCurrentBranch() === this.prodBranchName) {
        const lastTagVersion = this.getLatestVersionTag();

        if (lastTagVersion) {
          if (!this.isReleasingSameVersion()) {
            const log = this.getCommitsFromLastReleaseToNow(this.getTagDate());
            const newTagVersion = this.getNewTagVersion();

            if (newTagVersion !== lastTagVersion && log !== "") {
              console.log("newTagVersion: ", newTagVersion);
              if (this.saveHTMLLogs) this.generateHTMLVersionLog();
              this.pushNewTagVersion(newTagVersion);
            } else {
              console.warn(
                "No log changes/features detected. Tag version not applied."
              );
            }
          } else {
            console.warn("No changes on release. Tag version not applied.");
          }
        } else {
          this.pushNewTagVersion(`${this.tagVersionNaming}1.0.0`);
        }
      } else {
        console.warn(
          "Versioning process only applied to PRODUCTION deployment."
        );
      }
    } catch (error) {
      console.log(error);
    }
  }
};