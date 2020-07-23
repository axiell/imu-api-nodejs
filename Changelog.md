# Changelog
All notable changes to this project will be documented in this file.

## [0.5.5] - 2020-07-24
### Security
- Update dependencies to eliminate prototype pollution through loadash < 4.17.19

## [0.5.4]
### Added
- New package-lock.json file
### Changed
- Package now published to private nexus repository
- NPM pack now ignores VSCode .editorconfig files
### Fixed
- Fixed lint errors
### Security
- Update dependencies to remove vulnerability in minimist package

## [0.5.3]
### Changed
- Tidied example scripts
### Fixed
- Fixed stream issues in Node >= 10 preventing session logout
- Fixed lint errors
- Fixed useage of depricated Buffer

## [0.5.2] - 2019-07-24
### Security
- Updated dependencies to eliminate any transitive dependency on lodash < 4.17.13

## [0.5.1] - 2018-02-05
### Fixed
- Fixed context id being cleared from session before logout request is sent, causing logouts to run on the default context.
