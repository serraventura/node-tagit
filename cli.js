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

console.log(targetBranchName);

new NodeTAGit(
    targetBranchName, 
    initialTagVersion, 
    regexFeatureTickets, 
    regexDefectTickets, 
    saveHTMLLogs, 
    versionFolderPath, 
    tagVersionNaming
).run();
