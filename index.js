const childProcess = require("child_process");
const fs = require("fs");

const PROD_BRANCH = "master";
const REGEX_FEATURE_TICKETS = /(F-[0-9]*|FEATURE-[0-9]*|FR-[0-9]*)/g;
const REGEX_DEFECT_TICKETS = /(D-[0-9]*|DEFECT-[0-9]*|BUG-[0-9]*|BUGFIX-[0-9]*)/g;
const TAG_VERSION_NAMING = "v";
const INITIAL_TAG_VERSION = "0.1.0";
const VERSION_FOLDER_PATH = "./version_logs";

module.exports = class NodeTAGit {
  saveHTMLLogs;
  prodBranchName;
  tagVersionNaming;
  initialTagVersion;
  regexFeatureTickets;
  regexDefectTickets;
  versionFolderPath;
  lastTagVersion;
  newVersionTag;

  constructor(
    prodBranchName = PROD_BRANCH,
    tagVersionNaming = TAG_VERSION_NAMING,
    initialTagVersion = INITIAL_TAG_VERSION,
    regexFeatureTickets = REGEX_FEATURE_TICKETS,
    regexDefectTickets = REGEX_DEFECT_TICKETS,
    saveHTMLLogs,
    versionFolderPath = VERSION_FOLDER_PATH
  ) {
    this.prodBranchName = prodBranchName;
    this.tagVersionNaming = tagVersionNaming;
    this.initialTagVersion = initialTagVersion;
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
    const command = `git describe --tags ${this.prodBranchName} --abbrev=0 --match "${this.tagVersionNaming}*"`;

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

    const command = `git --no-pager log --since="${isoTagDate}" --no-merges --oneline --pretty=format:"%h%m%an%m%ad%m%s" --date=iso8601 ${this.prodBranchName}`;

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

  findTicket(regex) {
    let isTicketPresent = false;

    if (!!this.log) {
      const logByLine = this.log.split("\n");

      logByLine.forEach(item => {
        if ((item.split(">")[3] || "").match(regex)) isTicketPresent = true;
      });
    }

    return isTicketPresent;
  }

  getNewReleaseTagVersion() {
    console.log("this.log: ", this.log);

    if (!!this.lastTagVersion) {
      const versionTag = this.lastTagVersion.split(".");
      const MAJOR = versionTag[0];
      const MINOR = parseInt(versionTag[1] || 0) + 1;

      return `${MAJOR}.${MINOR}`.replace(this.tagVersionNaming, "release_");
    } else if (!this.log || !this.lastTagVersion) {
      return `release_${this.initialTagVersion}`;
    }
  }

  getNewTagVersion() {
    let isFeatureTicketPresent = this.findTicket(this.regexFeatureTickets);
    let isDefectTicketPresent = this.findTicket(this.regexDefectTickets);

    if (!!this.log) {
      let versionTag = this.lastTagVersion.split(".");
      let MAJOR;
      let MINOR;
      let PATCH;

      if (isDefectTicketPresent && !isFeatureTicketPresent) {
        MAJOR = versionTag[0];
        MINOR = versionTag[1] || 0;
        PATCH = parseInt(versionTag[2] || 0) + 1;

        versionTag = `${MAJOR}.${MINOR}.${PATCH}`.split(".");
      }

      if (
        (isDefectTicketPresent && isFeatureTicketPresent) ||
        (!isDefectTicketPresent && isFeatureTicketPresent)
      ) {
        MAJOR = versionTag[0];
        MINOR = parseInt(versionTag[1] || 0) + 1;
        PATCH = "0";

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
              this.pushNewTagVersion(this.getNewReleaseTagVersion());
            } else {
              console.warn(
                "No log changes/features detected. Tag version not applied."
              );
            }
          } else {
            console.warn("No changes on release. Tag version not applied.");
          }
        } else {
          this.pushNewTagVersion(
            `${this.tagVersionNaming}${this.initialTagVersion}`
          );
          this.pushNewTagVersion(`release_${this.initialTagVersion}`);
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
