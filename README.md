# node-tagit
Opinionated auto bump SEMVER implementation. Bump your APP versions based in your branch naming convention.

Example
```
feature/WTF-123 merged into master
 - bumps MINOR

bug/WTF-456 merged into master
 - bumps PATCH
```
 - **MAJOR** needs to be bumped manually. More detail on documentation.

## Install

## How to
As soon as your production pipeline is triggered node-tagit CLI can be executed to bump the new version

### CLI

```
tagit
```

### Overring default configurations
```
tagit "my_prod_branch" v1.0.0 "(feat-[0-9]*)" "(bugfix-[0-9]*)" true ./log_folder my_custom_release_tag
```

Arguments
- **"my_prod_branch"** - The name of your production branch - defaults to **master**
- **v1.0.0** - The initial version, the first tag version when there are no previous tags - defaults to **v0.1.0**
- **"(feat-[0-9]*)"** - Regex for your naming convention for features. If your PR title matchs regex MINOR bumps - defaults to **search by constants on the code**
- **"(bugfix-[0-9]*)"** - Regex for your naming convention for bugs. If your PR title matchs regex PATCH bumps - defaults to **search by constants on the code**
- **true** - Generates log files when true - defaults to **false**
- **./log_folder** - log files location - defaults to **./version_logs**
- **my_custom_release_tag** - An extra sequencial tag verison is created by default, you can give a custom name to it - defaults to **release_**

