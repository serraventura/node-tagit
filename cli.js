#!/usr/bin/env node

const NodeTAGit = require("./index");

const [
    ,
    ,
    targetBranchName,
    initialTagVersion,
    regexFeatureTickets,
    regexDefectTickets,
    saveHTMLLogs,
    versionFolderPath,
    tagVersionNaming
] = process.argv

new NodeTAGit(
    targetBranchName,
    initialTagVersion,
    regexFeatureTickets,
    regexDefectTickets,
    saveHTMLLogs,
    versionFolderPath,
    tagVersionNaming
).run();
