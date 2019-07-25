# Changelog
All notable changes to this project will be documented in this file.

## [0.5.1] - 2018-02-05
### Fixed
- Fixed context id being cleared from session before logout request is sent, causing logouts to run on the default context.

## [0.5.2] - 2019-07-24
### Security
- Updated dependencies to eliminate any transitive dependency on lodash < 4.17.13
