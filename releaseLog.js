module.exports = class ReleaseLog {
  newVersionTag;
  log;
  regexFeatureTickets;
  regexDefectTickets;
  versionFolderPath;

  constructor(
    newVersionTag,
    log,
    regexFeatureTickets = REGEX_FEATURE_TICKETS,
    regexDefectTickets = REGEX_DEFECT_TICKETS,
    versionFolderPath = VERSION_FOLDER_PATH
  ) {
    this.newVersionTag = newVersionTag;
    this.log = log;
    this.regexFeatureTickets = regexFeatureTickets;
    this.regexDefectTickets = regexDefectTickets;
    this.versionFolderPath = versionFolderPath;
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
};
